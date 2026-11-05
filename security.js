// Security helpers for CAP: HTML escaping, password hashing, safe redirects,
// same-origin (CSRF) checks, login rate limiting and security headers.
const crypto = require('crypto');

const IS_PROD = process.env.NODE_ENV === 'production';

// Demo shortcuts (1-click login, switch account, default-password hint) are only
// available outside production, or when explicitly enabled with DEMO_LOGIN=true.
const DEMO_MODE = process.env.DEMO_LOGIN === 'true' || !IS_PROD;

function getSessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (IS_PROD) {
    console.warn('[security] SESSION_SECRET is not set: using a random secret, all sessions reset on restart.');
    return crypto.randomBytes(32).toString('hex');
  }
  return 'cap-dev-only-insecure-secret';
}

// ---------- HTML escaping ----------
const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' };

function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"'`]/g, ch => ESC_MAP[ch]);
}

// Returns a deep copy where every string is HTML-escaped (numbers, booleans and null kept).
// Used on view models so templates can interpolate database / request values safely.
function safe(value) {
  if (typeof value === 'string') return esc(value);
  if (Array.isArray(value)) return value.map(safe);
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = safe(v);
    return out;
  }
  return value;
}

// ---------- Passwords (scrypt, no extra dependency) ----------
const HASH_PREFIX = 'scrypt$';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `${HASH_PREFIX}${salt}$${hash}`;
}

function isHashed(stored) {
  return typeof stored === 'string' && stored.startsWith(HASH_PREFIX);
}

function verifyPassword(password, stored) {
  if (typeof password !== 'string' || !isHashed(stored)) return false;
  const [, salt, hash] = stored.split('$');
  const expected = Buffer.from(hash, 'hex');
  const actual = crypto.scryptSync(password, salt, expected.length);
  return crypto.timingSafeEqual(expected, actual);
}

// ---------- Redirects ----------
// Only allow same-site relative paths ("/x"), never "//host", "/\host" or absolute URLs.
function safeReturnUrl(url, fallback = '/') {
  if (typeof url !== 'string' || url === '') return fallback;
  if (!url.startsWith('/') || url.startsWith('//') || url.startsWith('/\\')) return fallback;
  if (/[\r\n]/.test(url)) return fallback;
  return url;
}

// Converts a Referer header into a same-host path, or the fallback.
function safeReferer(req, fallback = '/') {
  const ref = req.get('referer');
  if (!ref) return fallback;
  try {
    const u = new URL(ref);
    if (u.host !== req.get('host')) return fallback;
    return safeReturnUrl(u.pathname + u.search, fallback);
  } catch {
    return fallback;
  }
}

// ---------- CSRF: reject state-changing requests coming from another origin ----------
function sameOriginGuard(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const source = req.get('origin') || req.get('referer');
  if (!source) return next(); // non-browser clients (curl, tests) send neither header
  try {
    if (new URL(source).host === req.get('host')) return next();
  } catch { /* fall through */ }
  res.status(403).send('Forbidden: cross-site request blocked');
}

// ---------- Login rate limiting (in-memory, per IP + username) ----------
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILURES = 10;
const loginFailures = new Map();

function loginKey(req, username) {
  return `${req.ip}|${String(username || '').toLowerCase()}`;
}

function isLoginBlocked(req, username) {
  const entry = loginFailures.get(loginKey(req, username));
  if (!entry) return false;
  if (Date.now() - entry.first > LOGIN_WINDOW_MS) {
    loginFailures.delete(loginKey(req, username));
    return false;
  }
  return entry.count >= LOGIN_MAX_FAILURES;
}

function recordLoginFailure(req, username) {
  const key = loginKey(req, username);
  const entry = loginFailures.get(key);
  if (!entry || Date.now() - entry.first > LOGIN_WINDOW_MS) {
    loginFailures.set(key, { count: 1, first: Date.now() });
  } else {
    entry.count++;
  }
}

function clearLoginFailures(req, username) {
  loginFailures.delete(loginKey(req, username));
}

// ---------- Security headers ----------
function securityHeaders(req, res, next) {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('Referrer-Policy', 'same-origin');
  res.set('Cross-Origin-Opener-Policy', 'same-origin');
  res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (IS_PROD) res.set('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  next();
}

// ---------- Input validation ----------
function cleanText(value, maxLen = 1000) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, maxLen);
}

const SEMESTER_RE = /^(Spring|Summer|Fall)\d{4}$/;
function isSemesterCode(value) {
  return typeof value === 'string' && SEMESTER_RE.test(value);
}

module.exports = {
  IS_PROD,
  DEMO_MODE,
  getSessionSecret,
  esc,
  safe,
  hashPassword,
  isHashed,
  verifyPassword,
  safeReturnUrl,
  safeReferer,
  sameOriginGuard,
  isLoginBlocked,
  recordLoginFailure,
  clearLoginFailures,
  securityHeaders,
  cleanText,
  isSemesterCode
};
