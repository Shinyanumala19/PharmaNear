// ==========================================
// PharmaNear Frontend API Configuration
// ==========================================
// Replace 'https://pharmanear.onrender.com' with your actual Render backend service URL once deployed.
// For local development, this automatically routes to http://127.0.0.1:5000.

const API_URL = (typeof window !== 'undefined' && window.PHARMANEAR_API_URL)
  ? window.PHARMANEAR_API_URL.replace(/\/+$/, '')
  : (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? (window.location.port === '5000' ? '' : 'http://127.0.0.1:5000')
    : 'https://pharmanear-8dr8.onrender.com';

if (typeof window !== 'undefined') {
  window.API_URL = API_URL;
  window.PHARMANEAR_CONFIG = window.PHARMANEAR_CONFIG || {};
  window.PHARMANEAR_CONFIG.API_URL = API_URL;
}
