const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, '..', 'dist');
const dst = path.join(__dirname, '..', '..', 'backend', 'wwwroot');
if (!fs.existsSync(src)) {
  console.error('frontend/dist not found. Run npm run build first.');
  process.exit(1);
}
if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true });
function copyDir(s, d) {
  for (const e of fs.readdirSync(s, { withFileTypes: true })) {
    const sp = path.join(s, e.name);
    const dp = path.join(d, e.name);
    if (e.isDirectory()) {
      if (!fs.existsSync(dp)) fs.mkdirSync(dp, { recursive: true });
      copyDir(sp, dp);
    } else fs.copyFileSync(sp, dp);
  }
}
copyDir(src, dst);
console.log('Copied frontend/dist to backend/wwwroot');
