const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const { startScrapers } = require('../scrapers/controller');

// Search and filter jobs
router.get('/search', async (req, res) => {
  try {
    const { keyword, location, jobType, source } = req.query;
    let filter = {};

    if (keyword) {
      filter.$text = { $search: keyword };
    }
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }
    if (jobType) {
      filter.jobType = jobType;
    }
    if (source) {
      filter.source = source;
    }

    const jobs = await Job.find(filter).sort({ postedDate: -1 }).limit(50);
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all locations
router.get('/locations', async (req, res) => {
  try {
    const locations = await Job.distinct('location');
    res.json(locations.sort());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get job by ID
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start scraping
router.post('/scrape', async (req, res) => {
  try {
    const result = await startScrapers();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
