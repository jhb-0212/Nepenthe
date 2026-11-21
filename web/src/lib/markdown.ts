// Markdown 渲染：把旧 Astro 项目里的三条自定义规则原样搬过来
//   1. callout  —— Obsidian 的 > [!note] 提示框
//   2. mark     —— ==高亮== 转 <mark>
//   3. sanitize —— 白名单过滤，防存储型 XSS（后台编写的内容直接进前台）
// 顺序：remark → rehype(allowDangerousHtml) → rehype-raw（解析原始 HTML）
//       → mark → sanitize（此时 raw 已是 element，按白名单删）→ stringify

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';

type AnyNode = {
  type: string;
  value?: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  data?: { hName?: string; hProperties?: Record<string, unknown> };
  children?: AnyNode[];
  [key: string]: unknown;
};

/* ---------------- callout ---------------- */
function remarkCallout() {
  return (tree: AnyNode) => {
    visit(tree as never, 'blockquote', (node: AnyNode) => {
      const kids = node.children ?? [];
      const firstPara = kids.find((c) => c.type === 'paragraph');
      if (!firstPara) return;

      const paraText = (firstPara.children ?? [])
        .map((c) => (c.type === 'text' ? c.value ?? '' : ''))
        .join('');

      const m = /^\[!([a-zA-Z]+)\](?:[ \t]+([^\n]*))?/.exec(paraText.trimStart());
      if (!m) return;

      const type = m[1].toLowerCase();
      const inlineTitle = (m[2] || '').trim();
      const afterMarker = paraText.replace(/^\[![a-zA-Z]+\](?:[ \t]+[^\n]*)?/, '');
      const restText = afterMarker.replace(/^[ \t]*\r?\n/, '').trim();

      const newChildren: AnyNode[] = [];
      if (inlineTitle) {
        newChildren.push({
          type: 'paragraph',
          data: { hName: 'div', hProperties: { className: ['callout-title'] } },
          children: [{ type: 'text', value: inlineTitle }],
        });
      }
      if (restText) {
        newChildren.push({ type: 'paragraph', children: [{ type: 'text', value: restText }] });
      }
      for (const c of kids) if (c !== firstPara) newChildren.push(c);

      node.children = newChildren;
      node.data = {
        hName: 'blockquote',
        hProperties: { className: ['callout', `callout-${type}`], 'data-callout': type },
      };
    });
  };
}

/* ---------------- ==高亮== ---------------- */
function rehypeMark() {
  return (tree: AnyNode) => {
    visit(tree as never, 'text', (node: AnyNode, index: number | undefined, parent: AnyNode | undefined) => {
      if (!parent || typeof index !== 'number') return;
      const value = node.value ?? '';
      if (value.indexOf('==') === -1) return;
      const parts = value.split('==');
      if (parts.length < 3) return;

      const rebuilt: AnyNode[] = [];
      parts.forEach((text, i) => {
        if (i % 2 === 1) {
          rebuilt.push({
            type: 'element',
            tagName: 'mark',
            properties: {},
            children: text ? [{ type: 'text', value: text }] : [],
          });
        } else if (text) {
          rebuilt.push({ type: 'text', value: text });
        }
      });

      parent.children?.splice(index, 1, ...rebuilt);
      return index + rebuilt.length;
    });
  };
}

/* ---------------- 白名单 ---------------- */
const ALLOWED_TAGS = new Set([
  'a', 'abbr', 'b', 'blockquote', 'br', 'code', 'del', 'div', 'em', 'h1', 'h2',
  'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img', 'li', 'mark', 'ol', 'p', 'pre',
  'q', 's', 'span', 'strong', 'sub', 'sup', 'table', 'tbody', 'td', 'th',
  'thead', 'tr', 'u', 'ul',
]);

function sanitizeUrl(value: unknown) {
  const v = String(value).trim();
  const cleaned = v.replace(/[\u0000-\u0020]/g, '');
  const lower = cleaned.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return '';
  }
  return v;
}

function rehypeSanitize() {
  return (tree: AnyNode) => {
    visit(tree as never, 'element', (node: AnyNode, index: number | undefined, parent: AnyNode | undefined) => {
      const tag = String(node.tagName ?? '').toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) {
        if (parent && typeof index === 'number') {
          parent.children?.splice(index, 1);
          return index;
        }
        return;
      }

      const props = (node.properties ??= {});
      for (const key of Object.keys(props)) {
        const k = key.toLowerCase();
        if (k.startsWith('on')) {
          delete props[key];
          continue;
        }
        if (k === 'href' || k === 'src' || k === 'srcset') {
          const clean = sanitizeUrl(props[key]);
          if (!clean) delete props[key];
          else props[key] = clean;
        }
      }
    });
  };
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkCallout as never)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeMark as never)
  .use(rehypeSanitize as never)
  .use(rehypeStringify);

// 同一篇文章在列表页、详情页会被反复渲染，进程内做个小 LRU
const htmlCache = new Map<string, string>();
const CACHE_MAX = 200;

export async function renderMarkdown(body: string): Promise<string> {
  const key = body.slice(0, 16) + ':' + body.length;
  const hit = htmlCache.get(key);
  if (hit) return hit;

  const file = await processor.process(body ?? '');
  const html = String(file);
  if (htmlCache.size > CACHE_MAX) htmlCache.clear();
  htmlCache.set(key, html);
  return html;
}

/** 从 markdown 提炼一段纯文本，用于摘要 / 搜索片段 */
export function stripMarkdown(body: string, limit = 90): string {
  const plain = (body ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/^>\s?\[![a-zA-Z]+\][^\n]*\n?/gm, '')
    .replace(/^[>#\-\*\+\d.\s]+/gm, '')
    .replace(/==/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > limit ? `${plain.slice(0, limit)}…` : plain;
}
