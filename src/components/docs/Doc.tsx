"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { Icon } from "@/components/ui/Icon";
import { en } from "@/content/docs/en";
import { zh } from "@/content/docs/zh";
import { enTech } from "@/content/docs/tech-en";
import { zhTech } from "@/content/docs/tech-zh";
import { copyText } from "@/lib/client";
import type { DocBlock, DocPage } from "@/content/docs/types";

// Technical pages sit between the product guides and the reference section.
const withTech = (base: DocPage[], tech: DocPage[], reference: string) => [
  ...base.filter((d) => d.group !== reference),
  ...tech,
  ...base.filter((d) => d.group === reference),
];
const ZH = withTech(zh, zhTech, "参考");
const EN = withTech(en, enTech, "Reference");

export function useDocs(): DocPage[] {
  return useI18n().locale === "zh" ? ZH : EN;
}

function CodeBlock({ text, lang }: { text: string; lang?: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  return (
    <div className="doc-code">
      <div className="doc-code-bar">
        <span>{lang ?? "text"}</span>
        <button
          type="button"
          className={copied ? "copied" : ""}
          onClick={async () => {
            await copyText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          <Icon name={copied ? "check" : "copy"} size={13} />
          {copied ? t("已复制") : t("复制")}
        </button>
      </div>
      <pre>
        <code>{text}</code>
      </pre>
    </div>
  );
}

/** Renders **bold**, `code` and [links](/path) inside a sentence. */
export function Inline({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  const pattern = /\*\*(.+?)\*\*|`(.+?)`|\[(.+?)\]\((.+?)\)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const key = match.index;
    if (match[1]) parts.push(<strong key={key}>{match[1]}</strong>);
    else if (match[2]) parts.push(<code key={key}>{match[2]}</code>);
    else
      parts.push(
        <Link key={key} href={match[4]}>
          {match[3]}
        </Link>,
      );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="faq-item">
      <summary>
        <span>{q}</span>
        <Icon name="plus" size={16} />
      </summary>
      <p>
        <Inline text={a} />
      </p>
    </details>
  );
}

export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="faq-list">
      {items.map((item) => (
        <FaqItem key={item.q} {...item} />
      ))}
    </div>
  );
}

function Block({ block }: { block: DocBlock }) {
  switch (block.type) {
    case "p":
      return (
        <p>
          <Inline text={block.text} />
        </p>
      );
    case "h2":
      return (
        <h2 id={block.id}>
          <a href={"#" + block.id} className="anchor" aria-hidden="true">
            #
          </a>
          {block.text}
        </h2>
      );
    case "list":
      return (
        <ul className="doc-list">
          {block.items.map((item) => (
            <li key={item}>
              <Inline text={item} />
            </li>
          ))}
        </ul>
      );
    case "steps":
      return (
        <ol className="doc-steps">
          {block.items.map((step, i) => (
            <li key={step.title}>
              <span className="doc-step-index">{i + 1}</span>
              <div>
                <strong>{step.title}</strong>
                <p>
                  <Inline text={step.text} />
                </p>
              </div>
            </li>
          ))}
        </ol>
      );
    case "callout":
      return (
        <div className={"doc-callout " + block.tone}>
          <Icon
            name={
              block.tone === "warning"
                ? "info"
                : block.tone === "success"
                  ? "check"
                  : "info"
            }
          />
          <div>
            {block.title && <strong>{block.title}</strong>}
            <p>
              <Inline text={block.text} />
            </p>
          </div>
        </div>
      );
    case "table":
      return (
        <div className="doc-table-wrap">
          <table className="doc-table">
            <thead>
              <tr>
                {block.head.map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}>
                      <Inline text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "faq":
      return <FaqList items={block.items} />;
    case "code":
      return <CodeBlock text={block.text} lang={block.lang} />;
    case "flow":
      return (
        <ol className="doc-flow">
          {block.items.map((item) => (
            <li key={item.title}>
              <strong>{item.title}</strong>
              <p>
                <Inline text={item.text} />
              </p>
            </li>
          ))}
        </ol>
      );
  }
}

function Sidebar({ docs, current }: { docs: DocPage[]; current?: string }) {
  const { t } = useI18n();
  const groups = [...new Set(docs.map((d) => d.group))];
  return (
    <nav className="docs-sidebar" aria-label={t("文档目录")}>
      <Link href="/docs" className={"docs-home" + (current ? "" : " active")}>
        <Icon name="invoice" />
        {t("文档首页")}
      </Link>
      {groups.map((group) => (
        <div key={group} className="docs-group">
          <span className="docs-group-title">{group}</span>
          {docs
            .filter((d) => d.group === group)
            .map((d) => (
              <Link
                key={d.slug}
                href={"/docs/" + d.slug}
                className={d.slug === current ? "active" : ""}
                aria-current={d.slug === current ? "page" : undefined}
              >
                {d.title}
              </Link>
            ))}
        </div>
      ))}
    </nav>
  );
}

/** Highlights the heading currently being read. */
function Toc({ items }: { items: { id: string; text: string }[] }) {
  const { t } = useI18n();
  const [active, setActive] = useState(items[0]?.id ?? "");
  useEffect(() => {
    const headings = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => !!el);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -65% 0px" },
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [items]);
  if (!items.length) return null;
  return (
    <aside className="docs-toc" aria-label={t("本页内容")}>
      <span className="docs-group-title">{t("本页内容")}</span>
      {items.map((item) => (
        <a
          key={item.id}
          href={"#" + item.id}
          className={active === item.id ? "active" : ""}
        >
          {item.text}
        </a>
      ))}
    </aside>
  );
}

export function DocsShell({
  current,
  children,
  toc = [],
}: {
  current?: string;
  children: React.ReactNode;
  toc?: { id: string; text: string }[];
}) {
  const docs = useDocs();
  const path = usePathname();
  const { t } = useI18n();
  return (
    <div className={"docs" + (toc.length ? "" : " no-toc")}>
      <Sidebar docs={docs} current={current} />
      <div className="docs-mobile-nav">
        <label className="sr-only" htmlFor="docs-jump">
          {t("文档目录")}
        </label>
        <select
          id="docs-jump"
          value={path}
          onChange={(e) => (window.location.href = e.target.value)}
        >
          <option value="/docs">{t("文档首页")}</option>
          {docs.map((d) => (
            <option key={d.slug} value={"/docs/" + d.slug}>
              {d.group} · {d.title}
            </option>
          ))}
        </select>
      </div>
      <div className="docs-main">{children}</div>
      <Toc items={toc} />
    </div>
  );
}

export function DocArticle({ page }: { page: DocPage }) {
  const { t } = useI18n();
  const docs = useDocs();
  const index = docs.findIndex((d) => d.slug === page.slug);
  const prev = docs[index - 1];
  const next = docs[index + 1];
  const toc = page.blocks
    .filter((b): b is Extract<DocBlock, { type: "h2" }> => b.type === "h2")
    .map((b) => ({ id: b.id, text: b.text }));
  return (
    <DocsShell current={page.slug} toc={toc}>
      <article className="doc-article">
        <div className="doc-crumbs">
          <Link href="/docs">{t("文档")}</Link>
          <span>/</span>
          <span>{page.group}</span>
        </div>
        <h1>{page.title}</h1>
        <p className="doc-summary">{page.summary}</p>
        <div className="doc-body">
          {page.blocks.map((block, i) => (
            <Block key={i} block={block} />
          ))}
        </div>
        <nav className="doc-pager" aria-label={t("上一篇 / 下一篇")}>
          {prev ? (
            <Link href={"/docs/" + prev.slug} className="prev">
              <small>{t("上一篇")}</small>
              <span>
                <Icon name="arrowLeft" size={14} /> {prev.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link href={"/docs/" + next.slug} className="next">
              <small>{t("下一篇")}</small>
              <span>
                {next.title} <Icon name="arrowRight" size={14} />
              </span>
            </Link>
          )}
        </nav>
      </article>
    </DocsShell>
  );
}
