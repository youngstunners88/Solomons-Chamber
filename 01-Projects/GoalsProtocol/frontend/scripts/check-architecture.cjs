#!/usr/bin/env node
/**
 * Architecture validation script
 * Scans imports to detect Clean Architecture violations
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../src');

const LAYERS = {
  presentation: ['application', 'domain'],
  application: ['domain'],
  domain: [],
  infrastructure: ['application', 'domain'],
};

function findTsFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      findTsFiles(fullPath, files);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

function getLayer(filePath) {
  const relative = path.relative(SRC_DIR, filePath);
  const firstDir = relative.split(path.sep)[0];
  return LAYERS[firstDir] !== undefined ? firstDir : null;
}

function extractImports(content) {
  const imports = [];
  const regex = /from\s+['"]([^'"]+)['"];?/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  return imports;
}

function checkFile(filePath) {
  const layer = getLayer(filePath);
  if (!layer) return [];

  const content = fs.readFileSync(filePath, 'utf8');
  const imports = extractImports(content);
  const violations = [];

  for (const imp of imports) {
    if (imp.startsWith('.')) {
      const resolved = path.resolve(path.dirname(filePath), imp);
      const relativeToSrc = path.relative(SRC_DIR, resolved);
      const targetLayer = relativeToSrc.split(path.sep)[0];

      if (
        LAYERS[targetLayer] !== undefined &&
        targetLayer !== layer &&
        !LAYERS[layer].includes(targetLayer)
      ) {
        violations.push({
          file: path.relative(SRC_DIR, filePath),
          layer,
          imports: targetLayer,
          importPath: imp,
        });
      }
    } else if (imp.startsWith('@')) {
      const targetLayer = imp.slice(1).split('/')[0];
      if (
        LAYERS[targetLayer] !== undefined &&
        targetLayer !== layer &&
        !LAYERS[layer].includes(targetLayer)
      ) {
        violations.push({
          file: path.relative(SRC_DIR, filePath),
          layer,
          imports: targetLayer,
          importPath: imp,
        });
      }
    }
  }

  return violations;
}

const files = findTsFiles(SRC_DIR);
let allViolations = [];

for (const file of files) {
  allViolations = allViolations.concat(checkFile(file));
}

if (allViolations.length === 0) {
  console.log('✅ No architecture violations found!');
  process.exit(0);
} else {
  console.error(`❌ Found ${allViolations.length} architecture violation(s):\n`);
  for (const v of allViolations) {
    console.error(`  ${v.file}`);
    console.error(`    ${v.layer} → ${v.imports} (${v.importPath})`);
  }
  process.exit(1);
}
