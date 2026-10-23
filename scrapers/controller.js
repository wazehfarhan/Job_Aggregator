const { scrapeBDJobs } = require('../scrapers/bdjobs');
const { scrapeIndeed } = require('../scrapers/indeed');
const Job = require('../models/Job');

const startScrapers = async () => {
  try {
    console.log('Starting all scrapers...');
    await Promise.all([scrapeBDJobs(), scrapeIndeed()]);
    const count = await Job.countDocuments();
    console.log(`Scraping completed. Total jobs: ${count}`);
    return { success: true, count };
  } catch (error) {
    console.error('Scraper controller error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { startScrapers };
