/**
 * 把随仓库带的内容灌进 PostgreSQL。
 * 数据源就在 prisma/seed-data/ 下（旧站迁过来的 markdown 与 JSON）。
 * 幂等：按 slug upsert，重复跑不会重复插入；不会删掉后台里已有的东西。
 *
 * 跑法：npm run db:seed
 */
import { PrismaClient, Prisma } from '@prisma/client';
import { readFile, readdir } from 'node:fs/promises';

// tsx 不会自动读 .env，这里显式加载（Node 20.6+ 内置）
try {
  process.loadEnvFile();
} catch {
  /* 环境变量由容器注入时不需要 .env */
}
import { existsSync } from 'node:fs';
import path from 'node:path';

const prisma = new PrismaClient();
const ROOT = path.resolve(process.cwd(), 'prisma', 'seed-data');
const CONTENT = path.join(ROOT, 'content');
const DATA = path.join(ROOT, 'data');

type Front = Record<string, string | string[]>;

function splitFront(raw: string): { front: Front; body: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!m) return { front: {}, body: raw };

  const front: Front = {};
  let currentKey = '';
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim()) continue;
    const listItem = /^\s+-\s+(.*)$/.exec(line);
    if (listItem && currentKey) {
      const arr = Array.isArray(front[currentKey]) ? (front[currentKey] as string[]) : [];
      arr.push(unquote(listItem[1]));
      front[currentKey] = arr;
      continue;
    }
    const kv = /^([A-Za-z_]+):\s*(.*)$/.exec(line);
    if (kv) {
      currentKey = kv[1];
      const v = kv[2].trim();
      front[currentKey] = v ? unquote(v) : [];
    }
  }
  return { front, body: m[2].trim() };
}

const unquote = (s: string) => s.replace(/^['"]/, '').replace(/['"]$/, '').trim();

const asDate = (v: unknown, fallback = new Date()) => {
  const s = String(v ?? '').slice(0, 10);
  const d = new Date(`${s}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? fallback : d;
};
const asString = (v: unknown) => (Array.isArray(v) ? v.join(' ') : String(v ?? ''));
const asArray = (v: unknown) => (Array.isArray(v) ? v : []);

async function listMd(dir: string) {
  if (!existsSync(dir)) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  return entries.filter((e) => e.isFile() && e.name.endsWith('.md')).map((e) => e.name);
}

async function seedPosts() {
  const dir = path.join(CONTENT, 'posts');
  const files = await listMd(dir);
  for (const file of files) {
    const slug = file.replace(/\.md$/, '');
    const { front, body } = splitFront(await readFile(path.join(dir, file), 'utf8'));
    await prisma.post.upsert({
      where: { slug },
      create: {
        slug,
        title: asString(front.title) || slug,
        date: asDate(front.date),
        tag: asString(front.tag),
        readTime: asString(front.readTime),
        summary: asString(front.summary),
        cover: front.cover ? asString(front.cover) : null,
        body,
        draft: asString(front.draft) === 'true',
      },
      update: {}, // 已有就跳过，别覆盖后台改过的版本
    });
  }
  console.log(`posts: ${files.length}`);
}

async function seedNotes() {
  const dir = path.join(CONTENT, 'notes');
  const files = await listMd(dir);
  for (const file of files) {
    const slug = file.replace(/\.md$/, '');
    const { front, body } = splitFront(await readFile(path.join(dir, file), 'utf8'));
    await prisma.note.upsert({
      where: { slug },
      create: {
        slug,
        date: asDate(front.date),
        tag: front.tag && asString(front.tag) ? asString(front.tag) : null,
        body,
        draft: asString(front.draft) === 'true',
      },
      update: {},
    });
  }
  console.log(`notes: ${files.length}`);
}

async function seedNovels() {
  const dir = path.join(CONTENT, 'novels');
  const files = await listMd(dir);
  for (const file of files) {
    const slug = file.replace(/\.md$/, '');
    const { front, body } = splitFront(await readFile(path.join(dir, file), 'utf8'));
    const novel = await prisma.novel.upsert({
      where: { slug },
      create: {
        slug,
        title: asString(front.title) || slug,
        subtitle: front.subtitle ? asString(front.subtitle) : null,
        summary: asString(front.summary),
        status: asString(front.status) || '连载中',
        tags: asArray(front.tags),
        updated: asDate(front.updated),
        body,
        draft: asString(front.draft) === 'true',
      },
      update: {},
    });

    const chapDir = path.join(CONTENT, 'chapters', slug);
    const chapFiles = await listMd(chapDir);
    for (const cf of chapFiles) {
      const cslug = cf.replace(/\.md$/, '');
      const parsed = splitFront(await readFile(path.join(chapDir, cf), 'utf8'));
      await prisma.chapter.upsert({
        where: { novelId_slug: { novelId: novel.id, slug: cslug } },
        create: {
          novelId: novel.id,
          slug: cslug,
          title: asString(parsed.front.title) || cslug,
          order: Number(parsed.front.order) || chapFiles.indexOf(cf) + 1,
          date: asDate(parsed.front.date),
          body: parsed.body,
          draft: asString(parsed.front.draft) === 'true',
        },
        update: {},
      });
    }
    console.log(`novel ${slug}: ${chapFiles.length} chapters`);
  }
}

async function seedPhotos() {
  const file = path.join(DATA, 'photos.data.json');
  if (!existsSync(file)) return;
  const raw = JSON.parse(await readFile(file, 'utf8')) as {
    albums: { id: string; title: string; tone: string; note: string; photos: { src: string; caption: string; date: string; span?: string }[] }[];
  };

  for (const [i, a] of raw.albums.entries()) {
    const album = await prisma.album.upsert({
      where: { slug: a.id },
      create: { slug: a.id, title: a.title, tone: a.tone, note: a.note, sort: i },
      update: { title: a.title, tone: a.tone, note: a.note, sort: i },
    });
    for (const p of a.photos) {
      const exists = await prisma.photo.findFirst({ where: { albumId: album.id, src: p.src } });
      if (exists) continue;
      await prisma.photo.create({
        data: {
          albumId: album.id,
          src: p.src,
          caption: p.caption,
          date: asDate(p.date),
          span: p.span ?? null,
          sort: a.photos.indexOf(p),
        },
      });
    }
    console.log(`album ${a.id}: ${a.photos.length} photos`);
  }
}

async function seedSite() {
  const file = path.join(DATA, 'site.data.json');
  if (!existsSync(file)) return;
  const raw = JSON.parse(await readFile(file, 'utf8')) as Record<string, unknown>;

  // 曲目与「在做」拆成独立表，文案类字段进 settings.site
  const tracks = (raw.tracks as { id: string; name: string; artist: string; dur: number; why: string }[]) ?? [];
  for (const [i, t] of tracks.entries()) {
    const exists = await prisma.track.findFirst({ where: { songId: t.id } });
    if (exists) continue;
    await prisma.track.create({ data: { songId: t.id, name: t.name, artist: t.artist, dur: t.dur, why: t.why, sort: i } });
  }

  const doing = (raw.doing as { state: string; title: string; sub: string; note: string; noteLong: string }[]) ?? [];
  for (const [i, d] of doing.entries()) {
    const exists = await prisma.doing.findFirst({ where: { title: d.title } });
    if (exists) continue;
    await prisma.doing.create({ data: { state: d.state, title: d.title, sub: d.sub, note: d.note, noteLong: d.noteLong, sort: i } });
  }

  const siteValue = {
    name: raw.name,
    en: raw.en,
    mark: raw.mark,
    intro: raw.intro,
    lead: raw.lead,
    desc: raw.desc,
    playlistId: raw.playlistId ?? '',
    musicApi: '/api/music',
    portfolioUrl: raw.portfolioUrl ?? '',
    backgroundImage: raw.backgroundImage ?? '',
    backgroundImageDim: raw.backgroundImageDim ?? 0,
    contact: raw.contact ?? {},
    bio: raw.bio ?? [],
    tracks: [],
    doing: [],
    facts: raw.facts ?? [],
  } as unknown as Prisma.InputJsonObject;

  await prisma.siteSetting.upsert({
    where: { key: 'site' },
    create: { key: 'site', value: siteValue },
    update: {}, // 已经改过的站点设置不覆盖
  });
  console.log(`tracks: ${tracks.length}, doing: ${doing.length}, site: ok`);
}

async function seedAbout() {
  // 「关于我」整页文案存在 SiteSetting 的 about 键；库里没有就写一份默认值，
  // 之后在后台 /admin/about 改，前台读的就是库里这份。
  const exists = await prisma.siteSetting.findUnique({ where: { key: 'about' } });
  if (exists) {
    console.log('about: 已存在，跳过');
    return;
  }
  const { DEFAULT_ABOUT } = await import('../src/lib/about');
  await prisma.siteSetting.create({
    data: { key: 'about', value: DEFAULT_ABOUT as unknown as Prisma.InputJsonObject },
  });
  console.log('about: 写入默认文案');
}

async function main() {
  console.log(`seed from ${ROOT}`);
  await seedPosts();
  await seedNotes();
  await seedNovels();
  await seedPhotos();
  await seedSite();
  await seedAbout();
  console.log('done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
