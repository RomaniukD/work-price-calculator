const axios = require("axios");
const cheerio = require("cheerio");
const { db_run, db_get, db_all, clearDatabase } = require("./database");
require('dotenv').config();

const sourceUrl = process.env.SOURCE_URL;

let categoryCounter = 0;
let subcategoryCounter = 0;
let taskCounter = 0;

const resetIdCounters = () => {
  categoryCounter = 0;
  subcategoryCounter = 0;
  taskCounter = 0;
};

const generateCategoryId = () => `cat_${++categoryCounter}`;
const generateSubcategoryId = () => `subcat_${++subcategoryCounter}`;
const generateTaskId = () => `task_${++taskCounter}`;

// Parse tasks from a subcategory page
const parseSubcategoryTasks = async (subcategoryHref) => {
  try {
    const fullUrl = `${sourceUrl}${subcategoryHref}`;
    console.log(`Fetching tasks from: ${fullUrl}`);
    
    const response = await axios.get(fullUrl);
    const $ = cheerio.load(response.data);
    
    const tasks = [];
    
    $("li.list-group-item").each((idx, liEl) => {
      // Extract task name from a.stretched-link
      const taskName = $(liEl).find("a.stretched-link").text().trim();
      
      // Extract price from b.d-block.d-sm-inline
      const priceText = $(liEl).find("b.d-block.d-sm-inline").text().trim();
      const price = parseFloat(priceText) || 0;
      
      // Extract unit from small.text-nowrap
      const unit = $(liEl).find("small.text-nowrap").text().trim();
      
      if (taskName && price > 0) {
        tasks.push({
          id: generateTaskId(),
          name: taskName,
          price: price,
          unit: unit || "грн"
        });
      }
    });
    
    return tasks;
  } catch (error) {
    console.error(`Error parsing tasks from ${subcategoryHref}:`, error.message);
    return [];
  }
};

// Parse categories and subcategories from source website (for initial setup)
const parseWebsiteStructure = async () => {
  const url = `${sourceUrl}uk/price`;
  try {
    console.log("Fetching website structure:", url);
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const data = [];
    resetIdCounters();

    console.log("Looking for categories with selector: div.card.border-primary.mb-4.shadow-sm");
    const categoryElements = $("div.card.border-primary.mb-4.shadow-sm");
    console.log(`Found ${categoryElements.length} category elements`);

    $("div.card.border-primary.mb-4.shadow-sm").each((catIndex, categoryEl) => {
      const categoryName = $(categoryEl)
        .find("h4 span.text-uppercase")
        .text()
        .trim();

      console.log(`Category ${catIndex}: "${categoryName}"`);
      
      if (!categoryName) {
        console.log(`Skipping category ${catIndex} - no name found`);
        return;
      }

      const categoryId = generateCategoryId();
      const category = {
        id: categoryId,
        name: categoryName,
        subcategories: [],
      };

      const subcategoryElements = $(categoryEl).find("li.col-md-6.mb-1.text-truncate");
      console.log(`  Found ${subcategoryElements.length} subcategories in "${categoryName}"`);

      $(categoryEl)
        .find("li.col-md-6.mb-1.text-truncate")
        .each((subIndex, subEl) => {
          const subcategoryName = $(subEl).find("a.text-body").text().trim();
          const subCategoryHref = $(subEl).find("a.text-body").attr("href");
          
          console.log(`    Subcategory ${subIndex}: "${subcategoryName}" href="${subCategoryHref}"`);
          
          if (!subcategoryName) {
            console.log(`    Skipping - no name`);
            return;
          }

          const subcategoryId = generateSubcategoryId();
          const subcategory = {
            id: subcategoryId,
            categoryId: categoryId,
            name: subcategoryName,
            href: subCategoryHref,
            tasks: [],
          };

          category.subcategories.push(subcategory);
        });
        data.push(category);
      });
      
      saveToDatabase(data)
    return data;
  } catch (error) {
    console.error("Error parsing website structure:", error.message);
    throw error;
  }
};

// Fetch categories and subcategories from DB, then parse tasks from website
const parseWebsite = async (baseUrl) => {
  try {
    console.log("Fetching categories and subcategories from database...");
    // Get all categories from DB
    const categories = await db_all("SELECT * FROM categories ORDER BY name");
    const data = [];
    for (const category of categories) {
      const categoryData = {
        name: category.name,
        subcategories: []
      };
      // Get subcategories for this category
      const subcategories = await db_all(
        "SELECT id, name, href FROM subcategories WHERE category_id = ? ORDER BY name",
        [category.id]
      );
      for (const subcategory of subcategories) {
        const subcategoryData = {
          name: subcategory.name,
          href: subcategory.href,
          tasks: []
        };
        
        // Parse tasks from the subcategory URL
        if (subcategory.href) {
          try {
            const tasks = await parseSubcategoryTasks(subcategory.href);
            subcategoryData.tasks = tasks;
            console.log(`Found ${tasks.length} tasks in ${subcategory.name}`);
          } catch (error) {
            console.error(`Error fetching tasks for ${subcategory.name}:`, error.message);
          }
        }
        
        categoryData.subcategories.push(subcategoryData);
      }
      
      data.push(categoryData);
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching data:", error.message);
    throw error;
  }
};

// Save parsed data to database
const saveToDatabase = async (categoriesData) => {
  try {
    // Clear existing data
    // await clearDatabase();
    console.log("Database cleared");

    let insertedCategories = 0;
    let insertedSubcategories = 0;
    let insertedTasks = 0;
    for (const category of categoriesData) {
      // Insert or find category
      let categoryId;
      const existingCategory = await db_get(
        "SELECT id FROM categories WHERE name = ?",
        [category.name],
      );

      if (existingCategory) {
        categoryId = existingCategory.id;
      } else {
        const result = await db_run(
          "INSERT INTO categories (name) VALUES (?)",
          [category.name],
        );
        categoryId = result.id;
        insertedCategories++;
      }

      // Process subcategories
      for (const subcategory of category.subcategories) {
        // Insert or find subcategory
        let subcategoryId;
        const existingSubcategory = await db_get(
          "SELECT id FROM subcategories WHERE category_id = ? AND name = ?",
          [categoryId, subcategory.name],
        );

        if (existingSubcategory) {
          subcategoryId = existingSubcategory.id;
        } else {
          const result = await db_run(
            "INSERT INTO subcategories (category_id, name, href) VALUES (?, ?, ?)",
            [categoryId, subcategory.name, subcategory.href || ""],
          );
          subcategoryId = result.id;
          insertedSubcategories++;
        }

        // Process tasks
        for (const task of subcategory.tasks) {
          const existingTask = await db_get(
            "SELECT id FROM tasks WHERE subcategory_id = ? AND name = ?",
            [subcategoryId, task.name],
          );

          if (existingTask) {
            // Update existing task
            await db_run(
              "UPDATE tasks SET price = ?, unit = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
              [task.price, task.unit || 'грн', existingTask.id],
            );
          } else {
            // Insert new task
            await db_run(
              "INSERT INTO tasks (subcategory_id, name, price, unit) VALUES (?, ?, ?, ?)",
              [subcategoryId, task.name, task.price, task.unit || 'грн'],
            );
            insertedTasks++;
          }
        }
      }
    }

    console.log(`Data saved to database:
      - Categories: ${insertedCategories}
      - Subcategories: ${insertedSubcategories}
      - Tasks: ${insertedTasks}`);

    return { insertedCategories, insertedSubcategories, insertedTasks };
  } catch (error) {
    console.error("Error saving to database:", error.message);
    throw error;
  }
};

// Main update prices function - fetches tasks from existing DB structure
const updatePrices = async (baseUrl) => {
  try {
    console.log("Starting price update from base URL:", baseUrl);
    const parsedData = await parseWebsite(baseUrl);

    if (parsedData.length === 0) {
      console.warn("No categories found in database");
    }

    const result = await saveToDatabase(parsedData);
    return result;
  } catch (error) {
    console.error("Failed to update prices:", error.message);
    throw error;
  }
};

// Sync structure - parse categories/subcategories from website and save to DB in one operation
const syncStructure = async (sourceUrl) => {
  try {
    console.log("Syncing categories and subcategories from:", sourceUrl);
    
    // Fetch website
    const response = await axios.get(sourceUrl);
    const $ = cheerio.load(response.data);
    
    resetIdCounters();
    let categoriesCreated = 0;
    let subcategoriesCreated = 0;
    
    console.log("Looking for categories with selector: div.card.border-primary.mb-4.shadow-sm");
    const categoryElements = $("div.card.border-primary.mb-4.shadow-sm");
    console.log(`Found ${categoryElements.length} category elements`);
    
    // Parse and save categories + subcategories directly
    for (let catIndex = 0; catIndex < categoryElements.length; catIndex++) {
      const categoryEl = categoryElements[catIndex];
      const categoryName = $(categoryEl)
        .find("h4 span.text-uppercase")
        .text()
        .trim();

      console.log(`Category ${catIndex}: "${categoryName}"`);
      
      if (!categoryName) {
        console.log(`Skipping category ${catIndex} - no name found`);
        continue;
      }

      // Insert category to DB
      let categoryId;
      const existingCategory = await db_get(
        "SELECT id FROM categories WHERE name = ?",
        [categoryName],
      );

      if (existingCategory) {
        categoryId = existingCategory.id;
        console.log(`  Category already exists (ID: ${categoryId})`);
      } else {
        const result = await db_run(
          "INSERT INTO categories (name) VALUES (?)",
          [categoryName],
        );
        categoryId = result.id;
        categoriesCreated++;
        console.log(`  Created category (ID: ${categoryId})`);
      }

      // Parse and save subcategories
      const subcategoryElements = $(categoryEl).find("li.col-md-6.mb-1.text-truncate");
      console.log(`  Found ${subcategoryElements.length} subcategories`);

      for (let subIndex = 0; subIndex < subcategoryElements.length; subIndex++) {
        const subEl = subcategoryElements[subIndex];
        const subcategoryName = $(subEl).find("a.text-body").text().trim();
        const subCategoryHref = $(subEl).find("a.text-body").attr("href");
        
        console.log(`    Subcategory ${subIndex}: "${subcategoryName}"`);
        
        if (!subcategoryName) {
          console.log(`    Skipping - no name`);
          continue;
        }

        // Insert subcategory to DB
        const existingSubcategory = await db_get(
          "SELECT id FROM subcategories WHERE category_id = ? AND name = ?",
          [categoryId, subcategoryName],
        );

        if (!existingSubcategory) {
          await db_run(
            "INSERT INTO subcategories (category_id, name, href) VALUES (?, ?, ?)",
            [categoryId, subcategoryName, subCategoryHref || ""],
          );
          subcategoriesCreated++;
          console.log(`    Created subcategory`);
        } else {
          console.log(`    Subcategory already exists`);
        }
      }
    }

    console.log(`\n✓ Sync completed:
      - Categories: ${categoriesCreated}
      - Subcategories: ${subcategoriesCreated}`);

    return { categoriesCreated, subcategoriesCreated };
  } catch (error) {
    console.error("Failed to sync structure:", error.message);
    throw error;
  }
};

// Demo data for testing (if no source website available)
const getDemoData = () => {
  resetIdCounters();
  return [
    {
      id: generateCategoryId(),
      name: "Оздоблювальні роботи",
      subcategories: [
        {
          id: generateSubcategoryId(),
          categoryId: "cat_1",
          name: "Фасадні роботи",
          href: "/uk/plitochnye-raboty",
          tasks: [
            { id: generateTaskId(), name: "Штукатурка", price: 200, unit: "грн/м²" },
            { id: generateTaskId(), name: "Фарбування", price: 150, unit: "грн/м²" },
            { id: generateTaskId(), name: "Вирівнювання стін", price: 120, unit: "грн/м²" },
          ],
        },
        {
          id: generateSubcategoryId(),
          categoryId: "cat_1",
          name: "Внутрішнє оздоблення",
          href: "/uk/malyarnye-raboty",
          tasks: [
            { id: generateTaskId(), name: "Поклейка шпалер", price: 80, unit: "грн/м²" },
            { id: generateTaskId(), name: "Малювання стін", price: 100, unit: "грн/м²" },
            { id: generateTaskId(), name: "Монтаж плінтуса", price: 50, unit: "грн пог.м" },
          ],
        },
      ],
    },
    {
      id: generateCategoryId(),
      name: "Монтажні роботи",
      subcategories: [
        {
          id: generateSubcategoryId(),
          categoryId: "cat_2",
          name: "Двері та вікна",
          href: "/uk/doors-windows",
          tasks: [
            { id: generateTaskId(), name: "Установка дверей", price: 250, unit: "грн/шт" },
            { id: generateTaskId(), name: "Установка вікон", price: 300, unit: "грн/шт" },
            { id: generateTaskId(), name: "Герметизація", price: 100, unit: "грн пог.м" },
          ],
        },
      ],
    },
  ];
};


module.exports = {
  parseWebsite,
  parseWebsiteStructure,
  saveToDatabase,
  updatePrices,
  syncStructure,
  parseSubcategoryTasks,
  getDemoData,
  generateCategoryId,
  generateSubcategoryId,
  generateTaskId,
  resetIdCounters,
};
