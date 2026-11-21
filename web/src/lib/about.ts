import { prisma } from './prisma';

/** 「关于我」页的全部文案与配图，存 SiteSetting 的 about 键，后台可视化编辑 */
export type AboutTruth = { title: string; note: string };
export type AboutNow = { name: string; state: string; note: string };
export type AboutSkill = { group: string; type: string; note: string; items: string[] };
export type AboutPlay = { name: string; desc: string; quote: string; img: string; big: boolean };
export type AboutStop = { time: string; title: string; desc: string; note: string };
export type AboutListen = { cat: string; items: string[] };
export type AboutChip = { label: string; text: string };

export type AboutConfig = {
  headline: string;
  chips: AboutChip[];
  truths: AboutTruth[];
  now: AboutNow[];
  skills: AboutSkill[];
  plays: AboutPlay[];
  playNote: string;
  timeline: AboutStop[];
  listens: AboutListen[];
  listenNote: string;
  outro: string[];
};

export const DEFAULT_ABOUT: AboutConfig = {
  headline: '三件事并行，一件都还没做完。',
  chips: [
    { label: '底子', text: '数学 · 信息与计算科学' },
    { label: '手上', text: 'AIGC 漫剧 · 剧本与画面' },
    { label: '习惯', text: '把过程也写下来' },
  ],
  truths: [
    { title: '我很少把一件事做完，但也很少把一件事丢掉。', note: '五件并行是真的，收尾慢也是真的。' },
    { title: '学数学出身，后来发现把一件事讲清楚，比算对一个数难。', note: '所以现在更愿意写字——写完还能回头看。' },
    { title: '计划表写得比成品好看。', note: '资产表、分镜表是我最满意的作品之一。这话不全是玩笑。' },
  ],
  now: [
    { name: 'AIGC 漫剧', state: '推进中', note: '剧本、资产表、分镜表，一张一张往下排。白天干这个。' },
    { name: '这个站点', state: '想起就写', note: '文章不固定，随记倒是常有。你现在看到的这一页，也是刚改的。' },
    { name: '毕业论文', state: '未收尾', note: 'PCA-VaR 度量股票组合的风险。模型跑完了，字还没写完。' },
  ],
  skills: [
    { group: '后端', type: 'backend', note: '把想法变成能跑起来的东西。', items: ['Python', 'FastAPI', 'Node.js', 'Prisma'] },
    { group: '前端', type: 'frontend', note: '让它看起来愿意被点开。', items: ['Next.js', 'React', 'Astro', 'ECharts'] },
    { group: '数据', type: 'database', note: '给每件事留一份查得到的账。', items: ['PostgreSQL', 'Meilisearch', 'SQLAlchemy'] },
    { group: '工具', type: 'tool', note: '把重复动作交给机器，自己去做判断。', items: ['Docker', 'GitHub Actions', 'Playwright', 'Ollama'] },
  ],
  plays: [
    { name: '王者荣耀', desc: '荣耀王者 · 2000h+', quote: '韧性，是比天赋更珍贵的东西。', img: '/games/wangzhe.webp', big: true },
    { name: '三角洲行动', desc: '巅峰 · 900h+', quote: '在绝境里，冷静是唯一的武器。', img: '/games/delta.webp', big: true },
    { name: '黑神话：悟空', desc: '通关两遍', quote: '踏碎凌霄，放肆桀骜。', img: '/games/wukong.webp', big: false },
    { name: '凡人修仙传', desc: '追更中', quote: '凡人落凡尘，修仙修心。', img: '/games/fanren.webp', big: false },
    { name: '剑来', desc: '老书虫', quote: '遇事不绝，可问春风。', img: '/games/jianlai.webp', big: false },
  ],
  playNote: '配图是自己拿 AI 生成的一批水墨插图，跟游戏官方美术没有关系。',
  timeline: [
    { time: '2023.09', title: '入学韶关学院', desc: '信息与计算科学专业', note: '报志愿时以为以后天天算数。' },
    { time: '2024.03', title: '运营校园墙', desc: '校级校园墙运营负责人', note: '第一次发现，把人逗笑比把题做对有用。' },
    { time: '2025.06', title: '开始做 AIGC', desc: 'AI 影视、漫剧方向', note: '从这以后，写东西的目的变了：得能拍出来。' },
    { time: '2026.03', title: '毕业论文', desc: 'PCA-VaR 股票投资组合风险度量', note: '四年数学，最后落在一张风险度量表上。' },
  ],
  listens: [
    { cat: '常听', items: ['陈奕迅', '朴树', '李宗盛', '万能青年旅店'] },
    { cat: '爱看', items: ['是枝裕和', '诺兰', '新海诚'] },
  ],
  listenNote:
    '写不出东西的时候，翻出《陀飞轮》听一遍；卡在某一句上，就换成《平凡之路》。电影偏爱慢慢讲完一件事的那种，看完不急着给答案。',
  outro: ['聊 AIGC、聊剧本、聊你正卡住的那件事，都行；', '也可以只是想说句什么，我不一定会很快回。'],
};

/* ---------- 宽松解析：库里少字段/字段类型不对，都退到默认值，不让前台崩 ---------- */

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const strs = (v: unknown): string[] =>
  arr(v)
    .map((x) => str(x).trim())
    .filter(Boolean);

function pickList<T>(raw: unknown, shape: (o: Record<string, unknown>, d: T) => T, defaults: T[]): T[] {
  const list = arr(raw);
  if (!list.length) return defaults;
  return list.map((item, i) => {
    const o = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
    return shape(o, defaults[Math.min(i, defaults.length - 1)]);
  });
}

export function normalizeAbout(input: unknown): AboutConfig {
  const o = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const d = DEFAULT_ABOUT;

  return {
    headline: str(o.headline, d.headline),
    chips: pickList(o.chips, (r, dd) => ({ label: str(r.label, dd.label), text: str(r.text, dd.text) }), d.chips),
    truths: pickList(o.truths, (r, dd) => ({ title: str(r.title, dd.title), note: str(r.note, dd.note) }), d.truths),
    now: pickList(
      o.now,
      (r, dd) => ({ name: str(r.name, dd.name), state: str(r.state, dd.state), note: str(r.note, dd.note) }),
      d.now,
    ),
    skills: pickList(
      o.skills,
      (r, dd) => ({
        group: str(r.group, dd.group),
        type: str(r.type, dd.type),
        note: str(r.note, dd.note),
        items: strs(r.items).length ? strs(r.items) : dd.items,
      }),
      d.skills,
    ),
    plays: pickList(
      o.plays,
      (r, dd) => ({
        name: str(r.name, dd.name),
        desc: str(r.desc, dd.desc),
        quote: str(r.quote, dd.quote),
        img: str(r.img, dd.img),
        big: typeof r.big === 'boolean' ? r.big : dd.big,
      }),
      d.plays,
    ),
    playNote: str(o.playNote, d.playNote),
    timeline: pickList(
      o.timeline,
      (r, dd) => ({
        time: str(r.time, dd.time),
        title: str(r.title, dd.title),
        desc: str(r.desc, dd.desc),
        note: str(r.note, dd.note),
      }),
      d.timeline,
    ),
    listens: pickList(
      o.listens,
      (r, dd) => ({ cat: str(r.cat, dd.cat), items: strs(r.items).length ? strs(r.items) : dd.items }),
      d.listens,
    ),
    listenNote: str(o.listenNote, d.listenNote),
    outro: strs(o.outro).length ? strs(o.outro) : d.outro,
  };
}

export async function getAbout(): Promise<AboutConfig> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: 'about' } });
    if (!row) return DEFAULT_ABOUT;
    return normalizeAbout(row.value);
  } catch {
    return DEFAULT_ABOUT;
  }
}
