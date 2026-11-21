const fs = require('fs');
let s = fs.readFileSync('src/app/archive/page.tsx', 'utf8').replace(/\r\n/g, '\n');
const before = s;

s = s.replace(
  "import { getArchive, fmtDate } from '@/lib/content';",
  "import { getArchive, fmtDate } from '@/lib/content';\nimport { getPages } from '@/lib/pages';"
);
s = s.replace(
  /export const metadata: Metadata = \{\n  title: [^\n]*\n  description: [^\n]*\n\};/,
  "export async function generateMetadata(): Promise<Metadata> {\n  const pages = await getPages();\n  return { title: pages.archive.title, description: pages.archive.lead };\n}"
);
s = s.replace(
  'export default async function ArchivePage() {\n  const groups = await getArchive();',
  'export default async function ArchivePage() {\n  const [groups, pages] = await Promise.all([getArchive(), getPages()]);'
);
s = s.replace(
  /          <h1>\n            <span className="kicker">ARCHIVE<\/span>归档\n          <\/h1>\n          <p>[^\n]*<\/p>/,
  '          <h1>\n            <span className="kicker">{pages.archive.kicker}</span>{pages.archive.title}\n          </h1>\n          <p>{pages.archive.lead}</p>'
);

fs.writeFileSync('src/app/archive/page.tsx', s, 'utf8');
console.log('changed:', s !== before, '| has pages:', s.includes('pages.archive.kicker'), '| genMeta:', s.includes('generateMetadata'));
