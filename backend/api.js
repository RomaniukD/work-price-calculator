const express = require('express');
const { db_all, db_get } = require('./database');
const { updatePrices, syncStructure, getDemoData, saveToDatabase } = require('./parser');

const router = express.Router();

// GET /categories - returns all categories with subcategories and tasks
router.get('/categories', async (req, res) => {
  try {
    // Get all categories
    const categories = await db_all('SELECT * FROM categories ORDER BY name');
    const result = [];
    
    for (const category of categories) {
      // Get subcategories for this category
      const subcategories = await db_all(
        'SELECT * FROM subcategories WHERE category_id = ? ORDER BY name',
        [category.id]
      );
      
      const subcategoriesData = [];
      
      for (const subcategory of subcategories) {
        // Get tasks for this subcategory
        const tasks = await db_all(
          'SELECT * FROM tasks WHERE subcategory_id = ? ORDER BY name',
          [subcategory.id]
        );
        
        subcategoriesData.push({
          id: subcategory.id,
          name: subcategory.name,
          href: subcategory.href,
          tasks: tasks
        });
      }
      
      result.push({
        id: category.id,
        name: category.name,
        subcategories: subcategoriesData
      });
    }

    return res.json(result);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /setup-structure - initially parse and save categories/subcategories
router.post('/setup-structure', async (req, res) => {
  try {
    const { sourceUrl } = req.body;
    
    if (!sourceUrl) {
      return res.status(400).json({ 
        error: 'sourceUrl is required in request body' 
      });
    }
    
    const result = await syncStructure(sourceUrl);
    
    res.json({
      success: true,
      message: 'Categories and subcategories setup completed',
      data: result
    });
  } catch (error) {
    console.error('Error setting up structure:', error);
    res.status(500).json({ 
      error: 'Failed to setup structure',
      message: error.message 
    });
  }
});

// POST /update-prices - updates tasks/prices from existing DB structure
router.post('/update-prices', async (req, res) => {
  try {
    const baseUrl = "https://www.rabotniki.ua";
    
    if (!baseUrl) {
      return res.status(400).json({ 
        error: 'baseUrl is required in request body' 
      });
    }
    
    const result = await updatePrices(baseUrl);
    
    res.json({
      success: true,
      message: 'Prices updated successfully',
      data: result
    });
  } catch (error) {
    console.error('Error updating prices:', error);
    res.status(500).json({ 
      error: 'Failed to update prices',
      message: error.message 
    });
  }
});

// POST /update-prices-demo - uses demo data (for testing without source website)
router.post('/update-prices-demo', async (req, res) => {
  try {
    const demoData = getDemoData();
    const result = await saveToDatabase(demoData);
    
    res.json({
      success: true,
      message: 'Demo data loaded successfully',
      data: result
    });
  } catch (error) {
    console.error('Error updating prices with demo data:', error);
    res.status(500).json({ 
      error: 'Failed to update prices with demo data',
      message: error.message 
    });
  }
});

// GET /health - status check
router.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// GET /info - info about the API
router.get('/info', (req, res) => {
  res.json({
    message: 'Price Counter Backend API',
    workflow: [
      'Step 1: POST /api/setup-structure - Parse and save categories/subcategories',
      'Step 2: POST /api/update-prices - Parse and update tasks/prices from existing structure',
      'Step 3: GET /api/categories - Retrieve all data'
    ],
    endpoints: {
      'GET /api/categories': 'Get all categories with subcategories and tasks',
      'GET /api/health': 'Health check',
      'GET /api/info': 'API information',
      'GET /api/debug-structure': 'Debug parser - shows what selectors find',
      'POST /api/setup-structure': 'Initial setup - parse categories/subcategories (body: {sourceUrl})',
      'POST /api/update-prices': 'Update prices - parse tasks from existing structure (body: {baseUrl})',
      'POST /api/update-prices-demo': 'Load demo prices (for testing)'
    }
  });
});

// GET /debug-structure - debug what the parser finds
router.get('/debug-structure', async (req, res) => {
  try {
    const axios = require('axios');
    const cheerio = require('cheerio');
    const url = req.query.url || 'https://www.rabotniki.ua/uk/price';

    console.log('Debug parsing:', url);
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const debug = {
      url,
      selectors: {
        'div.card': $('div.card').length,
        'div.card.border-primary': $('div.card.border-primary').length,
        'div.card.border-primary.mb-4': $('div.card.border-primary.mb-4').length,
        'div.card.border-primary.mb-4.shadow-sm': $('div.card.border-primary.mb-4.shadow-sm').length,
      },
      h4Elements: [],
      categoryElements: []
    };

    // Collect h4 elements
    $('h4').each((i, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 0) {
        debug.h4Elements.push(text);
      }
    });

    // Collect categories with current selector
    $('div.card.border-primary.mb-4.shadow-sm').each((i, el) => {
      const categoryName = $(el).find('h4 span.text-uppercase').text().trim();
      const subcategoriesCount = $(el).find('li.col-md-6.mb-1.text-truncate').length;
      
      if (categoryName) {
        debug.categoryElements.push({
          index: i,
          name: categoryName,
          subcategoriesCount
        });
      }
    });

    res.json(debug);
  } catch (error) {
    console.error('Debug error:', error.message);
    res.status(500).json({
      error: 'Debug failed',
      message: error.message
    });
  }
});

module.exports = router;
