import { prisma } from './prisma';

/**
 * 全站页面文案：标题、引导语、空态提示、按钮字，集中存在 SiteSetting 的 copy 键。
 * 改字不用碰代码——后台「页面文案」页按组列出所有可改的字段。
 */
export type CopyField = {
  key: string;
  group: string;
  label: string;
  fallback: string;
  multiline?: boolean;
  hint?: string;
};

export type CopyValues = Record<string, string>;

export const COPY_FIELDS: CopyField[] = [
  // ---------- 首页 ----------
  { key: 'home.searchHint', group: '首页', label: '搜索条提示', fallback: '搜文章、随记、小说里的句子' },
  {
    key: 'home.quotes',
    group: '首页',
    label: '首屏金句（一行一句，用「｜」分开出处）',
    multiline: true,
    hint: '例：星光不问赶路人，时光不负有心人。｜佚名',
    fallback: [
      '星光不问赶路人，时光不负有心人。｜佚名',
      '既然选择了远方，便只顾风雨兼程。｜汪国真',
      '把一件事讲清楚，比算对一个数难。｜忘忧居',
      '山脚太挤了，我们山顶见。｜写给后来的人',
    ].join('\n'),
  },
  {
    key: 'home.phrases',
    group: '首页',
    label: '首屏打字机短语（一行一条）',
    multiline: true,
    fallback: ['闲来无事，坐看云起', '这里允许有过程', '日更是逼自己讲清楚'].join('\n'),
  },
  { key: 'home.latest', group: '首页', label: '「最新」小标题', fallback: '最新' },
  { key: 'home.archiveLink', group: '首页', label: '「最新」右侧链接', fallback: '翻归档' },
  { key: 'home.galleryNote', group: '首页', label: '相册卡说明（有照片时）', fallback: '最近放进去的几张' },
  { key: 'home.galleryEmpty', group: '首页', label: '相册卡说明（空相册）', fallback: '相册还空着，等第一张图' },
  { key: 'home.ctaTitle', group: '首页', label: '作品集卡片标题', fallback: '作品集' },
  {
    key: 'home.ctaText',
    group: '首页',
    label: '作品集卡片说明',
    multiline: true,
    fallback: '视频、AIGC 实验、文案合集，都在那边。这里留下过程，那里放成品。',
  },
  { key: 'home.ctaButton', group: '首页', label: '作品集按钮', fallback: '过去看看' },

  // ---------- 文章 ----------
  { key: 'writing.kicker', group: '文章页', label: '角标（英文）', fallback: 'WORDS' },
  { key: 'writing.title', group: '文章页', label: '页面标题', fallback: '文章' },
  {
    key: 'writing.lead',
    group: '文章页',
    label: '标题下的一句话',
    multiline: true,
    fallback: '写得出来的都放这儿。没被采纳的句子、删掉的镜头、半夜推翻的结构，也算。',
  },
  { key: 'writing.empty', group: '文章页', label: '没有文章时的提示', fallback: '还没有文章。后台发布第一篇之后，这里就有了。' },

  // ---------- 随记 ----------
  { key: 'notes.kicker', group: '随记页', label: '角标（英文）', fallback: 'NOTES' },
  { key: 'notes.title', group: '随记页', label: '页面标题', fallback: '随记' },
  {
    key: 'notes.lead',
    group: '随记页',
    label: '标题下的一句话',
    multiline: true,
    fallback: '没长到能写成文章的那些话。一天一句，或者三天一句，想起来就记。',
  },
  { key: 'notes.empty', group: '随记页', label: '没有随记时的提示', fallback: '还没有随记。' },

  // ---------- 小说 ----------
  { key: 'novels.kicker', group: '小说页', label: '角标（英文）', fallback: 'FICTION' },
  { key: 'novels.title', group: '小说页', label: '页面标题', fallback: '小说' },
  { key: 'novels.lead', group: '小说页', label: '标题下的一句话', multiline: true, fallback: '长的那种。连载中的、筹备中的，都在这儿。' },
  { key: 'novels.foot', group: '小说页', label: '页脚提示', multiline: true, fallback: '作品会一部一部加。每部里面按章节排，读起来像翻开一本。' },

  // ---------- 相册 ----------
  { key: 'gallery.tag', group: '相册页', label: '横幅角标', fallback: 'GALLERY' },
  { key: 'gallery.title', group: '相册页', label: '横幅大标题', fallback: '风月册' },
  {
    key: 'gallery.lead',
    group: '相册页',
    label: '横幅副句',
    multiline: true,
    fallback: '所有不经意的遇见，都是光馈赠的散文诗',
  },
  { key: 'gallery.sub', group: '相册页', label: '横幅小字', fallback: '山野入镜，清风翻页' },
  { key: 'gallery.empty', group: '相册页', label: '没有相册时的提示', fallback: '相册还没建。' },

  // ---------- 在做 ----------
  { key: 'doing.kicker', group: '在做页', label: '角标（英文）', fallback: 'NOW' },
  { key: 'doing.title', group: '在做页', label: '页面标题', fallback: '在做' },
  {
    key: 'doing.lead',
    group: '在做页',
    label: '标题下的一句话',
    multiline: true,
    fallback: '这一页只回答一件事：我把时间花在哪。不写计划，只写正在进行的。',
  },
  {
    key: 'doing.leadLong',
    group: '在做页',
    label: '第二段自述',
    multiline: true,
    fallback: '白天写代码和论文，晚上写文案、剪片子。不追求样样精通，但要求每一件拿出来的东西，自己愿意署名。',
  },

  // ---------- 留言墙 ----------
  { key: 'wall.kicker', group: '留言页', label: '角标（英文）', fallback: 'WALL' },
  { key: 'wall.title', group: '留言页', label: '页面标题', fallback: '留言墙' },
  {
    key: 'wall.lead',
    group: '留言页',
    label: '标题下的一句话',
    multiline: true,
    fallback: '不用登录，不用留联系方式。写一句就走 —— 审核过了，它才出现在下面。',
  },
  { key: 'wall.empty', group: '留言页', label: '墙上没有留言时的提示', fallback: '墙上还空着。第一句话留给你。' },

  // ---------- 归档 ----------
  { key: 'archive.kicker', group: '归档页', label: '角标（英文）', fallback: 'ARCHIVE' },
  { key: 'archive.title', group: '归档页', label: '页面标题', fallback: '归档' },
  {
    key: 'archive.lead',
    group: '归档页',
    label: '标题下的一句话',
    multiline: true,
    fallback: '一条河从最早流到今天，越往下越新。文章、随记、小说章节都浮在河上。',
  },

  // ---------- 音乐 ----------
  { key: 'music.kicker', group: '音乐页', label: '角标（英文）', fallback: 'SOUND' },
  { key: 'music.title', group: '音乐页', label: '页面标题', fallback: '音乐' },
  {
    key: 'music.lead',
    group: '音乐页',
    label: '标题下的一句话',
    multiline: true,
    fallback: '最近在循环的东西。声音走服务端代理，网易云和 QQ 音乐混着放，歌词跟着唱。',
  },

  // ---------- 搜索 ----------
  { key: 'search.kicker', group: '搜索页', label: '角标（英文）', fallback: 'SEARCH' },
  { key: 'search.title', group: '搜索页', label: '页面标题', fallback: '搜索' },
  { key: 'search.lead', group: '搜索页', label: '标题下的一句话', multiline: true, fallback: '搜文章、随记、小说的正文。输入两个字就能出结果。' },
  {
    key: 'search.note',
    group: '搜索页',
    label: '底部说明',
    multiline: true,
    fallback: '索引在服务端（Meilisearch）实时维护，发布内容后立即可搜；没配 Meilisearch 时退回 PostgreSQL 检索。',
  },

  // ---------- 404 ----------
  { key: 'nf.text', group: '404 页', label: '说明文字', fallback: '这条河道还没流过这里。' },
  { key: 'nf.button', group: '404 页', label: '按钮文字', fallback: '回首页' },
];

export const DEFAULT_COPY: CopyValues = Object.fromEntries(
  COPY_FIELDS.map((f) => [f.key, f.fallback]),
) as CopyValues;

export const COPY_GROUPS = [...new Set(COPY_FIELDS.map((f) => f.group))];

export async function getCopy(): Promise<CopyValues> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: 'copy' } });
    const raw = (row?.value ?? {}) as Record<string, unknown>;
    const out: CopyValues = { ...DEFAULT_COPY };
    for (const f of COPY_FIELDS) {
      const v = raw[f.key];
      if (typeof v === 'string' && v.trim()) out[f.key] = v;
    }
    return out;
  } catch {
    return DEFAULT_COPY;
  }
}

/** 金句："句子｜出处" → [{text, from}] */
export function parseQuotes(raw: string): { text: string; from: string }[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/[｜|]/);
      return { text: parts[0].trim(), from: (parts[1] ?? '').trim() };
    })
    .filter((q) => q.text);
}

export const parseLines = (raw: string): string[] =>
  raw
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
