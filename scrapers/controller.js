const { scrapeBDJobs } = require('../scrapers/bdjobs');
const { scrapeIndeed } = require('../scrapers/indeed');
const Job = require('../models/Job');

const startScrapers = async () => {
  try {
    console.log('Starting all scrapers...');
    const startTime = Date.now();

    const results = await Promise.allSettled([
      scrapeBDJobs(),
      scrapeIndeed(),
    ]);

    const count = await Job.countDocuments();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    results.forEach((result, index) => {
      const scraper = index === 0 ? 'BDJobs' : 'Indeed';
      if (result.status === 'rejected') {
        console.error(`${scraper} scraper failed:`, result.reason);
      }
    });

    console.log(`Scraping completed in ${duration}s. Total jobs in database: ${count}`);
    return {
      success: true,
      count,
      duration: `${duration}s`,
    };
  } catch (error) {
    console.error('Scraper controller error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = { startScrapers };
