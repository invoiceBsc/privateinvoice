# Internationalization

The product supports English (`en`) and Simplified Chinese (`zh`). English is the default for a new visitor, regardless of browser language. The selector is available in the public header and the workspace location bar, including mobile layouts.

`src/i18n/messages.ts` holds the shared message catalog. `I18nProvider` provides translation, language switching and locale-aware date formatting. User-entered merchant names, customer labels, service descriptions, addresses and identifiers are never translated. Atomic token amounts and signed receipt JSON do not change when language changes.

The chosen language is stored in the `invoice_locale` cookie for one year, with Path=/ and SameSite=Lax (Secure on HTTPS). It contains only `en` or `zh`. The root server layout reads it to render the correct language before hydration; invalid or missing values default to English. Client switching updates the interface and document language immediately. No additional environment variable is needed.

Invoice statuses and common API errors are translated at the UI boundary; API status codes and machine-readable invoice states remain stable. Dates use en-US or zh-CN display formatting. The separate developer-only RAILGUN research page remains English.

Acceptance coverage: `tests/e2e/i18n.spec.ts` verifies the English default with a Chinese browser locale, live switching, persistence after reload/navigation, preservation of in-progress invoice fields, translated API errors and English mobile overflow. The existing full mock workflow explicitly selects Chinese, while API/receipt boundary tests use the default English interface. Evidence: `logs/i18n-build.log`, `logs/i18n-e2e.log`, `logs/i18n-layout-check.log` and `logs/i18n-*.png`.
