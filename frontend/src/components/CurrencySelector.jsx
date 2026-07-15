import React from 'react';
import { useLocalCurrency } from '../context/CurrencyContext';

const CurrencySelector = ({
  variant = 'default',
  testId = 'currency-selector',
  className = '',
}) => {
  const {
    fx,
    fxLoading,
    currencies = [],
    changeCurrency,
  } = useLocalCurrency();

  const currentCurrency =
    fx?.detected_currency || fx?.base || 'NGN';

  const isCompact = variant === 'compact';

  const handleChange = async (event) => {
    const selectedCurrency = event.target.value;

    if (typeof changeCurrency === 'function') {
      await changeCurrency(selectedCurrency);
    }
  };

  return (
    <label
      className={`flex items-center ${
        isCompact ? 'gap-1.5' : 'gap-2'
      } ${className}`}
    >
      {!isCompact && (
        <span className="text-sm text-muted-foreground">
          Currency
        </span>
      )}

      <select
        value={currentCurrency}
        onChange={handleChange}
        disabled={fxLoading || currencies.length === 0}
        aria-label="Select display currency"
        data-testid={testId}
        className={`rounded-md border border-border bg-background text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 ${
          isCompact
            ? 'px-2 py-1.5 text-xs'
            : 'px-3 py-2 text-sm'
        }`}
      >
        {currencies.length > 0 ? (
          currencies.map((currency) => (
            <option
              key={currency.code}
              value={currency.code}
            >
              {isCompact
                ? `${currency.symbol} ${currency.code}`
                : `${currency.symbol} ${currency.code} — ${currency.name}`}
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
