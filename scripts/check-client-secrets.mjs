import fs from "node:fs";
const env = fs.readFileSync(".env", "utf8");
const values = ["SESSION_SECRET", "RECEIPT_SIGNING_KEY"]
  .map((name) =>
    env
      .split("\n")
      .find((line) => line.startsWith(name + "="))
      ?.slice(name.length + 1),
  )
  .filter(Boolean);
let leaked = false;
let checked = 0;
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const path = dir + "/" + entry.name;
    if (entry.isDirectory()) walk(path);
    else if (path.endsWith(".js") || path.endsWith(".html")) {
      checked++;
      const content = fs.readFileSync(path, "utf8");
      if (values.some((value) => content.includes(value))) leaked = true;
    }
  }
}
walk(".next/static");
walk("public/railgun-spike");
console.log(
  JSON.stringify({
    checkedBrowserFiles: checked,
    serverSecretsInBrowserAssets: leaked,
  }),
);
if (values.length !== 2 || leaked) process.exit(1);
