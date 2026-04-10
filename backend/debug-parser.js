const axios = require('axios');
const cheerio = require('cheerio');

const debugParser = async (url) => {
  try {
    console.log('Fetching:', url);
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    console.log('\n=== FULL PAGE STRUCTURE ===');
    console.log('HTML Title:', $('title').text());
    console.log('Page length:', response.data.length, 'bytes');

    console.log('\n=== LOOKING FOR CARDS ===');
    console.log('div.card elements:', $('div.card').length);
    console.log('div.card.border-primary elements:', $('div.card.border-primary').length);
    console.log('div.card.border-primary.mb-4 elements:', $('div.card.border-primary.mb-4').length);
    console.log('div.card.border-primary.mb-4.shadow-sm elements:', $('div.card.border-primary.mb-4.shadow-sm').length);

    console.log('\n=== ALTERNATIVE SELECTORS ===');
    console.log('[class*="card"] elements:', $('[class*="card"]').length);
    console.log('[class*="border-primary"] elements:', $('[class*="border-primary"]').length);

    // Try to find category h4 elements
    console.log('\n=== LOOKING FOR H4 (CATEGORIES) ===');
    console.log('All h4 elements:', $('h4').length);
    $('h4').each((i, el) => {
      const text = $(el).text().trim();
      if (text) console.log(`  h4[${i}]: "${text}"`);
    });

    // Try to find h4 with span.text-uppercase
    console.log('\n=== LOOKING FOR H4 > SPAN.TEXT-UPPERCASE ===');
    const h4Spans = $('h4 span.text-uppercase');
    console.log('h4 span.text-uppercase elements:', h4Spans.length);
    h4Spans.each((i, el) => {
      const text = $(el).text().trim();
      if (text) console.log(`  [${i}]: "${text}"`);
    });

    // List first card structure
    console.log('\n=== FIRST CARD STRUCTURE ===');
    const firstCard = $('div.card.border-primary.mb-4.shadow-sm').first();
    if (firstCard.length > 0) {
      console.log('Found first card');
      console.log('HTML:', firstCard.html().substring(0, 500));
    } else {
      console.log('No cards found with that selector');
      const firstDiv = $('div[class*="card"]').first();
      if (firstDiv.length > 0) {
        console.log('\nTrying with div[class*="card"]:');
        console.log('Class:', firstDiv.attr('class'));
        console.log('HTML:', firstDiv.html().substring(0, 500));
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
};

// Run debug
const url = 'https://www.rabotniki.ua/uk/price';
debugParser(url);
