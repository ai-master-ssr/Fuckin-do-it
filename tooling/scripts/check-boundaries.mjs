// Minimal placeholder gate: replace with dependency-graph enforcement when packages are implemented.
// Intentionally fails closed only on obvious forbidden source imports.
import fs from 'node:fs';
import path from 'node:path';
const roots = ['packages', 'engines', 'integrations'];
const violations = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.[cm]?[jt]sx?$/.test(entry.name)) {
      const source = fs.readFileSync(full, 'utf8');
      if (full.startsWith(path.join('packages', 'artifact-core')) && /from\s+['"]@mgs\/engine-/.test(source)) {
        violations.push(`${full}: artifact-core must not depend on concrete engines`);
      }
    }
  }
}
for (const root of roots) if (fs.existsSync(root)) walk(root);
if (violations.length) { console.error(violations.join('\n')); process.exit(1); }
console.log('Basic dependency-boundary check passed.');
