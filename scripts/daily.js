const fs = require('fs');
const path = require('path');

const VAULT_PATH = process.env.VAULT_PATH || "/home/teacherchris37/Solomons-Chamber";
const DAILY_DIR = path.join(VAULT_PATH, "05-Self-Notes/daily");

// Ensure directory exists
if (!fs.existsSync(DAILY_DIR)) {
  fs.mkdirSync(DAILY_DIR, { recursive: true });
}

const today = new Date().toISOString().split('T')[0];
const title = process.argv[2] || "Daily Note";
const filename = path.join(DAILY_DIR, `${today}.md`);

const content = `# ${title}

**Date:** ${new Date().toLocaleString()}  
**Tags:** #daily

## Morning

- 

## Afternoon

- 

## Evening

- 

## Thoughts



---
*Created with Solomons Chamber*
`;

if (fs.existsSync(filename)) {
  console.log(`📝 Daily note already exists: ${filename}`);
  console.log(`   Opening existing file...`);
} else {
  fs.writeFileSync(filename, content);
  console.log(`📝 Created daily note: ${filename}`);
}

console.log(`\nTo edit: cat ${filename}`);
