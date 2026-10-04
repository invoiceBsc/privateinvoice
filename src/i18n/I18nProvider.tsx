"use client";
import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { translate, type Locale } from "./messages";
interface I18n {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (message: string) => string;
  formatDate: (value: string, withTime?: boolean) => string;
}
const Context = createContext<I18n | null>(null);
export function I18nProvider({
  initialLocale = "en",
  children,
}: {
  initialLocale?: Locale;
  children: React.ReactNode;
}) {
  const [locale, updateLocale] = useState<Locale>(initialLocale);
  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    document.title =
      locale === "zh"
        ? "Private Invoice · 隐私账单"
        : "Private Invoice · Business payments, privately";
  }, [locale]);
  const value = useMemo<I18n>(
    () => ({
      locale,
      setLocale(next) {
        updateLocale(next);
        document.cookie = `invoice_locale=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
      },
      t: (message) => translate(message, locale),
      formatDate: (value, withTime = false) =>
        new Intl.DateTimeFormat(
          locale === "zh" ? "zh-CN" : "en-US",
          withTime
            ? { dateStyle: "medium", timeStyle: "short" }
            : { dateStyle: "medium" },
        ).format(new Date(value)),
    }),
    [locale],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useI18n() {
  const context = useContext(Context);
  if (!context) throw new Error("I18nProvider is required");
  return context;
}
export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  return (
    <select
      className="language-switcher"
      aria-label={locale === "zh" ? "语言" : "Language"}
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
    >
      <option value="en">English</option>
      <option value="zh">简体中文</option>
    </select>
  );
}
