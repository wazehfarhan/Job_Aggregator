const API_BASE = 'http://localhost:5000/api';

const searchBtn = document.getElementById('searchBtn');
const scrapeBtn = document.getElementById('scrapeBtn');
const keywordInput = document.getElementById('keyword');
const locationSelect = document.getElementById('location');
const jobTypeSelect = document.getElementById('jobType');
const sourceSelect = document.getElementById('source');
const resultsDiv = document.getElementById('results');
const loadingDiv = document.getElementById('loading');
const noResultsDiv = document.getElementById('noResults');

searchBtn.addEventListener('click', searchJobs);
scrapeBtn.addEventListener('click', scrapeJobs);
keywordInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') searchJobs();
});

async function searchJobs() {
  const keyword = keywordInput.value;
  const location = locationSelect.value;
  const jobType = jobTypeSelect.value;
  const source = sourceSelect.value;

  showLoading();

  try {
    const params = new URLSearchParams();
    if (keyword) params.append('keyword', keyword);
    if (location) params.append('location', location);
    if (jobType) params.append('jobType', jobType);
    if (source) params.append('source', source);

    const response = await fetch(`${API_BASE}/jobs/search?${params}`);
    const jobs = await response.json();

    displayJobs(jobs);
  } catch (error) {
    console.error('Search error:', error);
    loadingDiv.classList.add('hidden');
    noResultsDiv.textContent = 'Error fetching jobs. Make sure the server is running.';
    noResultsDiv.classList.remove('hidden');
  }
}

function displayJobs(jobs) {
  loadingDiv.classList.add('hidden');

  if (jobs.length === 0) {
    resultsDiv.innerHTML = '';
    noResultsDiv.classList.remove('hidden');
    return;
  }

  noResultsDiv.classList.add('hidden');
  resultsDiv.innerHTML = jobs.map(job => `
    <div class="job-card">
      <div class="job-header">
        <div>
          <div class="job-title">${escapeHtml(job.title)}</div>
          <div class="job-company">${escapeHtml(job.company)}</div>
        </div>
      </div>
      <div class="job-meta">
        <span class="badge badge-location">📍 ${escapeHtml(job.location)}</span>
        <span class="badge badge-type">💼 ${capitalizeFirst(job.jobType)}</span>
        <span class="badge badge-source">🔗 ${capitalizeFirst(job.source)}</span>
      </div>
      ${job.description ? `<div class="job-description">${escapeHtml(job.description.substring(0, 200))}...</div>` : ''}
      <div class="job-footer">
        <span class="job-date">${formatDate(job.postedDate)}</span>
        <a href="${job.url}" target="_blank" class="btn-view">View Job</a>
      </div>
    </div>
  `).join('');
}

async function scrapeJobs() {
  showLoading();
  loadingDiv.textContent = 'Scraping jobs from BDJobs and Indeed... This may take a few minutes.';

  try {
    const response = await fetch(`${API_BASE}/jobs/scrape`, { method: 'POST' });
    const data = await response.json();
    loadingDiv.textContent = `Scraping completed! Found ${data.count} jobs.`;
    setTimeout(() => searchJobs(), 2000);
  } catch (error) {
    console.error('Scrape error:', error);
    loadingDiv.textContent = 'Error scraping jobs. Check console for details.';
    setTimeout(() => loadingDiv.classList.add('hidden'), 3000);
  }
}

function showLoading() {
  resultsDiv.innerHTML = '';
  noResultsDiv.classList.add('hidden');
  loadingDiv.classList.remove('hidden');
  loadingDiv.textContent = 'Loading jobs...';
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Load initial data
window.addEventListener('load', () => {
  loadingDiv.textContent = 'No jobs loaded yet. Click "Search" or "Scrape Latest Jobs" to get started.';
  loadingDiv.classList.remove('hidden');
});
