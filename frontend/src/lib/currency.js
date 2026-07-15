/**
 * Shared currency + FX helpers used across the app.
 *
 * All network calls go through the backend endpoints under /api/fx/*, which
 * combine IP geolocation with live FX rates and cache server-side.
 */

export const BASE_CURRENCY = "NGN";
export const FX_CACHE_KEY = "payment_fx_cache_v2";
export const FX_MANUAL_KEY = "payment_fx_manual_currency";
export const FX_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const API_BASE = process.env.REACT_APP_BACKEND_URL || "";

// Currencies where fractional units are typically not shown
export const ZERO_DECIMAL_CURRENCIES = new Set([
  "NGN", "JPY", "KRW", "VND", "IDR", "CLP", "ISK", "HUF", "TWD", "UGX", "PYG",
]);

export const DEFAULT_FX = {
  baseCurrency: BASE_CURRENCY,
  userCurrency: BASE_CURRENCY,
  rate: 1,
  countryCode: null,
  locale: "en-NG",
  source: "default",
};

const cacheKeyFor = (currency) => `${FX_CACHE_KEY}:${currency || "auto"}`;

const readFxCache = (currency) => {
  try {
    const raw = localStorage.getItem(cacheKeyFor(currency));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      parsed.baseCurrency === BASE_CURRENCY &&
      Date.now() - (parsed.timestamp || 0) < FX_CACHE_TTL_MS
    ) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
};

const writeFxCache = (data, currency) => {
  try {
    localStorage.setItem(cacheKeyFor(currency), JSON.stringify(data));
  } catch {
    /* ignore quota errors */
  }
};

export const readManualCurrency = () => {
  try {
    return localStorage.getItem(FX_MANUAL_KEY) || null;
  } catch {
    return null;
  }
};

export const writeManualCurrency = (code) => {
  try {
    if (code) localStorage.setItem(FX_MANUAL_KEY, code);
    else localStorage.removeItem(FX_MANUAL_KEY);
  } catch {
    /* ignore */
  }
};

/**
 * Auto-detect the user's currency via /api/fx/localize (IP geolocation +
 * live FX rate in one call). Cached in localStorage for 1h.
 */
export const autoDetectFx = async () => {
  const cached = readFxCache("auto");
  if (cached) return cached;

  const result = { ...DEFAULT_FX, source: "fallback" };
  try {
    const res = await fetch(
      `${API_BASE}/api/fx/localize?base=${BASE_CURRENCY}`,
      { credentials: "omit" },
    );
    if (res.ok) {
      const data = await res.json();
      if (data?.detected_currency) {
        result.userCurrency = data.detected_currency;
        result.rate = Number(data.rate) || 1;
        result.countryCode = data.country_code || null;
        result.locale = data.locale || result.locale;
        result.source = data.source || "geo";
      }
    }
  } catch {
    /* keep defaults */
  }

  result.timestamp = Date.now();
  writeFxCache(result, "auto");
  return result;
};

/**
 * Fetch the FX rate for a manually-chosen currency.
 */
export const fetchFxForCurrency = async (currency) => {
  if (!currency || currency === BASE_CURRENCY) {
    return {
      ...DEFAULT_FX,
      userCurrency: BASE_CURRENCY,
      rate: 1,
      source: "manual",
      timestamp: Date.now(),
    };
  }

  const cached = readFxCache(currency);
  if (cached) return cached;

  const result = {
    ...DEFAULT_FX,
    userCurrency: currency,
    rate: 1,
    source: "manual",
  };
  try {
    const res = await fetch(
      `${API_BASE}/api/fx/rate?base=${BASE_CURRENCY}&to=${encodeURIComponent(currency)}`,
      { credentials: "omit" },
    );
    if (res.ok) {
      const data = await res.json();
      if (data?.rate && Number.isFinite(data.rate) && data.rate > 0) {
        result.rate = Number(data.rate);
      } else {
        result.userCurrency = BASE_CURRENCY;
      }
    } else {
      result.userCurrency = BASE_CURRENCY;
    }
  } catch {
    result.userCurrency = BASE_CURRENCY;
  }

  result.timestamp = Date.now();
  writeFxCache(result, currency);
  return result;
};

/**
 * Fetch the curated currency list from the backend. In-memory cached.
 */
let _currencyListPromise = null;
export const fetchCurrencyList = () => {
  if (_currencyListPromise) return _currencyListPromise;
  _currencyListPromise = fetch(`${API_BASE}/api/fx/currencies`, {
    credentials: "omit",
  })
    .then((r) => (r.ok ? r.json() : { currencies: [] }))
    .then((d) => (Array.isArray(d?.currencies) ? d.currencies : []))
    .catch(() => []);
  return _currencyListPromise;
};

/**
 * Format a base-currency price into the user's local currency.
 *
 * @param {number} price - amount in BASE_CURRENCY (NGN)
 * @param {object} fx - result from useLocalCurrency() / autoDetectFx()
 * @param {object} [opts]
 * @param {number} [opts.minimumFractionDigits]
 * @param {number} [opts.maximumFractionDigits]
 */
export const formatLocalPrice = (price, fx, opts = {}) => {
  const amount = Number(price || 0) * (fx?.rate || 1);
  const currency = fx?.userCurrency || BASE_CURRENCY;
  const locale = fx?.locale || "en-NG";
  const zeroDecimal = ZERO_DECIMAL_CURRENCIES.has(currency);
  const min = opts.minimumFractionDigits ?? (zeroDecimal ? 0 : 2);
  const max = opts.maximumFractionDigits ?? (zeroDecimal ? 0 : 2);

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: min,
      maximumFractionDigits: max,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString(undefined, {
      minimumFractionDigits: min,
      maximumFractionDigits: max,
    })}`;
  }
};
