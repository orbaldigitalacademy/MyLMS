import React from 'react';
import { useLocalCurrency } from '../context/CurrencyContext';

const CurrencySelector = () => {
  const {
    fx,
    fxLoading,
    currencies = [],
    changeCurrency,
  } = useLocalCurrency();

  const currentCurrency =
    fx?.detected_currency || fx?.base || 'NGN';

  const handleChange = async (event) => {
    const selectedCurrency = event.target.value;

    if (typeof changeCurrency === 'function') {
      await changeCurrency(selectedCurrency);
    }
  };

  return (
    <label className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">
        Currency
      </span>

      <select
        value={currentCurrency}
        onChange={handleChange}
        disabled={fxLoading || !currencies.length}
        aria-label="Select display currency"
        className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {currencies.length > 0 ? (
          currencies.map((currency) => (
            <option
              key={currency.code}
              value={currency.code}
            >
              {currency.symbol} {currency.code} — {currency.name}
            </option>
          ))
        ) : (
          <option value={currentCurrency}>
            {currentCurrency}
          </option>
        )}
      </select>
    </label>
  );
};

export default CurrencySelector;
