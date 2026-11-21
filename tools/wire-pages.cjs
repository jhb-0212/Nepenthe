const fs = require('fs');

function edit(path, fn) {
  const src = fs.readFileSync(path, 'utf8');
  const out = fn(src);
  if (out === src) { console.log('NO CHANGE', path); return; }
  fs.writeFileSync(path, out, 'utf8');
  console.log('ok', path);
}

const head = (copy, key, extra = '') =>
`        <div className="page-head">
          <h1>
            <span className="kicker">{pages.${key}.kicker}</span>{pages.${key}.title}
          </h1>
          <p>{pages.${key}.lead}</p>${extra}
        </div>`;

/* ---------- 文章 ---------- */
edit('src/app/writing/page.tsx', (s) => {
  s = s.replace(
    "import { listPosts, fmtDate } from '@/lib/content';\n\nexport const metadata: Metadata = {\n  title: '文章',\n  description: '写得出来的都放这儿。没被采纳的句子、删掉的镜头、半夜推翻的结构，也算。',\n};",
    "import { listPosts, fmtDate } from '@/lib/content';\nimport { getPages } from '@/lib/pages';\n\nexport async function generateMetadata(): Promise<Metadata> {\n  const pages = await getPages();\n  return { title: pages.writing.title, description: pages.writing.lead };\n}"
  );
  s = s.replace(
    'export default async function WritingPage() {\n  const posts = await listPosts();',
    'export default async function WritingPage() {\n  const [posts, pages] = await Promise.all([listPosts(), getPages()]);'
  );
  s = s.replace(
    /        <div className="page-head">[\s\S]*?        <\/div>,\n\n        <div className={posts.length/,
    ''
  );
  // 精确替换页头
  s = s.replace(
`        <div className="page-head">
          <h1>
            <span className="kicker">WORDS</span>文章
          </h1>
          <p>写得出来的都放这儿。没被采纳的句子、删掉的镜头、半夜推翻的结构，也算。</p>
        </div>`,
    head('', 'writing')
  );
  s = s.replace(
    "{posts.length === 0 ? <p className=\"plain-note\">还没有文章。后台发布第一篇之后，这里就有了。</p> : null}",
    '{posts.length === 0 && pages.writing.note ? <p className="plain-note">{pages.writing.note}</p> : null}'
  );
  return s;
});

/* ---------- 随记 ---------- */
edit('src/app/notes/page.tsx', (s) => {
  s = s.replace(
    "import { renderMarkdown } from '@/lib/markdown';\n\nexport const metadata: Metadata = {\n  title: '随记',\n  description: '没长到能写成文章的那些话。一天一句，或者三天一句，想起来就记。',\n};",
    "import { renderMarkdown } from '@/lib/markdown';\nimport { getPages } from '@/lib/pages';\n\nexport async function generateMetadata(): Promise<Metadata> {\n  const pages = await getPages();\n  return { title: pages.notes.title, description: pages.notes.lead };\n}"
  );
  s = s.replace(
    'export default async function NotesPage() {\n  const notes = await listNotes();',
    'export default async function NotesPage() {\n  const [notes, pages] = await Promise.all([listNotes(), getPages()]);'
  );
  s = s.replace(
`          <h1>
            <span className="kicker">NOTES</span>随记
          </h1>
          <p>没长到能写成文章的那些话。一天一句，或者三天一句，想起来就记。</p>`,
`          <h1>
            <span className="kicker">{pages.notes.kicker}</span>{pages.notes.title}
          </h1>
          <p>{pages.notes.lead}</p>`
  );
  s = s.replace(
    '{notes.length === 0 ? <p className="plain-note">还没有随记。</p> : null}',
    '{notes.length === 0 && pages.notes.note ? <p className="plain-note">{pages.notes.note}</p> : null}'
  );
  return s;
});

/* ---------- 小说 ---------- */
edit('src/app/novels/page.tsx', (s) => {
  s = s.replace(
    "import { listNovels, fmtDate } from '@/lib/content';\n\nexport const metadata: Metadata = {\n  title: '小说',\n  description: '长的那种。连载中的、筹备中的，都在这儿。',\n};",
    "import { listNovels, fmtDate } from '@/lib/content';\nimport { getPages } from '@/lib/pages';\n\nexport async function generateMetadata(): Promise<Metadata> {\n  const pages = await getPages();\n  return { title: pages.novels.title, description: pages.novels.lead };\n}"
  );
  s = s.replace(
    'export default async function NovelsPage() {\n  const works = await listNovels();',
    'export default async function NovelsPage() {\n  const [works, pages] = await Promise.all([listNovels(), getPages()]);'
  );
  s = s.replace(
`          <h1>
            <span className="kicker">FICTION</span>小说
          </h1>
          <p>长的那种。连载中的、筹备中的，都在这儿。</p>`,
`          <h1>
            <span className="kicker">{pages.novels.kicker}</span>{pages.novels.title}
          </h1>
          <p>{pages.novels.lead}</p>`
  );
  s = s.replace(
    '<p className="plain-note">作品会一部一部加。每部里面按章节排，读起来像翻开一本。</p>',
    '{pages.novels.note ? <p className="plain-note">{pages.novels.note}</p> : null}'
  );
  return s;
});

/* ---------- 音乐 ---------- */
edit('src/app/music/page.tsx', (s) => {
  s = s.replace(
    "import MusicStage from '@/components/MusicStage';\n\nexport const metadata: Metadata = {\n  title: '音乐',\n  description: '最近在循环的东西。曲目会换，理由不会。',\n};\n\nexport default function MusicPage() {",
    "import MusicStage from '@/components/MusicStage';\nimport { getPages } from '@/lib/pages';\n\nexport async function generateMetadata(): Promise<Metadata> {\n  const pages = await getPages();\n  return { title: pages.music.title, description: pages.music.lead };\n}\n\nexport default async function MusicPage() {\n  const pages = await getPages();"
  );
  s = s.replace(
`          <h1>
            <span className="kicker">SOUND</span>音乐
          </h1>
          <p>最近在循环的东西。声音走服务端代理，网易云和 QQ 音乐混着放，歌词跟着唱。</p>`,
`          <h1>
            <span className="kicker">{pages.music.kicker}</span>{pages.music.title}
          </h1>
          <p>{pages.music.lead}</p>`
  );
  return s;
});

/* ---------- 在做 ---------- */
edit('src/app/doing/page.tsx', (s) => {
  s = s.replace(
    "import { getSite } from '@/lib/site';\n\nexport const metadata: Metadata = {\n  title: '在做',\n  description: '这一页只回答一件事：我把时间花在哪。不写计划，只写正在进行的。',\n};",
    "import { getSite } from '@/lib/site';\nimport { getPages } from '@/lib/pages';\n\nexport async function generateMetadata(): Promise<Metadata> {\n  const pages = await getPages();\n  return { title: pages.doing.title, description: pages.doing.lead };\n}"
  );
  s = s.replace(
    'const [site, doings] = await Promise.all([getSite(), listDoings()]);',
    'const [site, doings, pages] = await Promise.all([getSite(), listDoings(), getPages()]);'
  );
  s = s.replace(
`          <h1>
            <span className="kicker">NOW</span>在做
          </h1>
          <p>这一页只回答一件事：我把时间花在哪。不写计划，只写正在进行的。</p>`,
`          <h1>
            <span className="kicker">{pages.doing.kicker}</span>{pages.doing.title}
          </h1>
          <p>{pages.doing.lead}</p>`
  );
  s = s.replace(
`        <p className="now-lead">
          白天写代码和论文，晚上写文案、剪片子。<strong>不追求样样精通</strong>，但要求每一件拿出来的东西，自己愿意署名。
        </p>`,
    '        {pages.doing.sub ? <p className="now-lead">{pages.doing.sub}</p> : null}'
  );
  return s;
});

/* ---------- 留言 ---------- */
edit('src/app/wall/page.tsx', (s) => {
  s = s.replace(
    "import MessageForm from '@/components/MessageForm';\n\nexport const metadata: Metadata = {\n  title: '留言',\n  description: '不用登录，写一句就走。留言人工审核后才会出现在墙上。',\n};",
    "import MessageForm from '@/components/MessageForm';\nimport { getPages } from '@/lib/pages';\n\nexport async function generateMetadata(): Promise<Metadata> {\n  const pages = await getPages();\n  return { title: pages.wall.title, description: pages.wall.lead };\n}"
  );
  s = s.replace(
    '  const messages = await prisma.message.findMany({',
    '  const [messages, pages] = await Promise.all([\n    prisma.message.findMany({'
  );
  s = s.replace(
`    select: { id: true, name: true, body: true, createdAt: true },
  });`,
`      select: { id: true, name: true, body: true, createdAt: true },
    }),
    getPages(),
  ]);`
  );
  s = s.replace(
`          <h1>
            <span className="kicker">WALL</span>留言墙
          </h1>
          <p>不用登录，不用留联系方式。写一句就走 —— 审核过了，它才出现在下面。</p>`,
`          <h1>
            <span className="kicker">{pages.wall.kicker}</span>{pages.wall.title}
          </h1>
          <p>{pages.wall.lead}</p>`
  );
  s = s.replace(
    '<p className="plain-note">墙上还空着。第一句话留给你。</p>',
    '{pages.wall.note ? <p className="plain-note">{pages.wall.note}</p> : null}'
  );
  return s;
});

/* ---------- 搜索 ---------- */
edit('src/app/search/page.tsx', (s) => {
  s = s.replace(
    "import SearchPanel from '@/components/SearchPanel';\n\nexport const metadata: Metadata = {\n  title: '搜索',\n  description: '搜文章、随记、小说的正文。',\n};\n\nexport default function SearchPage() {",
    "import SearchPanel from '@/components/SearchPanel';\nimport { getPages } from '@/lib/pages';\n\nexport async function generateMetadata(): Promise<Metadata> {\n  const pages = await getPages();\n  return { title: pages.search.title, description: pages.search.lead };\n}\n\nexport default async function SearchPage() {\n  const pages = await getPages();"
  );
  s = s.replace(
`          <h1>
            <span className="kicker">SEARCH</span>搜索
          </h1>
          <p>搜文章、随记、小说的正文。输入两个字就能出结果。</p>`,
`          <h1>
            <span className="kicker">{pages.search.kicker}</span>{pages.search.title}
          </h1>
          <p>{pages.search.lead}</p>`
  );
  s = s.replace(
`        <p className="plain-note">
          索引在服务端（Meilisearch）实时维护，发布内容后立即可搜；没配 Meilisearch 时退回 PostgreSQL 检索。
        </p>`,
    '        {pages.search.note ? <p className="plain-note">{pages.search.note}</p> : null}'
  );
  return s;
});

/* ---------- 归档 ---------- */
edit('src/app/archive/page.tsx', (s) => {
  s = s.replace(
    "import { getArchive, fmtDate } from '@/lib/content';\n\nexport const metadata: Metadata = {\n  title: '归档',\n  description: '一条河从最早流到今天，文章、随记、小说章节都浮在河上。',\n};",
    "import { getArchive, fmtDate } from '@/lib/content';\nimport { getPages } from '@/lib/pages';\n\nexport async function generateMetadata(): Promise<Metadata> {\n  const pages = await getPages();\n  return { title: pages.archive.title, description: pages.archive.lead };\n}"
  );
  s = s.replace(
    'export default async function ArchivePage() {\n  const groups = await getArchive();',
    'export default async function ArchivePage() {\n  const [groups, pages] = await Promise.all([getArchive(), getPages()]);'
  );
  s = s.replace(
`          <h1>
            <span className="kicker">ARCHIVE</span>归档
          </h1>
          <p>一条河从最早流到今天，越往下越新。文章、随记、小说章节都浮在河上。</p>`,
`          <h1>
            <span className="kicker">{pages.archive.kicker}</span>{pages.archive.title}
          </h1>
          <p>{pages.archive.lead}</p>`
  );
  s = s.replace(
    '<p className="arc-empty">还没有能归档的东西。</p>',
    '{pages.archive.note ? <p className="arc-empty">{pages.archive.note}</p> : null}'
  );
  return s;
});

/* ---------- 相册 ---------- */
edit('src/app/gallery/page.tsx', (s) => {
  s = s.replace(
    "import { listAlbums } from '@/lib/content';\n\nexport const metadata: Metadata = {\n  title: '相册',\n  description: '不是摄影集，只是生活和创作留下的抓拍痕迹。',\n};",
    "import { listAlbums } from '@/lib/content';\nimport { getPages } from '@/lib/pages';\n\nexport async function generateMetadata(): Promise<Metadata> {\n  const pages = await getPages();\n  return { title: pages.gallery.title, description: pages.gallery.lead };\n}"
  );
  s = s.replace(
    'export default async function GalleryPage() {\n  const albums = await listAlbums();',
    'export default async function GalleryPage() {\n  const [albums, pages] = await Promise.all([listAlbums(), getPages()]);'
  );
  s = s.replace(
    "style={{ backgroundImage: 'url(/hero-bg.jpg)' }}",
    "style={{ backgroundImage: `url(${pages.galleryBg || '/hero-bg.jpg'})` }}"
  );
  s = s.replace(
`          <span className="gallery-banner-tag">GALLERY</span>
          <h1>风月册</h1>
          <p>所有不经意的遇见，都是光馈赠的散文诗</p>
          <p className="gallery-banner-sub">山野入镜，清风翻页</p>`,
`          <span className="gallery-banner-tag">{pages.gallery.kicker}</span>
          <h1>{pages.gallery.title}</h1>
          <p>{pages.gallery.lead}</p>
          {pages.gallery.sub ? <p className="gallery-banner-sub">{pages.gallery.sub}</p> : null}`
  );
  s = s.replace(
    '<p className="plain-note">相册还没建。</p>',
    '{pages.gallery.note ? <p className="plain-note">{pages.gallery.note}</p> : null}'
  );
  return s;
});
