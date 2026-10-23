const axios = require('axios');
const cheerio = require('cheerio');
const Job = require('../models/Job');

const scrapeBDJobs = async () => {
  try {
    console.log('Starting BDJobs scraper...');
    const baseUrl = 'https://www.bdjobs.com/jobsearch.asp';

    // Scrape multiple pages
    for (let page = 1; page <= 5; page++) {
      const url = `${baseUrl}?fcatId=1&page=${page}`;

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);

      $('.jobPosting').each(async (index, element) => {
        try {
          const titleElem = $(element).find('a.jobTitle');
          const companyElem = $(element).find('.companyName a');
          const locationElem = $(element).find('.jobLocation');
          const descElem = $(element).find('.jobDetails');
          const jobTypeElem = $(element).find('.jobType');

          const jobUrl = titleElem.attr('href');
          const title = titleElem.text().trim();
          const company = companyElem.text().trim();
          const location = locationElem.text().trim();
          const jobTypeText = jobTypeElem.text().toLowerCase();

          let jobType = 'full-time';
          if (jobTypeText.includes('part-time')) jobType = 'part-time';
          if (jobTypeText.includes('contract')) jobType = 'contract';
          if (jobTypeText.includes('intern')) jobType = 'internship';

          const job = {
            title,
            company,
            location,
            description: descElem.text().trim(),
            jobType,
            source: 'bdjobs',
            url: jobUrl.startsWith('http') ? jobUrl : `https://www.bdjobs.com${jobUrl}`,
            postedDate: new Date(),
          };

          if (job.title && job.url) {
            await Job.findOneAndUpdate(
              { url: job.url },
              job,
              { upsert: true, new: true }
            );
            console.log(`Saved: ${job.title}`);
          }
        } catch (err) {
          console.error('Error processing job:', err.message);
        }
      });

      // Be respectful - add delay between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('BDJobs scraper completed');
  } catch (error) {
    console.error('BDJobs scraper error:', error.message);
  }
};

module.exports = { scrapeBDJobs };
