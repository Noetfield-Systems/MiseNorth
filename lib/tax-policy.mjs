export function canAcceptOrdersWithTax(settings) {
  return settings != null
    && settings.tax_rate != null
    && settings.tax_rate_verified === true
    && Number.isFinite(Number(settings.tax_rate))
    && Number(settings.tax_rate) >= 0
    && Number(settings.tax_rate) <= 0.25;
}
