const UZS_ALIASES = new Set([
  'uzs',
  'sum',
  'soum',
  "so'm",
  'сом',
  'сум',
  'сўм',
  'сумм',
  'uz',
  'узс'
])

const NO_DECIMAL_CURRENCIES = new Set(['UZS'])

function normalizeCurrencyString(value: string) {
  return value
    .trim()
    .replace(/\u00a0/g, ' ')
    .replace(/[’‘`´]/g, "'")
    // strip common punctuation and wrappers often coming from UI/DB
    .replace(/[.:;,()\[\]{}]/g, '')
    // collapse and remove spaces so aliases like "с ум" still match
    .replace(/\s+/g, '')
}

export function normalizeCurrencyCode(currency?: string | null): string {
  if (!currency) {
    return 'UZS'
  }

  const cleaned = normalizeCurrencyString(currency)
  if (!cleaned) {
    return 'UZS'
  }

  const lower = cleaned.toLowerCase()
  if (UZS_ALIASES.has(lower)) {
    return 'UZS'
  }

  const upper = cleaned.toUpperCase()
  if (/^[A-Z]{3}$/.test(upper)) {
    return upper
  }

  return 'UZS'
}

export function formatCurrency(amount: number, currency?: string | null, locale: string = 'en-US') {
  const code = normalizeCurrencyCode(currency)
  const digits = NO_DECIMAL_CURRENCIES.has(code) ? 0 : 2

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    })
      .format(amount)
      .replace(/\u00a0/g, ' ')
  } catch {
    const fallbackCode = 'USD'
    const fallbackDigits = NO_DECIMAL_CURRENCIES.has(fallbackCode) ? 0 : 2

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: fallbackCode,
      minimumFractionDigits: fallbackDigits,
      maximumFractionDigits: fallbackDigits
    })
      .format(amount)
      .replace(/\u00a0/g, ' ')
  }
}
