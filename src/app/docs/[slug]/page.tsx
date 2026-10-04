"use client";
import { use } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import { DocArticle, DocsShell, useDocs } from "@/components/docs/Doc";

export default function DocPageRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { t } = useI18n();
  const page = useDocs().find((d) => d.slug === slug);
  if (!page)
    return (
      <DocsShell>
        <div className="docs-index">
          <h1>{t("找不到这篇文档")}</h1>
          <Link className="button secondary" href="/docs">
            {t("返回文档首页")}
          </Link>
        </div>
      </DocsShell>
    );
  return <DocArticle page={page} />;
}
