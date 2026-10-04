"use client";
import { useI18n } from "@/i18n/I18nProvider";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { InvoiceCard } from "@/components/payment/InvoiceCard";
import { useTilt } from "@/components/ui/motion";
import { FaqList } from "@/components/docs/Doc";

export default function Home() {
  const { t } = useI18n();
  const tilt = useTilt<HTMLDivElement>();
  const steps = [
    [
      "lock",
      "开通隐私钱包",
      "用浏览器钱包登录，网站在你的电脑上生成 RAILGUN 隐私钱包。",
    ],
    ["invoice", "创建发票", "填写金额、币种和服务内容，生成一个付款链接。"],
    ["wallet", "客户付款", "客户用自己的钱包付款，不需要注册，一分钟完成。"],
    ["check", "自动确认", "链上核对后几秒内标记已付款，并签发收据。"],
  ];
  const features = [
    [
      "shield",
      "非托管",
      "密钥由 RAILGUN Wallet SDK 在你的浏览器里派生并加密保存，服务器没有任何能动用资金的密钥。",
    ],
    [
      "scan",
      "秒级到账确认",
      "解码 RAILGUN Shield 事件，逐项比对票据与密文，在 BNB Chain 最终确认后自动标记已付款。",
    ],
    [
      "invoice",
      "金额分毫不差",
      "按合约 getFee() 的含费公式反推总额，扣除 0.25% 协议费后，到账正好等于发票金额。",
    ],
    [
      "check",
      "签名收据",
      "每笔付款都有 Ed25519 签名收据，附链上交易，可下载存档。",
    ],
    [
      "link",
      "无需安装",
      "付款交易由服务器预先构造，客户钱包只签名发送，不需要加载 RAILGUN 引擎。",
    ],
    ["lock", "只授权精确金额", "付款只请求本次金额的授权，从不要求无限授权。"],
  ];
  const compare: [string, boolean, boolean][] = [
    ["客户看到你的业务钱包地址", true, false],
    ["任何人能查到你的总收入", true, false],
    ["任何人能追踪你把钱转给了谁", true, false],
    ["自动确认到账并出收据", false, true],
    ["资金只由你自己掌控", true, true],
  ];
  const faq = [
    {
      q: "我需要下载钱包 App 吗？",
      a: "不需要。隐私钱包内置在网站里，商家和客户都只用浏览器。",
    },
    {
      q: "你们能动用我的钱吗？",
      a: "不能。钱包密钥只在你的浏览器里，服务器没有任何能转移资金的密钥。",
    },
    {
      q: "客户付款后多久能确认？",
      a: "通常在交易上链后几秒内自动确认，并生成收据。",
    },
    {
      q: "为什么新到的钱不能马上提现？",
      a: "RAILGUN 要求新资金先通过 Private POI 合规检查，期间显示为待解锁。[了解更多](/docs/withdrawals)",
    },
  ].map(({ q, a }) => ({ q: t(q), a: t(a) }));
  return (
    <main className="landing">
      <section className="hero">
        <div className="hero-copy">
          <span className="pill">
            <i />
            {t("基于 RAILGUN 零知识证明协议 · BNB Chain")}
          </span>
          <h1>
            {t("每一笔生意，")} <br />
            {t("都有一张好账单。")}
          </h1>
          <p className="hero-lead">
            {t(
              "用 USDT 或 USDC 收款，付款通过 RAILGUN 的 Shield 合约直接进入你的隐私钱包。",
            )}{" "}
            {t(
              "链上只留下零知识承诺，客户看不到你的业务钱包、余额和资金去向。",
            )}
          </p>
          <div className="hero-actions">
            <Link className="button large" href="/dashboard">
              {t("开始收款")}
              <Icon name="arrowRight" />
            </Link>
            <Link className="button ghost large" href="/docs">
              {t("阅读文档")}
            </Link>
          </div>
          <ul className="hero-facts">
            <li>RAILGUN Protocol</li>
            <li>zk-SNARK</li>
            <li>BNB Chain</li>
            <li>{t("非托管")}</li>
          </ul>
        </div>
        <div className="landing-preview" aria-label={t("付款页面预览")}>
          <div ref={tilt} className="tilt">
            <InvoiceCard
              merchantName="North Studio"
              description={t("品牌视觉设计")}
              amount="2,400.00"
              token="USDT"
              invoiceNumber="INV-2026-001"
              badge={<span className="badge warning">{t("待付款")}</span>}
              rows={[[t("收款方式"), t("RAILGUN 隐私收款")]]}
            >
              <Link className="button block large" href="/dashboard">
                {t("开始收款 →")}
              </Link>
            </InvoiceCard>
            <span className="tilt-glare" aria-hidden="true" />
          </div>
          <p className="preview-caption">{t("示例账单")}</p>
        </div>
      </section>

      <section className="stat-strip" aria-label={t("协议数据")}>
        {[
          ["≈ 2s", "BNB Chain 最终确认"],
          ["0", "平台托管的资金"],
          ["0.25%", "RAILGUN 协议费"],
          ["100%", "链上可验证"],
        ].map(([value, label]) => (
          <div key={label}>
            <strong>{value}</strong>
            <span>{t(label)}</span>
          </div>
        ))}
      </section>

      <section className="landing-section compare-section">
        <div className="section-intro">
          <span className="eyebrow">{t("为什么需要隐私收款")}</span>
          <h2>{t("把收款地址发给客户，等于把账本给了他。")}</h2>
          <p>
            {t(
              "在公开链上，一个钱包地址就能查到它收过的每一笔钱、现在的余额和资金流向。Private Invoice 让客户付款进入你的隐私钱包，账本只有你自己能看。",
            )}
          </p>
        </div>
        <div className="compare-table" role="table" aria-label={t("对比")}>
          <div className="compare-row compare-head" role="row">
            <span role="columnheader" />
            <span role="columnheader">{t("普通钱包收款")}</span>
            <span role="columnheader" className="ours">
              Private Invoice
            </span>
          </div>
          {compare.map(([label, plain, ours]) => (
            <div className="compare-row" role="row" key={label}>
              <span role="rowheader">{t(label)}</span>
              {[plain, ours].map((v, i) => (
                <span
                  role="cell"
                  key={i}
                  className={(v ? "yes" : "no") + (i === 1 ? " ours" : "")}
                  aria-label={v ? t("是") : t("否")}
                >
                  <Icon name={v ? "check" : "close"} size={15} />
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section process">
        <div className="process-intro">
          <span className="eyebrow">{t("工作流程")}</span>
          <h2>{t("从开通到收款，四步完成。")}</h2>
          <Link className="text-button" href="/docs/getting-started">
            {t("查看快速开始 →")}
          </Link>
        </div>
        <ol className="process-steps four">
          {steps.map(([icon, title, text], index) => (
            <li key={title}>
              <span className="process-icon">
                <Icon name={icon} size={18} />
              </span>
              <span className="process-number">0{index + 1}</span>
              <h3>{t(title)}</h3>
              <p>{t(text)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-section protocol-section">
        <div className="section-intro">
          <span className="eyebrow">{t("协议层")}</span>
          <h2>{t("资金在链上走过的每一步")}</h2>
          <p>
            {t(
              "Private Invoice 不托管资金，也不运行自己的隐私池。所有隐私能力来自 RAILGUN：一套部署在 BNB Chain 上、经过实际运行检验的零知识证明协议。我们负责构造交易、核验链上结果和管理发票。",
            )}
          </p>
          <Link className="text-button" href="/docs/shield-anatomy">
            {t("阅读一笔付款的链上过程 →")}
          </Link>
        </div>
        <ol className="protocol-flow">
          {[
            [
              "wallet",
              "客户钱包",
              "approve() + shield()",
              "授权精确金额，把 USDT 存入 RAILGUN 代理合约。",
            ],
            [
              "shield",
              "RAILGUN 代理合约",
              "0x5901…8a10",
              "扣除 0.25% 协议费，把票据承诺写入 Poseidon Merkle 树。",
            ],
            [
              "lock",
              "加密票据",
              "ECDH + AES-GCM",
              "票据随机数只能用商家的查看密钥解开，链上只看到哈希。",
            ],
            [
              "check",
              "链上核验",
              "finalized block",
              "服务器比对 Shield 事件，BNB Chain 最终确认后签发收据。",
            ],
            [
              "download",
              "零知识提现",
              "Groth16 zk-SNARK",
              "商家在浏览器本地生成证明，把资金取回任意地址。",
            ],
          ].map(([icon, title, code, text]) => (
            <li key={title}>
              <span className="protocol-icon">
                <Icon name={icon} size={17} />
              </span>
              <div>
                <strong>{t(title)}</strong>
                <code>{code}</code>
                <p>{t(text)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-section verify-section">
        <div className="verify-terminal" aria-label={t("链上核验示例")}>
          <div className="terminal-bar">
            <i />
            <i />
            <i />
            <span>verifier · BNB Chain</span>
          </div>
          <pre>
            <code>
              {[
                ["muted", "$ verify payment INV-2026-001"],
                ["", "  fetch receipt          0x8f3c…a41e  status=success"],
                ["", "  decode Shield event    proxy 0x5901…8a10"],
                ["ok", "  ✓ shieldKey            matches issued payment"],
                [
                  "ok",
                  "  ✓ npk                  = Poseidon(merchantMPK, random)",
                ],
                ["ok", "  ✓ encryptedBundle      byte-for-byte match"],
                ["ok", "  ✓ token                Binance-Peg USDT"],
                ["ok", "  ✓ value after fee      2400.000000000000000000"],
                ["ok", "  ✓ block                ≤ finalized"],
                ["accent", "  → invoice PAID · receipt signed (Ed25519)"],
              ].map(([tone, line], i) => (
                <span key={i} className={"line " + tone}>
                  {line}
                  {"\n"}
                </span>
              ))}
            </code>
          </pre>
        </div>
        <div className="section-intro">
          <span className="eyebrow">{t("链上可验证")}</span>
          <h2>{t("不靠信任，靠核对")}</h2>
          <p>
            {t(
              "每一笔付款都由服务器预先构造，上链后逐项比对：一次性公钥、票据公钥、密文、代币和扣费后的金额，全部一致且区块最终确认，才会标记为已付款。",
            )}
          </p>
          <p>
            {t(
              "服务器不持有任何查看密钥或花费密钥：它能确认钱到了你的隐私钱包，却看不到你的余额，也动不了你的钱。",
            )}
          </p>
          <Link className="text-button" href="/docs/verification">
            {t("了解核验原理 →")}
          </Link>
        </div>
      </section>

      <section className="landing-section tech-section">
        <div className="section-intro center">
          <span className="eyebrow">{t("技术栈")}</span>
          <h2>{t("建立在经过检验的密码学之上")}</h2>
        </div>
        <div className="tech-grid">
          {[
            [
              "zk-SNARK · Groth16",
              "花费票据时证明所有权与金额守恒，不暴露是哪张票据。",
            ],
            ["Poseidon Merkle Tree", "深度 16 的承诺树，链上只保存票据哈希。"],
            [
              "ECDH + AES-GCM",
              "一次性密钥交换加密票据，只有商家的查看密钥能解开。",
            ],
            ["Private POI", "零知识方式证明资金不来自被标记的地址。"],
            ["BNB Chain Finality", "约 2 秒进入 finalized，确认后不可回滚。"],
            [
              "Ed25519 Receipts",
              "规范化 JSON + SHA-256 + Ed25519 签名，可离线验证。",
            ],
            [
              "PBKDF2 · 600k",
              "钱包在浏览器本地加密，密码派生密钥 60 万次迭代。",
            ],
            [
              "Web Worker Vault",
              "RAILGUN Wallet SDK 运行在隔离线程，密钥不进入页面。",
            ],
          ].map(([name, text]) => (
            <div className="tech-chip" key={name}>
              <code>{name}</code>
              <p>{t(text)}</p>
            </div>
          ))}
        </div>
        <p className="tech-more">
          <Link className="text-button" href="/docs/railgun">
            {t("RAILGUN 是什么 →")}
          </Link>
          <Link className="text-button" href="/docs/architecture">
            {t("系统架构 →")}
          </Link>
        </p>
      </section>

      <section className="landing-section">
        <div className="section-intro center">
          <span className="eyebrow">{t("功能")}</span>
          <h2>{t("为真实生意设计的细节")}</h2>
        </div>
        <div className="feature-grid">
          {features.map(([icon, title, text]) => (
            <div className="feature" key={title}>
              <span className="process-icon">
                <Icon name={icon} size={18} />
              </span>
              <h3>{t(title)}</h3>
              <p>{t(text)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="privacy-band">
        <div>
          <span className="eyebrow">{t("隐私与安全")}</span>
          <h2>{t("收款，不必暴露你的业务钱包。")}</h2>
          <p>
            {t(
              "收款时不暴露商家常用的公开钱包：付款直接进入商家自己的 RAILGUN 隐私钱包。",
            )}
          </p>
        </div>
        <Link className="button secondary" href="/docs/privacy">
          {t("哪些信息会公开？")}
        </Link>
      </section>

      <section className="landing-section faq-section">
        <div className="section-intro">
          <span className="eyebrow">{t("常见问题")}</span>
          <h2>{t("开始之前，你可能想知道")}</h2>
          <Link className="text-button" href="/docs/faq">
            {t("查看全部问题 →")}
          </Link>
        </div>
        <FaqList items={faq} />
      </section>

      <section className="cta-band">
        <h2>{t("今天就发出第一张隐私发票。")}</h2>
        <p>{t("只需要一个浏览器钱包，五分钟完成开通。")}</p>
        <div className="hero-actions">
          <Link className="button large" href="/dashboard">
            {t("开始收款")}
            <Icon name="arrowRight" />
          </Link>
          <Link className="button ghost large" href="/docs/getting-started">
            {t("快速开始")}
          </Link>
        </div>
      </section>

      <p className="landing-disclaimer">
        <span className="badge neutral">{t("非托管")}</span>
        {t("本应用不收手续费；RAILGUN 协议对每次存入和提现各收 0.25%。")}
      </p>
    </main>
  );
}
