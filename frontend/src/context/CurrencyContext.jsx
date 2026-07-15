import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  DEFAULT_FX,
  autoDetectFx,
  fetchCurrencyList,
  fetchFxForCurrency,
  readManualCurrency,
  writeManualCurrency,
} from "../lib/currency";

const CurrencyContext = createContext(null);

/**
 * Global provider that owns the detected/selected currency + FX rate so
 * every page (Courses, CourseDetail, Payment...) sees the same value.
 *
 * Wrap this once, high in the tree — typically inside <BrowserRouter>
 * and outside <AuthProvider> (either order works — they don't depend
 * on each other).
 */
export const CurrencyProvider = ({ children }) => {
  const [fx, setFx] = useState(DEFAULT_FX);
  const [fxLoading, setFxLoading] = useState(true);
  const [currencies, setCurrencies] = useState([]);
  const [manualCurrency, setManualCurrency] = useState(() => readManualCurrency());
  const reqRef = useRef(0);

  // Load curated currency list once
  useEffect(() => {
    let cancelled = false;
    fetchCurrencyList().then((list) => {
      if (!cancelled) setCurrencies(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-detect or fetch manual rate whenever the selection changes
  useEffect(() => {
    const id = ++reqRef.current;
    let cancelled = false;
    (async () => {
      setFxLoading(true);
      const result = manualCurrency
        ? await fetchFxForCurrency(manualCurrency)
        : await autoDetectFx();
      if (cancelled || id !== reqRef.current) return;
      setFx(result);
      setFxLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [manualCurrency]);

  const setCurrency = useCallback((code) => {
    const next = !code || code === "auto" ? null : code;
    setManualCurrency(next);
    writeManualCurrency(next);
  }, []);

  const value = {
    fx,
    fxLoading,
    currencies,
    manualCurrency,
    setCurrency,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

/**
 * Hook to read/set the app-wide currency.
 * Safe to call outside a provider — falls back to sane defaults so pages
 * don't crash if the provider was forgotten (they'll just show NGN).
 */
export const useLocalCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (ctx) return ctx;
  return {
    fx: DEFAULT_FX,
    fxLoading: false,
    currencies: [],
    manualCurrency: null,
    setCurrency: () => {},
  };
};
