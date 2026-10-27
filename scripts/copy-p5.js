const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "node_modules", "p5", "lib", "p5.min.js");
const destDir = path.join(__dirname, "..", "public", "vendor");
const dest = path.join(destDir, "p5.min.js");

if (!fs.existsSync(src)) {
  console.warn("[copy-p5] p5.min.js not found — skip (is p5 installed?)");
  process.exit(0);
}

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log("[copy-p5] wrote public/vendor/p5.min.js");
