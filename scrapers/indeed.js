const axios = require('axios');
const cheerio = require('cheerio');
const Job = require('../models/Job');

const scrapeIndeed = async () => {
  try {
    console.log('Starting Indeed scraper...');
    const baseUrl = 'https://bd.indeed.com/jobs';

    // Scrape with common search terms for Bangladesh
    const queries = ['web development', 'software engineer', 'full stack', 'frontend', 'backend'];

    for (const query of queries) {
      const url = `${baseUrl}?q=${encodeURIComponent(query)}&l=Dhaka`;

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);

      $('.job_seen_beacon').each(async (index, element) => {
        try {
          const titleElem = $(element).find('h2.jobTitle span');
          const companyElem = $(element).find('[data-company-name]');
          const locationElem = $(element).find('[data-job-location]');
          const urlElem = $(element).find('a[href*="/viewjob"]');
          const descElem = $(element).find('.job-snippet');

          const job = {
            title: titleElem.text().trim(),
            company: companyElem.attr('data-company-name') || 'Unknown',
            location: locationElem.attr('data-job-location') || 'Not specified',
            description: descElem.text().trim(),
            jobType: 'full-time',
            source: 'indeed',
            url: 'https://bd.indeed.com' + urlElem.attr('href'),
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

    console.log('Indeed scraper completed');
  } catch (error) {
    console.error('Indeed scraper error:', error.message);
  }
};

module.exports = { scrapeIndeed };
