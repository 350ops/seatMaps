/**
 * Seatmaps.com Scraper
 * Scrapes airline and aircraft seat map data from seatmaps.com
 * 
 * Usage: node scraper.js
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://seatmaps.com';

// Add delay between requests to be respectful to the server
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch HTML content from a URL
 */
async function fetchPage(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
            timeout: 30000,
        });
        return response.data;
    } catch (error) {
        console.error(`Failed to fetch ${url}:`, error.message);
        return null;
    }
}

/**
 * Scrape list of all airlines from the airlines page
 */
async function scrapeAirlines() {
    console.log('Fetching airlines list...');
    const html = await fetchPage(`${BASE_URL}/airlines/`);

    if (!html) {
        console.error('Failed to fetch airlines page');
        return [];
    }

    const $ = cheerio.load(html);
    const airlines = [];

    // Find airline links - they're typically in a list or grid
    $('a[href*="/airlines/"]').each((i, el) => {
        const href = $(el).attr('href');
        const name = $(el).text().trim();

        // Filter out navigation links, only get actual airline pages
        if (href && name && href.includes('/airlines/') && !href.endsWith('/airlines/')) {
            const code = href.split('/airlines/')[1]?.replace('/', '');
            if (code && code.length > 0) {
                airlines.push({
                    name: name,
                    code: code,
                    url: href.startsWith('http') ? href : `${BASE_URL}${href}`,
                });
            }
        }
    });

    // Remove duplicates
    const uniqueAirlines = airlines.filter((airline, index, self) =>
        index === self.findIndex(a => a.code === airline.code)
    );

    console.log(`Found ${uniqueAirlines.length} airlines`);
    return uniqueAirlines;
}

/**
 * Scrape aircraft/seat maps for a specific airline
 */
async function scrapeAirlineAircraft(airlineUrl, airlineName) {
    console.log(`  Fetching aircraft for ${airlineName}...`);
    const html = await fetchPage(airlineUrl);

    if (!html) {
        return [];
    }

    const $ = cheerio.load(html);
    const aircraft = [];

    // Look for aircraft/seat map links
    $('a[href*="/seatmaps/"]').each((i, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().trim();

        if (href && text) {
            aircraft.push({
                name: text,
                url: href.startsWith('http') ? href : `${BASE_URL}${href}`,
            });
        }
    });

    // Also look for aircraft in tables or lists
    $('a').each((i, el) => {
        const href = $(el).attr('href') || '';
        const text = $(el).text().trim();

        // Match common aircraft patterns (A320, 737, 777, etc.)
        if (text && /\b(A\d{3}|7[0-9]{2}|E\d{3}|CRJ|ATR|Dash|Q\d{3})/i.test(text)) {
            if (!aircraft.find(a => a.name === text)) {
                aircraft.push({
                    name: text,
                    url: href.startsWith('http') ? href : (href ? `${BASE_URL}${href}` : null),
                });
            }
        }
    });

    console.log(`    Found ${aircraft.length} aircraft`);
    return aircraft;
}

/**
 * Main scraping function
 */
async function scrapeAll() {
    console.log('Starting seatmaps.com scraper...\n');

    // Step 1: Get all airlines
    const airlines = await scrapeAirlines();

    if (airlines.length === 0) {
        console.log('No airlines found. The page structure may have changed.');
        return;
    }

    // Step 2: For each airline, get their aircraft (with rate limiting)
    const results = [];

    for (let i = 0; i < airlines.length; i++) {
        const airline = airlines[i];
        console.log(`[${i + 1}/${airlines.length}] Processing ${airline.name}`);

        const aircraft = await scrapeAirlineAircraft(airline.url, airline.name);

        results.push({
            ...airline,
            aircraft: aircraft,
        });

        // Be respectful - wait between requests
        if (i < airlines.length - 1) {
            await delay(500);
        }
    }

    // Step 3: Save results
    const outputPath = path.join(__dirname, 'seatmaps_data.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\nData saved to ${outputPath}`);

    // Also create a summary
    const summary = {
        totalAirlines: results.length,
        totalAircraft: results.reduce((sum, a) => sum + a.aircraft.length, 0),
        scrapedAt: new Date().toISOString(),
        airlines: results.map(a => ({
            name: a.name,
            code: a.code,
            aircraftCount: a.aircraft.length,
        })),
    };

    const summaryPath = path.join(__dirname, 'seatmaps_summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`Summary saved to ${summaryPath}`);

    return results;
}

// Run the scraper
scrapeAll().catch(console.error);
