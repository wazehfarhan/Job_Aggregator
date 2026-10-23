const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, required: true },
  jobType: { type: String, enum: ['full-time', 'part-time', 'contract', 'internship', 'remote'], required: true },
  description: { type: String },
  salary: { type: String },
  source: { type: String, enum: ['bdjobs', 'indeed'], required: true },
  url: { type: String, required: true, unique: true },
  postedDate: { type: Date, default: Date.now },
  scrapedAt: { type: Date, default: Date.now },
});

jobSchema.index({ location: 1, jobType: 1, source: 1 });
jobSchema.index({ title: 'text', company: 'text', description: 'text' });

module.exports = mongoose.model('Job', jobSchema);
