import type { DocPage } from "./types";

const G = "技术原理";

export const zhTech: DocPage[] = [
  {
    slug: "railgun",
    group: G,
    title: "RAILGUN 是什么",
    summary: "Private Invoice 所使用的链上隐私协议。",
    icon: "shield",
    blocks: [
      {
        type: "p",
        text: "RAILGUN 是一套部署在 EVM 公链上的隐私协议，由智能合约和零知识证明电路组成。它让用户在公链上持有和转移 ERC-20 代币时，不公开余额、交易对手和金额。RAILGUN 已部署在 Ethereum、BNB Chain、Polygon 和 Arbitrum 上，Private Invoice 使用的是 BNB Chain 上的部署。",
      },
      {
        type: "callout",
        tone: "info",
        title: "非托管、无需许可",
        text: "RAILGUN 没有运营方可以冻结或挪用资金。资金由合约持有，只有持有对应密钥、并能生成有效零知识证明的人才能花费。Private Invoice 只是 RAILGUN 之上的一个应用，同样无法动用任何用户的资金。",
      },
      { type: "h2", id: "model", text: "核心模型：加密的票据" },
      {
        type: "p",
        text: "RAILGUN 不按账户记余额，而是采用类似比特币的 UTXO 模型。每一笔隐私资金都是一张**票据（note）**，包含所有者、代币和金额。链上只保存票据的哈希承诺（commitment），票据内容用接收方的查看密钥加密后随交易发布，只有接收方能解开。",
      },
      {
        type: "list",
        items: [
          "**承诺（commitment）**：票据的 Poseidon 哈希，作为叶子插入链上的 Merkle 树。外人看到的只是一个随机数。",
          "**Merkle 树**：所有承诺组成一棵深度 16 的 Poseidon Merkle 树，每棵树最多 65,536 个叶子，写满后开启新树。",
          "**作废值（nullifier）**：花费一张票据时公开它的作废值，防止双花。作废值无法与对应的承诺关联起来。",
        ],
      },
      { type: "h2", id: "ops", text: "三种操作" },
      {
        type: "table",
        head: ["操作", "作用", "链上可见"],
        rows: [
          [
            "Shield（存入）",
            "把公开钱包里的代币存入隐私池，生成一张属于接收方的票据",
            "付款地址、代币、金额",
          ],
          [
            "Transfer（私密转账）",
            "在隐私池内转账，消耗旧票据、生成新票据",
            "只有作废值和新承诺",
          ],
          [
            "Unshield（提现）",
            "把隐私资金取回到某个公开地址",
            "收款地址、代币、金额",
          ],
        ],
      },
      {
        type: "p",
        text: "Private Invoice 的收款就是一次 Shield：客户从自己的公开钱包，把代币直接存入属于商家的隐私票据。商家提现则是一次 Unshield。",
      },
      { type: "h2", id: "zk", text: "零知识证明" },
      {
        type: "p",
        text: "花费票据（私密转账或提现）时，用户在本地生成一个 Groth16 zk-SNARK 证明，向合约证明三件事：这些票据确实存在于 Merkle 树中；你拥有花费它们的密钥；输入与输出金额守恒。合约只验证证明，不会得知是哪几张票据、属于谁。存入（Shield）不需要零知识证明。",
      },
      { type: "h2", id: "poi", text: "Private Proofs of Innocence" },
      {
        type: "p",
        text: "为防止被盗资金进入隐私池，RAILGUN 引入了 Private POI：每笔存入的资金在可以花费前，需要证明它不来自已知的恶意地址列表，而且证明过程不泄露用户身份。详见[Private POI](/docs/private-poi)。",
      },
      { type: "h2", id: "fees", text: "协议费用与治理" },
      {
        type: "p",
        text: "RAILGUN 对 Shield 和 Unshield 各收取一定比例的费用（BNB Chain 上当前为 0.25%），费率由 RAILGUN DAO 治理决定。Private Invoice 在付款时实时从合约读取费率，不硬编码。",
      },
    ],
  },
  {
    slug: "keys-and-addresses",
    group: G,
    title: "隐私地址与密钥",
    summary: "0zk 地址由什么组成，票据如何只让你解开。",
    icon: "lock",
    blocks: [
      {
        type: "p",
        text: "你的隐私钱包由 12 个助记词派生出一组密钥，再编码成以 `0zk1` 开头的地址。理解这组密钥，就能理解为什么服务器看不到你的余额。",
      },
      { type: "h2", id: "keys", text: "密钥结构" },
      {
        type: "table",
        head: ["密钥", "用途", "谁持有"],
        rows: [
          [
            "花费密钥（spending key）",
            "在零知识电路里签名，授权花费票据",
            "只有你",
          ],
          [
            "作废密钥（nullifying key）",
            "计算票据的作废值，防止双花",
            "只有你",
          ],
          [
            "查看密钥（viewing key）",
            "通过 ECDH 解密收到的票据，扫描余额与历史",
            "只有你",
          ],
          [
            "主公钥（master public key）",
            "由花费公钥和作废密钥派生，用来锁定票据的所有者",
            "公开（在地址里）",
          ],
          [
            "查看公钥（viewing public key）",
            "让付款方能加密只有你能解开的票据",
            "公开（在地址里）",
          ],
        ],
      },
      {
        type: "p",
        text: "0zk 地址就是主公钥和查看公钥的 bech32 编码，可以放心发给任何人：知道地址只能给你付款，不能看到你的余额，也不能花你的钱。",
      },
      { type: "h2", id: "note-key", text: "票据如何锁定给你" },
      {
        type: "p",
        text: "每张票据都带一个 16 字节的随机数 `random`。票据公钥（npk）由你的主公钥和这个随机数计算：",
      },
      {
        type: "code",
        lang: "text",
        text: "npk        = Poseidon(masterPublicKey, random)\ncommitment = Poseidon(npk, tokenHash, value)",
      },
      {
        type: "p",
        text: "链上只出现 `commitment`。没有 `random`，任何人都无法把它和你的主公钥对应起来。",
      },
      { type: "h2", id: "encryption", text: "加密与扫描" },
      {
        type: "steps",
        items: [
          {
            title: "付款方生成一次性密钥",
            text: "构造 Shield 时生成一把一次性的 shield 私钥，并把对应公钥（shieldKey）写进交易。",
          },
          {
            title: "ECDH 协商共享密钥",
            text: "用一次性私钥和你的查看公钥做椭圆曲线密钥交换，再经 SHA-256 得到对称密钥。",
          },
          {
            title: "AES-GCM 加密 random",
            text: "用对称密钥加密票据的 random，结果作为 encryptedBundle 发布在链上。",
          },
          {
            title: "你的钱包扫描并解密",
            text: "你的钱包用查看私钥和链上的 shieldKey 做同样的密钥交换，得到同一把对称密钥，解出 random，再验证 npk 与自己的主公钥一致，从而确认这张票据属于你。",
          },
        ],
      },
      {
        type: "callout",
        tone: "success",
        title: "为什么服务器看不到你的余额",
        text: "扫描和解密都需要查看私钥，而它只存在于你浏览器里的隐私钱包中。服务器只知道你的 0zk 地址，无法解开任何发给你的票据。",
      },
    ],
  },
  {
    slug: "shield-anatomy",
    group: G,
    title: "一笔付款的链上过程",
    summary: "从点击「支付」到资金进入商家隐私钱包，逐步拆解。",
    icon: "scan",
    blocks: [
      {
        type: "p",
        text: "客户付款时，浏览器不需要加载 RAILGUN 引擎。付款交易由服务器预先构造好，客户的钱包只负责签名发送。下面是一笔付款完整的生命周期。",
      },
      { type: "h2", id: "flow", text: "完整流程" },
      {
        type: "flow",
        items: [
          {
            title: "1. 服务器构造 Shield",
            text: "读取链上费率，计算含费总额；用商家 0zk 地址和一次性密钥生成票据与密文，编码 shield() 调用数据。",
          },
          {
            title: "2. 授权精确金额",
            text: "客户钱包调用 USDT 的 approve(RAILGUN 代理合约, 含费总额)，只授权这一次所需的数额。",
          },
          {
            title: "3. 发送 Shield 交易",
            text: "客户钱包把预先构造的交易发送到 RAILGUN 代理合约，合约转入代币、扣除协议费并插入承诺。",
          },
          {
            title: "4. 链上核验",
            text: "服务器读取交易回执，解码 Shield 事件，逐项比对票据公钥、密文、代币和到账金额。",
          },
          {
            title: "5. 最终确认",
            text: "交易所在区块进入 BNB Chain 的 finalized 状态后，发票标记为已付款并签发收据。",
          },
          {
            title: "6. 商家钱包识别",
            text: "商家浏览器中的隐私钱包同步时，用查看私钥解开这张票据，余额出现在「待解锁」中。",
          },
        ],
      },
      { type: "h2", id: "request", text: "Shield 请求的结构" },
      {
        type: "p",
        text: "RAILGUN 代理合约的 `shield()` 接收一组 ShieldRequest，每个请求包含票据原像和密文：",
      },
      {
        type: "code",
        lang: "solidity",
        text: "struct ShieldRequest {\n  CommitmentPreimage preimage;   // npk, token, value\n  ShieldCiphertext ciphertext;   // encryptedBundle[3], shieldKey\n}",
      },
      {
        type: "list",
        items: [
          "`preimage.npk`：由商家主公钥和随机数计算的票据公钥。",
          "`preimage.token`：代币类型（ERC-20）与合约地址。",
          "`preimage.value`：存入的含费总额，合约会扣除协议费。",
          "`ciphertext.encryptedBundle`：AES-GCM 加密的 random，以及加密的接收方查看公钥。",
          "`ciphertext.shieldKey`：一次性 shield 公钥，商家钱包用它做 ECDH。",
        ],
      },
      { type: "h2", id: "fee-math", text: "含费总额的计算" },
      {
        type: "p",
        text: "合约对 Shield 采用「含费」计算：到账金额 = 总额 − ⌊总额 × 费率 / 10000⌋。为了让商家正好收到发票金额 N，服务器求满足下式的最小总额 G：",
      },
      {
        type: "code",
        lang: "text",
        text: "G − floor(G × bps / 10000) = N\n\n例：N = 1,000 USDT，bps = 25\n    G = 1,002.506265664160401002 USDT",
      },
      {
        type: "p",
        text: "这个结果与 RAILGUN 合约 `getFee()` 的计算完全一致，我们在测试中用合约本身的函数做了校验。",
      },
      { type: "h2", id: "ephemeral", text: "一次性密钥不会被保存" },
      {
        type: "p",
        text: "构造完成后，服务器立即清零一次性 shield 私钥，数据库只保存公开数据：shieldKey、票据公钥、密文和创建时的区块号。这些足以在链上认出这笔付款，却无法解密任何东西。",
      },
    ],
  },
  {
    slug: "verification",
    group: G,
    title: "链上核验原理",
    summary: "服务器如何在不持有任何密钥的情况下确认到账。",
    icon: "check",
    blocks: [
      {
        type: "p",
        text: "确认收款不依赖商家在线，也不需要商家交出查看密钥。服务器只读取公开的链上数据，并与签发付款时保存的公开值做精确比对。",
      },
      { type: "h2", id: "checks", text: "比对规则" },
      {
        type: "table",
        head: ["检查项", "来源", "失败时"],
        rows: [
          ["交易成功执行", "交易回执 status", "退回待付款"],
          ["事件来自 RAILGUN 代理合约", "日志的合约地址", "忽略该事件"],
          [
            "shieldKey 匹配本次付款",
            "Shield 事件 shieldCiphertext",
            "视为不是这笔付款",
          ],
          ["票据公钥 npk 一致", "Shield 事件 commitments", "进入待审核"],
          [
            "密文 encryptedBundle 逐字节一致",
            "Shield 事件 shieldCiphertext",
            "进入待审核",
          ],
          ["代币类型与地址一致", "Shield 事件 commitments", "进入待审核"],
          [
            "扣费后金额等于发票金额",
            "Shield 事件 commitments.value",
            "进入待审核",
          ],
          ["区块已最终确认", 'eth_getBlockByNumber("finalized")', "继续等待"],
        ],
      },
      {
        type: "callout",
        tone: "info",
        title: "为什么要比对密文",
        text: "票据公钥一致只能说明资金锁定给了商家；只有密文也一致，才能保证商家的钱包解得开 random、识别并花费这笔资金。逐字节比对密文，可以防止有人构造一笔「付了钱但商家永远用不了」的交易来冒充已付款。",
      },
      { type: "h2", id: "finality", text: "最终确认" },
      {
        type: "p",
        text: "BNB Chain 有快速最终性：区块通常在约 2 秒后进入 finalized 状态，之后不会因链重组而回滚。服务器等到交易所在区块不晚于 finalized 区块，才把发票标记为已付款。",
      },
      { type: "h2", id: "discovery", text: "客户没有回报交易时" },
      {
        type: "p",
        text: "如果客户付款后关闭了页面，服务器拿不到交易哈希。核验服务会按区块范围查询 RAILGUN 官方的 BNB 索引服务（也是钱包 SDK 快速同步使用的数据源），按 shieldKey 找到对应的 Shield 记录，再走同样的比对流程。索引通常比链上晚约一分钟。",
      },
      { type: "h2", id: "loop", text: "核验服务" },
      {
        type: "list",
        items: [
          "随应用一起常驻运行，每隔几秒处理已提交但未确认的付款。",
          "只需要普通的 RPC 能力：读取交易回执、交易、finalized 区块和一次合约调用。免费公共节点即可工作。",
          "同一张发票收到第二笔有效付款时，记录为重复付款，不会重复签发收据。",
        ],
      },
    ],
  },
  {
    slug: "zk-withdrawals",
    group: G,
    title: "零知识证明与提现",
    summary: "提现时浏览器里发生了什么。",
    icon: "download",
    blocks: [
      {
        type: "p",
        text: "提现（Unshield）需要花费隐私票据，因此必须生成零知识证明。整个证明过程在商家浏览器的后台线程中完成，密钥不会离开设备。",
      },
      { type: "h2", id: "steps", text: "提现步骤" },
      {
        type: "steps",
        items: [
          {
            title: "同步 Merkle 树",
            text: "钱包从 RAILGUN 索引服务快速同步全部承诺，在本地重建 Poseidon Merkle 树，用于生成成员证明。",
          },
          {
            title: "选择票据",
            text: "从可用（已通过 POI）的票据中选出足够金额的输入。",
          },
          {
            title: "下载证明文件",
            text: "首次提现会下载对应电路的 WASM 和 zkey 文件，按内容寻址获取并缓存在浏览器中。",
          },
          {
            title: "生成 Groth16 证明",
            text: "用 snarkjs 在本地生成证明：输入票据在树中、拥有花费权、金额守恒，并公开作废值。",
          },
          {
            title: "附带 POI 证明",
            text: "同时生成 Private POI 所需的证明，确保花费的资金已通过合规检查。",
          },
          {
            title: "公开钱包发送",
            text: "生成好的交易由商家连接的公开钱包签名发送，并支付 BNB 网络费。",
          },
        ],
      },
      { type: "h2", id: "public", text: "提现会公开什么" },
      {
        type: "p",
        text: "合约验证证明后，把代币（扣除 0.25% 协议费）转到指定的公开地址。链上可见的是收款地址、代币、金额，以及发送交易的钱包地址；看不到用的是哪几张票据、它们来自哪些付款。",
      },
      {
        type: "callout",
        tone: "warning",
        title: "关于发送钱包",
        text: "当前提现由商家自己的公开钱包发送，因此这个钱包会和「从 RAILGUN 提现」这一行为关联。如果这对你很重要，请使用一个专用的钱包来发送提现交易。RAILGUN 的 Broadcaster（中继）方案可以避免这一点，我们计划在后续版本支持。",
      },
      { type: "h2", id: "performance", text: "性能" },
      {
        type: "p",
        text: "首次同步 Merkle 树需要下载约 5 万条承诺，普通电脑上约一分钟，之后增量同步只需几秒。证明生成在后台线程中进行，不会卡住页面，耗时取决于设备性能和输入票据数量。",
      },
    ],
  },
  {
    slug: "private-poi",
    group: G,
    title: "Private POI",
    summary: "合规检查如何工作，为什么新资金显示为待解锁。",
    icon: "shield",
    blocks: [
      {
        type: "p",
        text: "Private Proofs of Innocence（POI）是 RAILGUN 用来阻止非法资金使用隐私池的机制。它在不泄露用户身份和余额的前提下，证明一笔资金不来自被标记的地址。",
      },
      { type: "h2", id: "how", text: "工作方式" },
      {
        type: "list",
        items: [
          "POI 节点维护若干份公开的地址列表，例如与已知黑客事件、受制裁实体相关的地址。",
          "新存入的资金先进入等待期，期间节点检查付款来源是否在列表中。",
          "检查通过后，钱包可以为这笔资金生成 POI 证明；之后花费时附带证明，资金即可流转。",
          "整个过程使用零知识证明，POI 节点无法得知资金属于哪个 0zk 地址。",
        ],
      },
      { type: "h2", id: "buckets", text: "余额状态" },
      {
        type: "table",
        head: ["SDK 状态", "页面显示", "含义"],
        rows: [
          ["Spendable", "可用", "已通过检查，可以提现"],
          ["ShieldPending", "待解锁", "刚存入，处于等待期"],
          ["ProofSubmitted", "待解锁", "证明已提交，等待节点确认"],
          ["ShieldBlocked", "需关注", "来源被列表标记，无法正常花费"],
          [
            "MissingInternalPOI / MissingExternalPOI",
            "需关注",
            "缺少所需证明，需要重新生成",
          ],
        ],
      },
      { type: "h2", id: "payments", text: "对收款的影响" },
      {
        type: "p",
        text: "POI 只影响资金什么时候能花，不影响收款确认：发票在交易最终确认后就会标记为已付款。如果某笔付款来自被标记的地址，资金会显示为「需关注」，Private Invoice 不会也不能绕过这项检查。",
      },
    ],
  },
  {
    slug: "architecture",
    group: G,
    title: "系统架构",
    summary: "各个组件做什么，数据如何流动，信任边界在哪里。",
    icon: "link",
    blocks: [
      { type: "h2", id: "components", text: "组件" },
      {
        type: "table",
        head: ["组件", "运行位置", "职责"],
        rows: [
          [
            "Web 应用（Next.js）",
            "服务器",
            "登录、发票、付款页、收据和工作台界面",
          ],
          [
            "Shield 构造器",
            "服务器",
            "读取费率、计算含费总额、生成票据和 shield() 调用数据",
          ],
          [
            "核验服务",
            "服务器（常驻）",
            "读取交易回执、比对 Shield 事件、等待最终确认、签发收据",
          ],
          [
            "PostgreSQL",
            "服务器",
            "商家、发票、付款记录（只含公开值）和签名收据",
          ],
          [
            "隐私钱包（RAILGUN Wallet SDK）",
            "商家浏览器的 Web Worker",
            "密钥派生、加密存储、同步、余额、证明生成",
          ],
          ["客户钱包", "客户浏览器", "授权和发送付款交易，不加载 RAILGUN 引擎"],
        ],
      },
      { type: "h2", id: "trust", text: "信任边界" },
      {
        type: "list",
        items: [
          "**服务器能做的**：知道发票内容、付款交易、商家的登录地址和 0zk 地址；签发收据。",
          "**服务器不能做的**：解密票据、查看余额、转移资金、伪造链上付款。",
          "**商家浏览器持有的**：助记词派生的全部密钥（加密保存）、本地 Merkle 树和余额。",
          "**链上公开的**：付款地址、代币、金额、Shield 事件和提现记录。",
        ],
      },
      { type: "h2", id: "auth", text: "登录与会话" },
      {
        type: "p",
        text: "登录使用钱包签名：服务器下发包含网站地址、钱包地址、链 ID、随机数和五分钟有效期的消息，验证签名后原子地作废随机数，防止重放。会话令牌只以带密钥的哈希形式保存，Cookie 为 HttpOnly、SameSite=Lax，并在 HTTPS 下设为 Secure。所有写操作都校验请求来源。",
      },
      { type: "h2", id: "vault", text: "浏览器钱包" },
      {
        type: "p",
        text: "隐私钱包是一个独立打包的 Web Worker，运行官方的 RAILGUN Wallet SDK。钱包数据通过 level-js 存在 IndexedDB 中，并由 SDK 用 PBKDF2-SHA256（60 万次迭代）从密码派生的密钥加密。Worker 与页面之间只传递指令和结果，助记词只在创建钱包时显示一次。",
      },
    ],
  },
  {
    slug: "verify-receipts",
    group: G,
    title: "验证收据",
    summary: "收据签名的格式，以及如何自己验证。",
    icon: "invoice",
    blocks: [
      {
        type: "p",
        text: "每张收据都附带 Ed25519 签名。下载的 JSON 文件包含载荷（payload）、载荷哈希、签名和签发时使用的公钥，任何人都可以离线验证。",
      },
      { type: "h2", id: "format", text: "签名方式" },
      {
        type: "steps",
        items: [
          {
            title: "规范化载荷",
            text: "对载荷做递归的键名字典序排序，得到确定的 JSON 字符串。",
          },
          {
            title: "计算哈希",
            text: "对规范化字符串计算 SHA-256，得到 32 字节的载荷哈希。",
          },
          {
            title: "签名",
            text: "服务器用 Ed25519 私钥对这 32 字节签名，签名以 base64 保存。",
          },
        ],
      },
      {
        type: "p",
        text: "载荷包含发票 ID、金额（最小单位）、代币地址、链 ID、链上交易哈希、付款时间和状态。真实付款的收据还包含区块号和含费总额。",
      },
      { type: "h2", id: "node", text: "用 Node.js 验证" },
      {
        type: "code",
        lang: "javascript",
        text: 'import { createHash, createPublicKey, verify } from "node:crypto";\nimport { readFileSync } from "node:fs";\n\nconst r = JSON.parse(readFileSync("RCPT-XXXXXXXX.json", "utf8"));\nconst canonical = (v) =>\n  v === null || typeof v !== "object" ? JSON.stringify(v)\n  : Array.isArray(v) ? "[" + v.map(canonical).join(",") + "]"\n  : "{" + Object.keys(v).sort().map((k) => JSON.stringify(k) + ":" + canonical(v[k])).join(",") + "}";\n\nconst hash = createHash("sha256").update(canonical(r.payload)).digest("hex");\nconsole.log("hash matches:", hash === r.payloadHash);\nconsole.log("signature valid:", verify(null, Buffer.from(hash, "hex"),\n  createPublicKey(r.publicKey), Buffer.from(r.signature, "base64")));',
      },
      { type: "h2", id: "chain", text: "交叉核对链上交易" },
      {
        type: "p",
        text: "签名证明收据由 Private Invoice 签发且未被篡改。要进一步确认资金确实到账，可以用载荷里的 `paymentTxHash` 在 BscScan 上查看这笔交易，确认它调用了 RAILGUN 代理合约并成功执行。",
      },
      {
        type: "callout",
        tone: "info",
        text: "收据中保存了签发时的公钥，因此即使以后更换签名密钥，旧收据仍然可以验证。公钥是否属于本服务，需要通过可信渠道确认。",
      },
    ],
  },
];
