const fs = require('fs');
const path = require('path');

const VAULT_PATH = process.env.VAULT_PATH || "/home/teacherchris37/Solomons-Chamber";

function countFiles(dir) {
  try {
    const fullPath = path.join(VAULT_PATH, dir);
    if (!fs.existsSync(fullPath)) return 0;
    return fs.readdirSync(fullPath).filter(f => f.endsWith('.md')).length;
  } catch {
    return 0;
  }
}

function getLatest(dir) {
  try {
    const fullPath = path.join(VAULT_PATH, dir);
    if (!fs.existsSync(fullPath)) return "None";
    
    const files = fs.readdirSync(fullPath)
      .filter(f => f.endsWith('.md'))
      .map(f => ({
        name: f,
        mtime: fs.statSync(path.join(fullPath, f)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime);
    
    return files[0]?.name || "None";
  } catch {
    return "None";
  }
}

console.log("🗂️  Solomons Chamber - Status Dashboard");
console.log("========================================");
console.log("");

const counts = {
  inbox: countFiles("00-Inbox"),
  projects: countFiles("01-Projects/active"),
  research: countFiles("02-Research"),
  trades: countFiles("03-Trading/signals"),
  daily: countFiles("05-Self-Notes/daily"),
  media: countFiles("06-Media"),
  skills: countFiles("10-Skills"),
};

console.log(`📊 Vault Statistics:`);
console.log(`   Inbox:        ${counts.inbox} items`);
console.log(`   Projects:     ${counts.projects} active`);
console.log(`   Research:     ${counts.research} topics`);
console.log(`   Trading:      ${counts.trades} signals`);
console.log(`   Daily Notes:  ${counts.daily} entries`);
console.log(`   Media:        ${counts.media} files`);
console.log(`   Skills:       ${counts.skills} skills`);
console.log("");

console.log(`📝 Recent Activity:`);
console.log(`   Latest daily note: ${getLatest("05-Self-Notes/daily")}`);
console.log(`   Latest inbox item: ${getLatest("00-Inbox")}`);
console.log("");

console.log(`💡 Quick Actions:`);
console.log(`   node scripts/daily.js "Your note"  - Create daily note`);
console.log(`   ls 00-Inbox/                       - Check inbox`);
console.log(`   git add -A && git commit -m "..."  - Save changes`);
