export type Locale = "en" | "zh";
// Source keys are stable UI messages; user-provided invoice content is never translated.
export const messages: Record<string, string> = {
  关闭提示: "Dismiss notification",
  为独立商家打造的加密货币账单: "Crypto invoices for independent businesses",
  "每一笔生意，": "Good business.",
  "都有一张好账单。": "Great invoices.",
  "创建账单，分享一个链接。": "Create an invoice. Share a link.",
  "把付款、对账和收据，放在同一个工作台。":
    "Payments, reconciliation, and receipts in one workspace.",
  开始创建账单: "Create your first invoice",
  "了解隐私设计 →": "Explore the privacy model →",
  "应用手续费 0": "No application fee",
  付款页面预览: "Checkout preview",
  示例账单: "Sample invoice",
  设计工作室: "Design studio",
  待付款: "Awaiting payment",
  "INVOICE / 账单": "INVOICE",
  品牌视觉设计: "Brand identity design",
  付款网络: "Payment network",
  收款方式: "Payment method",
  "隐私收款 · 设计目标": "Private receiving · planned",
  "体验模拟付款流程 →": "Explore the mock payment flow →",
  "预览示例 · 不会转移真实资金": "Illustrative preview · No real funds move",
  从账单到收据: "From invoice to receipt",
  每一步都有记录: "Every step, accounted for",
  简单的工作流程: "A simpler workflow",
  "少一点来回沟通，": "Less back and forth.",
  "多一点井井有条。": "More clarity.",
  创建账单: "Create an invoice",
  "填写金额、币种与服务内容。": "Set the amount, token, and service details.",
  分享链接: "Share the link",
  "客户在独立付款页面查看账单。":
    "Give your customer a dedicated checkout page.",
  对账与收据: "Reconcile and receipt",
  "查看付款状态，保留业务记录。": "Track payments and keep a record.",
  模拟预览: "Mock preview",
  "当前可体验完整操作流程，真实 RAILGUN 收款尚未启用。":
    "Explore the workflow in mock mode. Real RAILGUN payments are not enabled.",
  隐私与安全: "Privacy & security",
  "哪些信息会公开？": "What stays public?",
  "设计目标是收款时不直接暴露商家常用的公开钱包。当前版本只提供模拟流程。":
    "The goal is to receive payments without directly exposing your everyday business wallet. This build uses simulated payments.",
  "公开钱包 → 隐私余额": "Public wallet → private balance",
  "真实付款时，付款地址、代币、金额、时间以及与 RAILGUN 的交互可能在链上公开。商家常用钱包与完整隐私余额不会直接展示在付款页面上。":
    "In real payments, the payer address, token, amount, time, and interaction with RAILGUN may be public on-chain. The merchant’s everyday wallet and full private balance are not directly shown at checkout.",
  "隐私收款地址仍需提供给付款软件构造交易；页面隐藏地址不代表付款人无法获知。系统会保存账单信息、付款地址与交易哈希。":
    "Checkout software needs the private receiving address to construct a payment. Hiding it on the page does not mean the payer cannot learn it. The application stores invoice details, payer addresses, and transaction hashes.",
  本地钱包与对账: "Local wallet & reconciliation",
  "规划中的真实集成会在商家设备保存钱包凭据并扫描到账记录。商家打开工作台后才能完成本地对账。":
    "The planned integration keeps wallet credentials and payment scanning on the merchant’s device. Local reconciliation requires opening the workspace.",
  "已付款不等于可提现。Private POI 可能使余额处于待处理状态，系统不会绕过相关检查。":
    "Payment confirmation and spendability are separate. Private POI can keep balances pending. These checks are not bypassed.",
  收据与提现: "Receipts & withdrawals",
  "任何持有收据链接的人都可以查看账单金额与说明。交易哈希可能暴露付款人；提现至公开地址会公开收款地址和金额。":
    "Anyone with a receipt link can view the invoice amount and description. Transaction hashes may reveal the payer. Withdrawals to public wallets expose the destination and amount.",
  "当前没有实现私密转账或 Broadcaster 付款，也不承诺匿名或不可追踪。":
    "Private transfers and Broadcaster payments are not implemented. This application does not promise anonymity or untraceability.",
  "当前所有付款、余额和交易哈希均为模拟数据，真实收款尚未启用。":
    "Payments, balances, and transaction hashes are simulated. Real receiving is not enabled.",
  "请输入有效的金额与收款地址。":
    "Enter a valid amount and destination address.",
  "模拟提现已完成：": "Mock withdrawal completed: ",
  提现失败: "Withdrawal failed",
  "← 返回账单": "← Back to invoices",
  余额与提现: "Balances & withdrawals",
  "当前仅支持模拟提现，不会发送链上交易。":
    "Mock withdrawals only. No blockchain transaction is sent.",
  币种: "Token",
  金额: "Amount",
  收款地址: "Destination address",
  "真实提现到公开钱包时，收款地址和金额会在链上公开。":
    "Real withdrawals to a public wallet expose the destination and amount on-chain.",
  "可用 ·": "available ·",
  待解锁: "Pending",
  "正在处理…": "Processing…",
  模拟提现: "Simulate withdrawal",
  隐私账单: "Private payments",
  隐私说明: "Privacy model",
  进入工作台: "Open workspace",
  我的工作空间: "My workspace",
  个人商家账户: "Merchant account",
  工作台: "Workspace",
  工作台导航: "Workspace navigation",
  账单管理: "Invoices",
  创建发票: "Create invoice",
  模拟模式: "Mock mode",
  "当前版本仅供体验，": "Preview environment.",
  "不会转移真实资金。": "No real funds move.",
  工作空间: "Workspace",
  账单详情: "Invoice details",
  模拟环境: "Mock environment",
  "模拟扫描完成，请核对下方付款。":
    "Mock scan complete. Review the payments below.",
  "对账完成，收据已生成。模拟余额暂时待解锁。":
    "Payment reconciled and receipt issued. Mock funds remain pending.",
  付款链接已复制: "Payment link copied",
  "请打开账单，从付款链接栏手动复制。":
    "Open the invoice and copy the payment URL from its link field.",
  "正在加载工作台…": "Loading your workspace…",
  "欢迎使用 PRIVATE INVOICE": "WELCOME TO PRIVATE INVOICE",
  "把每一张账单，管理好。": "Every invoice, in one place.",
  "连接钱包，签名即可登录。 登录不会授权代币或发送转账。":
    "Connect your wallet and sign in. Signing in does not approve tokens or send a transaction.",
  "创建账单、跟踪付款，让每笔业务有据可查。":
    "Create invoices, track payments, and keep your business organized.",
  "＋ 创建发票": "＋ Create invoice",
  "模拟预览 · 账单、支付和余额用于体验，不发生真实转账。":
    "Mock preview · Invoices, payments, and balances are simulated. No real funds move.",
  可用余额: "available balance",
  可用: "available",
  待处理: "Needs attention",
  付款与对账: "Payment reconciliation",
  "收到模拟付款后，扫描并核对账单。":
    "Scan incoming mock payments and match them to invoices.",
  "扫描中…": "Scanning…",
  "↻ 扫描付款": "↻ Scan payments",
  "模拟余额已解锁，可体验提现。":
    "Mock funds unlocked. You can now simulate a withdrawal.",
  解锁模拟余额: "Unlock mock balance",
  "前往余额与提现 →": "View balances & withdrawals →",
  待核对的付款: "Payments to review",
  确认并生成收据: "Confirm & issue receipt",
  所有账单: "All invoices",
  张账单: "invoices",
  账单状态筛选: "Filter invoices by status",
  全部: "All",
  待对账: "To reconcile",
  已付款: "Paid",
  搜索账单: "Search invoices",
  "搜索客户、账单或服务…": "Search invoices or customers…",
  从第一张账单开始: "Your first invoice starts here",
  "填写金额和服务内容，把付款链接发给客户。":
    "Set the amount and service details, then share a payment link.",
  没有符合条件的账单: "No invoices match your search",
  "账单 / 客户": "Invoice / customer",
  状态: "Status",
  操作: "Actions",
  复制链接: "Copy link",
  取消: "Cancel",
  "收据 ↗": "Receipt ↗",
  "模拟收款账户：": "Mock receiving account: ",
  退出登录: "Sign out",
  "创建失败，请重试": "Could not create the invoice. Please retry.",
  "填好账单，生成一个可以分享的付款链接。":
    "Fill in the details to create a shareable payment link.",
  模拟账单: "Mock invoice",
  账单信息: "Invoice details",
  服务内容: "Service description",
  "例如：品牌视觉设计 · 尾款": "e.g. Brand identity design · Final payment",
  "客户名称（仅你可见）": "Customer name (only visible to you)",
  "客户或公司名称，可选": "Customer or company name, optional",
  付款期限: "Payment due in",
  "1 天": "1 day",
  "7 天": "7 days",
  "30 天": "30 days",
  "90 天": "90 days",
  "BNB Chain · 仅模拟付款": "BNB Chain · Mock payments only",
  "正在创建…": "Creating…",
  "创建付款链接 →": "Create payment link →",
  客户将看到: "Customer view",
  实时预览: "Live preview",
  付款账单: "Payment request",
  网络: "Network",
  天: "days",
  "模拟付款 →": "Simulate payment →",
  创建后即可复制并分享付款链接:
    "Copy and share the link after creating your invoice",
  "客户无需注册即可查看账单。":
    "Customers can view the invoice without an account.",
  "正在加载账单…": "Loading invoice…",
  "付款截止：": "Due: ",
  付款链接: "Payment link",
  "请从上方输入框手动复制链接。": "Copy the URL from the field above.",
  "已复制 ✓": "Copied ✓",
  复制付款链接: "Copy payment link",
  "打开付款页面 ↗": "Open checkout ↗",
  查看收据: "View receipt",
  账单暂不可用: "Invoice unavailable",
  "请先切换到 BNB Chain": "Switch your wallet to BNB Chain first",
  真实付款尚未启用: "Real payments are not enabled",
  "准备模拟付款…": "Preparing mock payment…",
  "提交模拟付款…": "Submitting mock payment…",
  "付款已提交，等待商家对账":
    "Payment submitted. Waiting for merchant reconciliation.",
  付款失败: "Payment failed",
  "正在加载付款账单…": "Loading payment request…",
  商家常用钱包: "Merchant business wallet",
  不在此展示: "Not displayed",
  应用手续费: "Application fee",
  协议与网络费用: "Protocol & network fees",
  "0 · 模拟环境": "0 · Mock environment",
  "这是模拟付款，不会授权代币或转移真实资金。":
    "Mock checkout: no token approval or real transfer occurs.",
  "模拟付款 ·": "Simulate payment · ",
  "付款已提交，商家对账后将生成收据。":
    "Payment submitted. A receipt will be issued after merchant reconciliation.",
  "付款已确认 ✓": "Payment confirmed ✓",
  "余额待解锁，付款状态与可提现余额分别记录。":
    "Funds are pending. Payment confirmation and spendability are separate.",
  "模拟交易：": "Mock transaction: ",
  "查看付款收据 ↗": "View payment receipt ↗",
  "真实公开钱包付款的付款人、金额和交易记录可能仍公开。":
    "In real public-wallet payments, the payer, amount, and transaction may remain public.",
  "查看隐私说明 →": "Read the privacy model →",
  "正在加载收据…": "Loading receipt…",
  付款收据: "Payment receipt",
  "已付款 ✓": "Paid ✓",
  账单编号: "Invoice number",
  收据编号: "Receipt number",
  付款时间: "Paid at",
  余额状态: "Funds status",
  "这是一份模拟付款收据，不代表真实链上到账。分享收据将公开账单金额和内容。":
    "Simulated payment receipt. This does not prove an on-chain transfer. Sharing reveals the invoice amount and description.",
  模拟交易: "Mock transaction",
  收据校验摘要: "Receipt payload hash",
  "收据已通过 Ed25519 签名，下载文件中包含验证公钥。":
    "Signed with Ed25519. The downloadable receipt includes its verification public key.",
  打印收据: "Print receipt",
  下载签名收据: "Download signed receipt",
  "设置失败，请重试": "Setup failed. Please retry.",
  "开始使用 / 01": "GET STARTED / 01",
  "让收款，": "Get paid.",
  "有条不紊。": "Stay organized.",
  "先为你的工作空间起个名字，": "Give your workspace a name,",
  "然后创建第一张账单。": "then create your first invoice.",
  设置商家名称: "Name your business",
  创建并分享账单: "Create and share an invoice",
  管理付款与收据: "Track payments and receipts",
  首次设置: "FIRST-TIME SETUP",
  "你的商家叫什么？": "What’s your business called?",
  "这个名称会显示在客户的付款页面上。":
    "Customers will see this name on their payment page.",
  商家名称: "Business name",
  "例如：North 设计工作室": "e.g. North Design Studio",
  "我知道这是模拟账户，不会发生真实转账。":
    "I understand this is a mock account. No real funds move.",
  "创建工作空间 →": "Create workspace →",
  "无需助记词 · 不存入真实资金": "No recovery phrase · No real funds",
  "请安装 MetaMask、Rabby 或其他钱包":
    "Install MetaMask, Rabby, or another EVM wallet",
  钱包请求失败: "Wallet request failed",
  "请在钱包中确认…": "Check your wallet…",
  连接钱包并登录: "Connect wallet & sign in",
  "切换至 BNB Chain": "Switch to BNB Chain",
  连接钱包: "Connect wallet",
  断开连接: "Disconnect",
  请先登录: "Please sign in",
  请先设置商家账户: "Set up your merchant account first",
  请求来源不允许: "Request origin denied",
  "请提交 JSON 数据": "JSON required",
  "请求过于频繁，请稍后重试": "Too many requests. Please wait a minute.",
  请求内容过大: "Request too large",
  登录请求无效或已过期: "Login challenge is invalid or expired",
  钱包签名无效: "Invalid wallet signature",
  登录请求已使用: "Login challenge already used",
  真实账户设置尚未启用: "RAILGUN onboarding not enabled",
  需要模拟收款地址: "Mock receiving address required",
  账单无法取消: "Invoice cannot be cancelled",
  找不到账单: "Invoice not found",
  真实支付已停用: "Real payments are disabled",
  没有付款权限: "Payment capability denied",
  付款已经提交: "Payment already submitted",
  账单已有提交的付款: "Invoice already has a submitted payment",
  找不到付款: "Payment not found",
  找不到内容: "Not found",
  金额必须大于零: "Amount must be greater than zero",
  可用余额不足: "Insufficient spendable private balance",
  找不到收据: "Receipt not found",
  "请求无效，请检查填写内容": "Invalid request",
  "请求未完成，请重试": "Request could not be completed. Please retry.",
  账单当前无法付款: "Invoice is not payable",
  真实对账尚未启用: "Real reconciliation not enabled",
  付款尚未确认: "Payment has not been confirmed",
  账单已经完成对账: "Invoice already reconciled",
  扫描失败: "Scan failed",
  对账失败: "Reconciliation failed",
  取消失败: "Cancellation failed",
  更新失败: "Update failed",
  工作空间加载失败: "Loading failed",
  确认中: "Confirming",
  已过期: "Expired",
  已取消: "Cancelled",
  待审核: "Needs review",
  "仅签名一条登录消息，不会发起链上交易。":
    "You only sign a login message. No transaction is sent.",
  付款于: "Paid",
  付款已提交: "Payment submitted",
  付款截止: "Due date",
  你的商家名称: "Your business name",
  创建时间: "Created",
  发起提现: "New withdrawal",
  向你发起付款请求: "requests a payment",
  客户: "Customer",
  "客户付款进入这个隐私收款地址，而不是你的常用钱包。":
    "Customer payments land in this private receiving address, not your everyday wallet.",
  "客户会在付款页面看到这段说明。":
    "Shown to your customer on the payment page.",
  客户在付款页面看到的样子: "How customers will see you at checkout",
  客户已付款: "Customer paid",
  对账完成并生成收据: "Reconciled and receipt issued",
  "已到账，等待解锁后才能提现。":
    "received and waiting to be released before it can be withdrawn.",
  已收款: "Collected",
  "已解锁的余额可以提现到任意 EVM 地址。":
    "Released balances can be withdrawn to any EVM address.",
  待收款: "Outstanding",
  截止: "Due",
  扫描付款: "Scan payments",
  "把链接发给客户，对方无需注册即可付款。":
    "Send this link to your customer. No account needed to pay.",
  收据: "Receipt",
  收款账户: "Receiving account",
  "收款，不必暴露你的业务钱包。":
    "Get paid without exposing your business wallet.",
  日期: "Date",
  "核对金额与账单一致后，生成收据。":
    "Confirm the amount matches the invoice, then issue a receipt.",
  概览: "Overview",
  "没有发现新的付款。": "No new payments found.",
  登录工作台: "Sign in to your workspace",
  确认付款: "Confirm payment",
  等待商家对账: "Waiting for merchant reconciliation",
  等待客户付款: "Waiting for the customer",
  账单: "Invoice",
  账单已创建: "Invoice created",
  账单已取消: "Invoice cancelled",
  返回账单: "Back to invoices",
  "这张账单已关闭，客户无法再付款。":
    "This invoice is closed and can no longer be paid.",
  进度: "Progress",
  验证信息: "Verification",
  可提现: "Available to withdraw",
  "确认取消？": "Cancel invoice?",
  已复制: "Copied",
  主导航: "Main navigation",
  关闭: "Close",
  其他钱包: "Other wallets",
  安装: "Install",
  已安装: "Installed",
  已检测到: "Detected",
  未设置商家: "No workspace yet",
  "没有检测到浏览器钱包。安装一个钱包扩展，或在钱包 App 的内置浏览器中打开本页。":
    "No browser wallet detected. Install a wallet extension, or open this page in your wallet app's browser.",
  浏览器钱包: "Browser wallet",
  账户菜单: "Account menu",
  返回首页: "Back to home",
  "连接后，付款前还需在钱包中确认。":
    "After connecting, you'll still confirm the payment in your wallet.",
  选择钱包: "Choose a wallet",
  首页: "Home",
  "BNB 不足以支付网络手续费。": "Not enough BNB to pay the network fee.",
  "RAILGUN 收款地址": "RAILGUN receiving address",
  "RAILGUN 隐私手续费": "RAILGUN privacy fee",
  付款需要商家核对: "Payment needs the merchant's review",
  "余额不足：需要": "Insufficient balance: you need",
  "你在钱包中取消了这一步。": "You cancelled this step in your wallet.",
  "准备付款…": "Preparing payment…",
  合计支付: "Total to pay",
  "在 Railway 等 RAILGUN 钱包里复制你的 0zk 地址。客户付款会直接进入这个地址，我们不接触你的私钥。":
    "Copy your 0zk address from a RAILGUN wallet such as Railway. Payments go straight to it; we never touch your keys.",
  复制地址: "Copy address",
  "客户付款直接进入你自己的 RAILGUN 钱包，我们不托管资金。":
    "Customer payments go straight into your own RAILGUN wallet. We never hold funds.",
  "我确认这个地址由我自己掌控，并已备份它的助记词。":
    "I control this address and have backed up its recovery phrase.",
  "打开 Railway": "Open Railway",
  "打开 Railway 等 RAILGUN 钱包，导入同一个助记词即可看到收到的款项，并转账或提现到任意地址。":
    "Open a RAILGUN wallet such as Railway with the same recovery phrase to see received funds and transfer or withdraw them anywhere.",
  授权并付款: "Approve and pay",
  "提交付款…": "Submitting payment…",
  支付: "Pay",
  查看余额与提现: "Balance and withdrawals",
  "款项已在 BNB Chain 上确认并进入商家的隐私收款地址。分享收据将公开账单金额和内容。":
    "Payment confirmed on BNB Chain into the merchant's private receiving address. Sharing this receipt reveals the invoice amount and description.",
  "款项已进入商家的隐私收款地址。":
    "The payment reached the merchant's private receiving address.",
  "款项直接进入你的 RAILGUN 收款地址，余额和提现请在 Railway 等 RAILGUN 钱包中管理。":
    "Payments go straight to your RAILGUN address. Manage balance and withdrawals in a RAILGUN wallet such as Railway.",
  "正在等待 BNB Chain 最终确认，通常几秒钟。":
    "Waiting for BNB Chain finality, usually a few seconds.",
  "请在钱包中授权…": "Approve in your wallet…",
  "请在钱包中确认付款…": "Confirm the payment in your wallet…",
  账单金额: "Invoice amount",
  "这不是有效的 RAILGUN 0zk 地址。": "This is not a valid RAILGUN 0zk address.",
  "钱包会先请求授权本次金额，再确认付款，共两次确认。":
    "Your wallet asks you to approve this exact amount, then to confirm the payment: two confirmations.",
  链上交易: "On-chain transaction",
  "链上收到的付款与账单不完全一致，商家会联系你。":
    "The on-chain payment doesn't exactly match the invoice. The merchant will follow up.",
  "非托管 · 资金直接进入你的 RAILGUN 钱包":
    "Non-custodial · Funds go straight to your RAILGUN wallet",
  精确金额: "Exact amount",
  付款已确认: "Payment confirmed",
  "12 或 24 个英文单词，用空格分隔":
    "12 or 24 English words separated by spaces",
  "RAILGUN 手续费": "RAILGUN fee",
  "两次输入的密码不一致。": "The passwords don't match.",
  "从这台设备移除钱包后，只能用助记词恢复。确定吗？":
    "After removing the wallet from this device, only the recovery phrase can restore it. Continue?",
  从这台设备移除隐私钱包: "Remove the private wallet from this device",
  再次输入密码: "Confirm password",
  到账: "You receive",
  助记词: "Recovery phrase",
  "只用于在这台设备上加密钱包，我们无法帮你找回。":
    "Encrypts the wallet on this device only. We can't recover it for you.",
  "同步完成后显示。": "Shown after syncing.",
  在这台设备上恢复隐私钱包: "Restore your private wallet on this device",
  复制助记词: "Copy recovery phrase",
  "密码至少需要 10 个字符。": "Use at least 10 characters.",
  导入钱包: "Import wallet",
  "我已把助记词抄写在安全的地方。":
    "I've written the recovery phrase down somewhere safe.",
  提现: "Withdraw",
  提现到公开地址: "Withdraw to a public address",
  提现已完成: "Withdrawal complete",
  收款记录: "Incoming payments",
  收款钱包: "Receiving wallet",
  "款项直接进入你的隐私钱包。在「资金」页解锁后可以查看余额和提现。":
    "Payments go straight into your private wallet. Unlock it on the Funds page to see your balance and withdraw.",
  "正在准备提现…": "Preparing withdrawal…",
  "正在生成零知识证明…": "Generating zero-knowledge proof…",
  "生成隐私钱包 →": "Create private wallet →",
  "留空则提现到当前连接的钱包。提现会在链上公开收款地址和金额；网络费由当前连接的钱包支付。":
    "Leave empty to withdraw to the connected wallet. Withdrawals reveal the destination and amount on-chain; the connected wallet pays the network fee.",
  "确认周围没人后，点击显示助记词":
    "Make sure no one is watching, then click to reveal",
  确认移除: "Remove",
  "第一次同步需要下载全部隐私记录，可能要一两分钟；之后打开只需几秒。":
    "The first sync downloads the full private record and can take a minute or two. Afterwards it takes seconds.",
  "等待链上确认…": "Waiting for confirmation…",
  解锁: "Unlock",
  解锁隐私钱包: "Unlock your private wallet",
  "证明在你的浏览器中生成，首次需要下载证明文件。":
    "Proofs are generated in your browser; the first one downloads the proving files.",
  资金: "Funds",
  "输入创建钱包时抄下的助记词。它必须对应你的收款地址。如果你用的是 Railway 等外部钱包，请直接在那里查看余额和提现。":
    "Enter the recovery phrase you wrote down when creating the wallet; it must match your receiving address. If you use an external wallet such as Railway, check your balance and withdraw there.",
  "还没有收到隐私付款。": "No private payments yet.",
  "这 12 个词是找回钱包的唯一方式。换电脑、清理浏览器后，只能靠它恢复资金。请抄写在纸上，不要截图或发给任何人。":
    "These 12 words are the only way to recover the wallet. On a new computer or after clearing your browser, only they restore your funds. Write them on paper; never screenshot or share them.",
  这台设备上的隐私钱包不是你的收款钱包:
    "The private wallet on this device isn't your receiving wallet",
  钱包密码: "Wallet password",
  锁定: "Lock",
  隐私余额: "Private balance",
  "隐私钱包在你的浏览器里运行，密钥不会离开这台设备。":
    "Your private wallet runs in this browser. Keys never leave this device.",
  需关注: "Needs attention",
  "非托管 · 钥匙只在你的设备上，我们无法动用资金":
    "Non-custodial · Keys stay on your device; we can't move funds",
  "这组助记词对应的不是你的收款地址。":
    "This recovery phrase doesn't match your receiving address.",
  "这台设备上已经有一个隐私钱包。": "This device already has a private wallet.",
  "这台设备上没有隐私钱包。": "There's no private wallet on this device.",
  "请先解锁隐私钱包。": "Unlock your private wallet first.",
  "隐私钱包意外停止，请刷新页面重试。":
    "The private wallet stopped unexpectedly. Reload the page and try again.",
  "隐私钱包操作失败，请重试。":
    "Private wallet operation failed. Please try again.",
  "助记词无效，请检查拼写和顺序。":
    "Invalid recovery phrase. Check spelling and order.",
  "密码不正确。": "Wrong password.",
  "正在加载隐私钱包…": "Loading private wallet…",
  "正在启动隐私引擎…": "Starting privacy engine…",
  "正在连接 BNB Chain…": "Connecting to BNB Chain…",
  "正在同步隐私记录…": "Syncing private records…",
  已使用: "Spent",
  "在网站中创建（推荐）": "Create here (recommended)",
  "使用已有 RAILGUN 地址": "Use an existing RAILGUN address",
  网站内置钱包: "Built-in wallet",
  "已有 RAILGUN 地址": "Existing RAILGUN address",
  "收款时不暴露商家常用的公开钱包：付款直接进入商家自己的 RAILGUN 隐私钱包。":
    "Get paid without exposing your everyday business wallet: payments go straight into your own RAILGUN private wallet.",
  "本应用不收手续费；RAILGUN 协议对每次存入和提现各收 0.25%。":
    "No application fee. The RAILGUN protocol charges 0.25% on each deposit and withdrawal.",
  非托管: "Non-custodial",
  "RAILGUN 隐私收款": "RAILGUN private receiving",
  "开始收款 →": "Start getting paid →",
  "付款时，付款地址、代币、金额、时间以及与 RAILGUN 的交互会在链上公开。商家常用钱包、隐私余额和后续资金去向不会公开。":
    "When a customer pays, their address, the token, amount, time and the RAILGUN interaction are public on-chain. The merchant's everyday wallet, private balance and where funds go next are not.",
  钱包只在你的设备上: "Your wallet stays on your device",
  "隐私钱包在商家浏览器中生成，并用商家设置的密码加密保存。助记词和密码不会发送给服务器，我们也无法动用资金。服务器只根据付款交易在链上的公开记录确认到账。":
    "The private wallet is generated in the merchant's browser and encrypted with their password. The recovery phrase and password never reach our server, and we can't move funds. The server confirms payments only from their public on-chain records.",
  "已付款不等于可提现。新到的资金要先通过 RAILGUN 的 Private POI 检查，期间显示为待解锁，系统不会绕过这项检查。":
    "Paid doesn't mean spendable yet. New funds must pass RAILGUN's Private POI check and show as pending until then. We never bypass it.",
  "提现由商家的公开钱包发起并支付网络费。本应用不承诺匿名或不可追踪。":
    "Withdrawals are sent from the merchant's public wallet, which pays the network fee. This app doesn't promise anonymity or untraceability.",
  "BNB Chain · RAILGUN 隐私收款": "BNB Chain · RAILGUN private receiving",
  "支付 →": "Pay →",
  上一篇: "Previous",
  下一篇: "Next",
  "上一篇 / 下一篇": "Previous / next",
  开通隐私钱包: "Open your private wallet",
  "用浏览器钱包登录，网站在你的电脑上生成 RAILGUN 隐私钱包。":
    "Sign in with a browser wallet; the site generates a RAILGUN private wallet on your computer.",
  "填写金额、币种和服务内容，生成一个付款链接。":
    "Enter the amount, token and description to get a payment link.",
  客户付款: "Customer pays",
  "客户用自己的钱包付款，不需要注册，一分钟完成。":
    "Customers pay from their own wallet in about a minute, no account needed.",
  自动确认: "Confirmed automatically",
  "链上核对后几秒内标记已付款，并签发收据。":
    "Checked on-chain and marked paid within seconds, with a signed receipt.",
  "密钥只在你的浏览器里。我们没有任何能动用资金的密钥。":
    "Keys stay in your browser. We hold no key that can move funds.",
  秒级到账确认: "Confirmation in seconds",
  "服务器在链上逐项核对，最终确认后自动标记已付款，无需手动对账。":
    "Every payment is verified on-chain and marked paid at finality. Nothing to reconcile.",
  金额分毫不差: "Exact to the cent",
  "手续费由付款方承担，你收到的正好是发票金额，精确到最小单位。":
    "The payer covers the fee, so you receive exactly the invoice amount, to the smallest unit.",
  签名收据: "Signed receipts",
  "每笔付款都有 Ed25519 签名收据，附链上交易，可下载存档。":
    "Every payment gets an Ed25519-signed receipt with its on-chain transaction, ready to download.",
  无需安装: "Nothing to install",
  "商家和客户都只用浏览器。客户连注册都不需要。":
    "Merchants and customers only need a browser. Customers don't even sign up.",
  只授权精确金额: "Exact approvals only",
  "付款只请求本次金额的授权，从不要求无限授权。":
    "Payments only ask to approve the exact amount, never an unlimited allowance.",
  客户看到你的业务钱包地址: "Customers see your business wallet address",
  任何人能查到你的总收入: "Anyone can look up your total income",
  任何人能追踪你把钱转给了谁: "Anyone can trace where you send money",
  自动确认到账并出收据: "Payments confirmed automatically with receipts",
  资金只由你自己掌控: "Only you control the funds",
  "我需要下载钱包 App 吗？": "Do I need to download a wallet app?",
  "不需要。隐私钱包内置在网站里，商家和客户都只用浏览器。":
    "No. The private wallet is built into the site; merchants and customers only use a browser.",
  "你们能动用我的钱吗？": "Can you move my money?",
  "不能。钱包密钥只在你的浏览器里，服务器没有任何能转移资金的密钥。":
    "No. Wallet keys exist only in your browser; our server has no key that can move funds.",
  "客户付款后多久能确认？": "How fast are payments confirmed?",
  "通常在交易上链后几秒内自动确认，并生成收据。":
    "Usually within seconds of the transaction landing, with a receipt issued automatically.",
  "为什么新到的钱不能马上提现？": "Why can't I withdraw new funds right away?",
  "RAILGUN 要求新资金先通过 Private POI 合规检查，期间显示为待解锁。[了解更多](/docs/withdrawals)":
    "RAILGUN requires new funds to pass the Private POI compliance check first; until then they show as pending. [Learn more](/docs/withdrawals)",
  "用 USDT 或 USDC 收款，钱直接进入你自己的隐私钱包。":
    "Get paid in USDT or USDC straight into your own private wallet.",
  "客户看不到你的业务钱包、余额和资金去向。":
    "Customers never see your business wallet, balance or where funds go.",
  开始收款: "Start getting paid",
  阅读文档: "Read the docs",
  为什么需要隐私收款: "Why private receiving",
  "把收款地址发给客户，等于把账本给了他。":
    "Sharing a wallet address hands over your books.",
  "在公开链上，一个钱包地址就能查到它收过的每一笔钱、现在的余额和资金流向。Private Invoice 让客户付款进入你的隐私钱包，账本只有你自己能看。":
    "On a public chain, one wallet address reveals every payment it received, its balance and where the money went. With Private Invoice, customers pay into your private wallet and the books stay yours.",
  对比: "Comparison",
  普通钱包收款: "Plain wallet",
  是: "Yes",
  否: "No",
  工作流程: "How it works",
  "从开通到收款，四步完成。": "From sign-up to paid in four steps.",
  "查看快速开始 →": "Read Getting started →",
  功能: "Features",
  为真实生意设计的细节: "Details built for real businesses",
  常见问题: "FAQ",
  "开始之前，你可能想知道": "Before you start",
  "查看全部问题 →": "See all questions →",
  "今天就发出第一张隐私发票。": "Send your first private invoice today.",
  "只需要一个浏览器钱包，五分钟完成开通。":
    "All you need is a browser wallet. Setup takes five minutes.",
  快速开始: "Getting started",
  文档: "Docs",
  产品: "Product",
  客户如何付款: "How customers pay",
  内置隐私钱包: "Built-in private wallet",
  费用: "Fees",
  安全: "Security",
  隐私模型: "Privacy model",
  安全建议: "Security tips",
  网络与代币: "Networks and tokens",
  "用 USDT / USDC 收款，钱直接进入你自己的隐私钱包。":
    "Get paid in USDT / USDC straight into your own private wallet.",
  "从开通收款到提现的完整说明，以及费用、隐私和安全的细节。":
    "Everything from setting up to withdrawing, plus fees, privacy and security.",
  文档目录: "Documentation",
  文档首页: "Docs home",
  本页内容: "On this page",
  搜索文档: "Search docs",
  "搜索文档，例如：助记词、手续费、POI":
    "Search docs, e.g. recovery phrase, fees, POI",
  "没有找到相关文档。": "No matching pages.",
  "用 Private Invoice 收款": "Getting paid with Private Invoice",
  找不到这篇文档: "Page not found",
  返回文档首页: "Back to docs",
  复制: "Copy",
  "基于 RAILGUN 零知识证明协议 · BNB Chain":
    "Built on the RAILGUN zero-knowledge protocol · BNB Chain",
  "用 USDT 或 USDC 收款，付款通过 RAILGUN 的 Shield 合约直接进入你的隐私钱包。":
    "Get paid in USDT or USDC: payments go through RAILGUN's Shield contract straight into your private wallet.",
  "链上只留下零知识承诺，客户看不到你的业务钱包、余额和资金去向。":
    "Only a zero-knowledge commitment lands on-chain, so customers never see your business wallet, balance or where funds go.",
  "密钥由 RAILGUN Wallet SDK 在你的浏览器里派生并加密保存，服务器没有任何能动用资金的密钥。":
    "Keys are derived and encrypted in your browser by the RAILGUN Wallet SDK. Our server holds no key that can move funds.",
  "解码 RAILGUN Shield 事件，逐项比对票据与密文，在 BNB Chain 最终确认后自动标记已付款。":
    "Decodes the RAILGUN Shield event, matches note and ciphertext, and marks the invoice paid at BNB Chain finality.",
  "按合约 getFee() 的含费公式反推总额，扣除 0.25% 协议费后，到账正好等于发票金额。":
    "The gross amount is solved from the contract's getFee() formula, so after the 0.25% protocol fee you receive exactly the invoice amount.",
  "付款交易由服务器预先构造，客户钱包只签名发送，不需要加载 RAILGUN 引擎。":
    "The server prepares the payment transaction; the customer's wallet just signs it, with no RAILGUN engine to load.",
  协议数据: "Protocol facts",
  "BNB Chain 最终确认": "BNB Chain finality",
  平台托管的资金: "Funds held by us",
  "RAILGUN 协议费": "RAILGUN protocol fee",
  链上可验证: "Verifiable on-chain",
  协议层: "Protocol layer",
  资金在链上走过的每一步: "Every step your money takes on-chain",
  "Private Invoice 不托管资金，也不运行自己的隐私池。所有隐私能力来自 RAILGUN：一套部署在 BNB Chain 上、经过实际运行检验的零知识证明协议。我们负责构造交易、核验链上结果和管理发票。":
    "Private Invoice holds no funds and runs no privacy pool of its own. All privacy comes from RAILGUN, a battle-tested zero-knowledge protocol deployed on BNB Chain. We build the transactions, verify the on-chain result and manage invoices.",
  "阅读一笔付款的链上过程 →": "Read the anatomy of a payment →",
  客户钱包: "Customer wallet",
  "授权精确金额，把 USDT 存入 RAILGUN 代理合约。":
    "Approves the exact amount and deposits USDT into the RAILGUN proxy.",
  "RAILGUN 代理合约": "RAILGUN proxy contract",
  "扣除 0.25% 协议费，把票据承诺写入 Poseidon Merkle 树。":
    "Takes the 0.25% protocol fee and writes the note commitment into a Poseidon Merkle tree.",
  加密票据: "Encrypted note",
  "票据随机数只能用商家的查看密钥解开，链上只看到哈希。":
    "Only the merchant's viewing key can open the note; the chain only sees a hash.",
  链上核验: "On-chain verification",
  "服务器比对 Shield 事件，BNB Chain 最终确认后签发收据。":
    "The server matches the Shield event and signs a receipt at BNB Chain finality.",
  零知识提现: "Zero-knowledge withdrawal",
  "商家在浏览器本地生成证明，把资金取回任意地址。":
    "The merchant proves ownership locally in the browser and withdraws to any address.",
  链上核验示例: "On-chain verification example",
  "不靠信任，靠核对": "Verified, not trusted",
  "每一笔付款都由服务器预先构造，上链后逐项比对：一次性公钥、票据公钥、密文、代币和扣费后的金额，全部一致且区块最终确认，才会标记为已付款。":
    "Every payment is prepared in advance and checked field by field once it lands: one-time key, note key, ciphertext, token and amount after fee. Only when all match and the block is final is the invoice marked paid.",
  "服务器不持有任何查看密钥或花费密钥：它能确认钱到了你的隐私钱包，却看不到你的余额，也动不了你的钱。":
    "The server holds no viewing or spending key: it can confirm money reached your private wallet, yet can't see your balance or move your funds.",
  "了解核验原理 →": "How verification works →",
  技术栈: "Technology",
  建立在经过检验的密码学之上: "Built on proven cryptography",
  "花费票据时证明所有权与金额守恒，不暴露是哪张票据。":
    "Proves ownership and balanced amounts when spending, without revealing which note.",
  "深度 16 的承诺树，链上只保存票据哈希。":
    "A depth-16 commitment tree; only note hashes are stored on-chain.",
  "一次性密钥交换加密票据，只有商家的查看密钥能解开。":
    "A one-time key exchange encrypts each note for the merchant's viewing key alone.",
  "零知识方式证明资金不来自被标记的地址。":
    "Proves in zero knowledge that funds don't come from flagged addresses.",
  "约 2 秒进入 finalized，确认后不可回滚。":
    "Finalized in about two seconds and irreversible after that.",
  "规范化 JSON + SHA-256 + Ed25519 签名，可离线验证。":
    "Canonical JSON, SHA-256 and an Ed25519 signature, verifiable offline.",
  "钱包在浏览器本地加密，密码派生密钥 60 万次迭代。":
    "The wallet is encrypted locally with a password-derived key (600,000 iterations).",
  "RAILGUN Wallet SDK 运行在隔离线程，密钥不进入页面。":
    "The RAILGUN Wallet SDK runs in an isolated thread; keys never touch the page.",
  "RAILGUN 是什么 →": "What is RAILGUN →",
  "系统架构 →": "Architecture →",
  "RAILGUN 是什么": "What is RAILGUN",
  系统架构: "Architecture",
};
const reverse = Object.fromEntries(
  Object.entries(messages).map(([zh, en]) => [
    en.replace(/\s+/g, " ").trim(),
    zh,
  ]),
);
export function translate(message: string, locale: Locale): string {
  const normalized = message.replace(/\s+/g, " ").trim();
  if (locale === "en") return messages[normalized] ?? message;
  return reverse[normalized] ?? message;
}
