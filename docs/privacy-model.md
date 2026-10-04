# Privacy model

The intended protection is the merchant’s normal business EVM wallet, not universal anonymity. Public-to-private Mode A reveals payer, token, amount, timing and RAILGUN interaction publicly. The app stores business metadata and payer transaction context.

A payer must obtain the merchant 0zk receiving address to construct a Shield. The SDK Shield key can also recover the recipient 0zk address from encrypted Shield data. Hiding it visually is not a cryptographic secrecy guarantee. This does not automatically expose the merchant’s normal EVM wallet, private total balance or other private transfers. Onboarding wallet authentication lets the service associate a merchant EVM identity with the stored receiving address; the service must not claim it cannot see this relationship.

Private spending credentials, local encryption passwords and viewing keys never reach the server in the intended local mode. Encrypted wallet storage and artifacts stay browser-local. Without opt-in cloud viewing access, final confirmation depends on the merchant opening and scanning its wallet.

Payment recognized does not mean spendable. Preserve SDK POI bucket semantics. Do not bypass blocked or missing POI conditions. Legitimate unshield-to-origin APIs exist but are not exposed until verified.

Receipt links are bearer links. Public transaction hashes may reveal payer addresses. Public withdrawals reveal recipient and amount. Private-to-private Broadcaster payments are a later feature and have no acceptance claim here.

Current build uses mocked assets throughout checkout. The isolated SDK spike is research; it cannot broadcast. No privacy guarantee has been certified through a real on-chain acceptance run.
