"use client";
import Link from "next/link";
import { useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { Icon } from "@/components/ui/Icon";
import { DocsShell, useDocs } from "@/components/docs/Doc";

export default function DocsIndex() {
  const { t } = useI18n();
  const docs = useDocs();
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  // Search titles, summaries and body text so "POI" or "助记词" finds the right page.
  const matches = docs.filter(
    (d) =>
      !q ||
      (d.title + " " + d.summary + " " + JSON.stringify(d.blocks))
        .toLowerCase()
        .includes(q),
  );
  const groups = [...new Set(matches.map((d) => d.group))];
  return (
    <DocsShell>
      <div className="docs-index">
        <span className="eyebrow">{t("文档")}</span>
        <h1>{t("用 Private Invoice 收款")}</h1>
        <p className="doc-summary">
          {t("从开通收款到提现的完整说明，以及费用、隐私和安全的细节。")}
        </p>
        <label className="search docs-search">
          <Icon name="search" />
          <input
            aria-label={t("搜索文档")}
            placeholder={t("搜索文档，例如：助记词、手续费、POI")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        {!matches.length && <p className="muted">{t("没有找到相关文档。")}</p>}
        {groups.map((group) => (
          <section key={group} className="docs-index-group">
            <h2>{group}</h2>
            <div className="docs-cards">
              {matches
                .filter((d) => d.group === group)
                .map((d) => (
                  <Link
                    key={d.slug}
                    href={"/docs/" + d.slug}
                    className="docs-card"
                  >
                    <span className="docs-card-icon">
                      <Icon name={d.icon} size={18} />
                    </span>
                    <strong>{d.title}</strong>
                    <span>{d.summary}</span>
                  </Link>
                ))}
            </div>
          </section>
        ))}
      </div>
    </DocsShell>
  );
}
