import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Providers } from "@/components/wallet/Providers";
import { AppShell } from "@/components/ui/AppShell";
import { I18nProvider } from "@/i18n/I18nProvider";
import type { Locale } from "@/i18n/messages";
import { Inter } from "next/font/google";
import "./globals.css";
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});
async function getLocale(): Promise<Locale> {
  return (await cookies()).get("invoice_locale")?.value === "zh" ? "zh" : "en";
}
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title:
      locale === "zh"
        ? "Private Invoice · 隐私账单"
        : "Private Invoice · Business payments, privately",
    description:
      locale === "zh"
        ? "创建加密货币账单，分享付款链接，收款不暴露你的业务钱包。"
        : "Create crypto invoices, share a payment link, and get paid without exposing your business wallet.",
  };
}
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  return (
    <html lang={locale === "zh" ? "zh-CN" : "en"} className={inter.variable}>
      <body>
        <I18nProvider initialLocale={locale}>
          <Providers>
            <AppShell>{children}</AppShell>
          </Providers>
        </I18nProvider>
      </body>
    </html>
  );
}
