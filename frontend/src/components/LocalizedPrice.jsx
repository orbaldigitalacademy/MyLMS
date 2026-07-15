import React from "react";
import { useCurrency } from "../context/CurrencyContext";

const ZERO_DECIMAL_CURRENCIES = new Set([
  "JPY",
  "UGX",
  "XOF",
  "XAF",
]);

const formatMoney = (amount, currency, locale) => {
  const fractionDigits = ZERO_DECIMAL_CURRENCIES.has(currency)
    ? 0
    : 2;

  try {
    return new Intl.NumberFormat(locale || undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(amount);
  } catch {
    return `${currency} ${Number(amount).toLocaleString()}`;
  }
};

const LocalizedPrice = ({
  amount,
  showBasePrice = true,
  className = "",
  baseClassName = "",
}) => {
  const {
    base,
    currency,
    locale,
    rate,
    loading,
  } = useCurrency();

  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) {
    return <span className={className}>Price unavailable</span>;
  }

  const displayedCurrency = loading ? base : currency;
  const displayedRate = loading ? 1 : rate;
  const displayedAmount = numericAmount * displayedRate;
  const isConverted = displayedCurrency !== base;

  return (
    <div>
      <span className={className}>
        {isConverted ? "≈ " : ""}
        {formatMoney(
          displayedAmount,
          displayedCurrency,
          locale
        )}
      </span>

      {isConverted && showBasePrice && (
        <p className={baseClassName}>
          Charged as{" "}
          {formatMoney(numericAmount, base, "en-NG")}
        </p>
      )}
    </div>
  );
};

export default LocalizedPrice;
