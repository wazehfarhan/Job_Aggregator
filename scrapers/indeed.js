const axios = require('axios');
const cheerio = require('cheerio');
const Job = require('../models/Job');

const scrapeIndeed = async () => {
  try {
    console.log('Starting Indeed scraper...');
    const baseUrl = 'https://bd.indeed.com/jobs';
    const queries = ['web development', 'software engineer', 'full stack', 'frontend', 'backend'];
    let jobsSaved = 0;

    for (const query of queries) {
      try {
        const url = `${baseUrl}?q=${encodeURIComponent(query)}&l=Dhaka`;

        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 10000
        });

        const $ = cheerio.load(response.data);
        const jobs = [];

        $('.job_seen_beacon').each((index, element) => {
          try {
            const titleElem = $(element).find('h2.jobTitle span');
            const companyElem = $(element).find('[data-company-name]');
            const locationElem = $(element).find('[data-job-location]');
            const urlElem = $(element).find('a[href*="/viewjob"]');
            const descElem = $(element).find('.job-snippet');

            const title = titleElem.text().trim();
            const company = companyElem.attr('data-company-name') || 'Unknown';
            const jobUrl = urlElem.attr('href');

            if (!title || !jobUrl) {
              console.warn(`Skipped job for query "${query}": missing required fields`);
              return;
            }

            const job = {
              title,
              company,
              location: locationElem.attr('data-job-location') || 'Not specified',
              description: descElem.text().trim(),
              jobType: 'full-time',
              source: 'indeed',
              url: jobUrl.startsWith('http') ? jobUrl : `https://bd.indeed.com${jobUrl}`,
              postedDate: new Date(),
            };

            jobs.push(job);
          } catch (err) {
            console.error('Error parsing Indeed job element:', err.message);
          }
        });

        for (const job of jobs) {
          try {
            await Job.findOneAndUpdate(
              { url: job.url },
              job,
              { upsert: true, new: true }
            );
            jobsSaved++;
            console.log(`Saved: ${job.title}`);
          } catch (err) {
            console.error(`Error saving job "${job.title}":`, err.message);
          }
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (queryError) {
        console.error(`Error scraping query "${query}":`, queryError.message);
      }
    }

    console.log(`Indeed scraper completed. Saved ${jobsSaved} jobs.`);
  } catch (error) {
    console.error('Indeed scraper error:', error.message);
  }
};

module.exports = { scrapeIndeed };
