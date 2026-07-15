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
    return `${currency} ${Number(amount).toLocaleString(undefined, {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })}`;
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

  if (loading) {
    return (
      <span className={className}>
        {formatMoney(numericAmount, "NGN", "en-NG")}
      </span>
    );
  }

  const convertedAmount = numericAmount * rate;
  const isConverted = currency !== base;

  return (
    <div>
      <span className={className}>
        {formatMoney(
          isConverted ? convertedAmount : numericAmount,
          currency,
          locale
        )}
      </span>

      {isConverted && showBasePrice && (
        <p className={baseClassName}>
          Approximately{" "}
          {formatMoney(convertedAmount, currency, locale)}
          {" · "}
          Base price{" "}
          {formatMoney(numericAmount, base, "en-NG")}
        </p>
      )}
    </div>
  );
};

export default LocalizedPrice;
