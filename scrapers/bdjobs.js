const axios = require('axios');
const cheerio = require('cheerio');
const Job = require('../models/Job');

const scrapeBDJobs = async () => {
  try {
    console.log('Starting BDJobs scraper...');
    const baseUrl = 'https://www.bdjobs.com/jobsearch.asp';
    let jobsSaved = 0;

    for (let page = 1; page <= 5; page++) {
      const url = `${baseUrl}?fcatId=1&page=${page}`;

      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 10000
        });

        const $ = cheerio.load(response.data);
        const jobs = [];

        $('.jobPosting').each((index, element) => {
          try {
            const titleElem = $(element).find('a.jobTitle');
            const companyElem = $(element).find('.companyName a');
            const locationElem = $(element).find('.jobLocation');
            const descElem = $(element).find('.jobDetails');
            const jobTypeElem = $(element).find('.jobType');

            const title = titleElem.text().trim();
            const company = companyElem.text().trim();
            const jobUrl = titleElem.attr('href');

            if (!title || !jobUrl || !company) {
              console.warn(`Skipped job on page ${page}: missing required fields`);
              return;
            }

            const location = locationElem.text().trim() || 'Not specified';
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

            jobs.push(job);
          } catch (err) {
            console.error('Error parsing job element:', err.message);
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
      } catch (pageError) {
        console.error(`Error scraping page ${page}:`, pageError.message);
      }
    }

    console.log(`BDJobs scraper completed. Saved ${jobsSaved} jobs.`);
  } catch (error) {
    console.error('BDJobs scraper error:', error.message);
  }
};

module.exports = { scrapeBDJobs };
