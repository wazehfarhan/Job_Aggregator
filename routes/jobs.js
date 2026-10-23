const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Job = require('../models/Job');
const { startScrapers } = require('../scrapers/controller');

const VALID_JOB_TYPES = ['full-time', 'part-time', 'contract', 'internship', 'remote'];
const VALID_SOURCES = ['bdjobs', 'indeed'];

// Search and filter jobs
router.get('/search', async (req, res) => {
  try {
    const { keyword, location, jobType, source, page = 1, limit = 50 } = req.query;
    let filter = {};

    if (keyword && keyword.trim()) {
      filter.$text = { $search: keyword };
    }

    if (location && location.trim()) {
      filter.location = { $regex: location, $options: 'i' };
    }

    if (jobType) {
      if (!VALID_JOB_TYPES.includes(jobType)) {
        return res.status(400).json({ error: `Invalid jobType. Must be one of: ${VALID_JOB_TYPES.join(', ')}` });
      }
      filter.jobType = jobType;
    }

    if (source) {
      if (!VALID_SOURCES.includes(source)) {
        return res.status(400).json({ error: `Invalid source. Must be one of: ${VALID_SOURCES.join(', ')}` });
      }
      filter.source = source;
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const jobs = await Job.find(filter)
      .sort({ postedDate: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Job.countDocuments(filter);

    res.json({
      jobs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get all locations
router.get('/locations', async (req, res) => {
  try {
    const locations = await Job.distinct('location');
    res.json(locations.sort());
  } catch (error) {
    console.error('Locations error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get job statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalJobs = await Job.countDocuments();
    const jobsByType = await Job.aggregate([
      { $group: { _id: '$jobType', count: { $sum: 1 } } },
    ]);
    const jobsBySource = await Job.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } },
    ]);

    res.json({
      totalJobs,
      byType: jobsByType,
      bySource: jobsBySource,
    });
  } catch (error) {
    console.error('Stats error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get job by ID
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid job ID' });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    console.error('Get job error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Start scraping
router.post('/scrape', async (req, res) => {
  try {
    res.json({ status: 'Scraping started in background' });
    await startScrapers();
  } catch (error) {
    console.error('Scrape error:', error.message);
  }
});

module.exports = router;
