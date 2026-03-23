import fs from 'fs';
import path from 'path';

const htmlDir = path.join(process.cwd(), 'html');
const outDir = path.join(process.cwd(), 'dist-html');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

const files = fs.readdirSync(htmlDir).filter((f) => f.endsWith('.html'));
console.log('🧱 Converting HTML templates to TypeScript modules...');

let indexContent = '';

for (const file of files) {
  const name = file.replace('.html', '');
  const varName = camelCase(name) + 'Html';
  const html = fs.readFileSync(path.join(htmlDir, file), 'utf-8').replace(/`/g, '\\`');

  const tsContent = `// ⚡ Auto-generated from /html/${file}
export const ${varName}: string = \`${html}\`;
`;
  fs.writeFileSync(path.join(outDir, `${name}.ts`), tsContent, 'utf-8');

  indexContent += `export { ${varName} } from "./${name}.ts";\n`;
}

fs.writeFileSync(path.join(outDir, 'index.ts'), indexContent, 'utf-8');
console.log(`\n✨ Exported TS templates to: ${outDir}`);

function camelCase(str: string) {
  return str.replace(/[-_](\w)/g, (_, c) => c.toUpperCase());
}
