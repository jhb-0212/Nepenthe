'use client';

import { useEffect } from 'react';

// 从旧 Base.astro 迁过来的纯 DOM 行为：toast、快捷键、滚动入场、目录、微粒、光晕
// 访客埋点也在这里，走 sendBeacon，不挡首屏。
export default function SiteEffects() {
  useEffect(() => {
    const toastEl = document.getElementById('toast');
    let timer = 0;
    const toast = (msg: string) => {
      if (!toastEl) return;
      toastEl.textContent = msg;
      toastEl.classList.add('show');
      window.clearTimeout(timer);
      timer = window.setTimeout(() => toastEl.classList.remove('show'), 4600);
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      if (!target) return;

      const ext = target.closest('[data-ext="portfolio"]');
      if (ext) {
        const href = ext.getAttribute('href') || '#';
        if (!/^https?:/.test(href)) {
          e.preventDefault();
          toast('作品集链接还没填：后台「站点」页填 portfolioUrl。');
          return;
        }
      }

      const copyBtn = target.closest('[data-copy]');
      if (copyBtn) {
        e.preventDefault();
        const v = copyBtn.getAttribute('data-copy') || '';
        if (v && navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(v).then(
            () => toast('已复制：' + v),
            () => toast('复制不了，手动选一下：' + v),
          );
        } else toast('手动选一下：' + v);
        return;
      }

      const todo = target.closest('[data-todo]');
      if (todo) {
        e.preventDefault();
        toast(todo.getAttribute('data-todo') || '');
        return;
      }

      const jump = target.closest('[data-scroll]');
      if (jump) {
        e.preventDefault();
        const id = jump.getAttribute('data-scroll');
        const box = id ? document.getElementById(id) : null;
        box?.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
          block: 'start',
        });
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/') return;
      const t = e.target;
      if (t instanceof Element && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || (t as HTMLElement).isContentEditable)) return;
      const entry = document.querySelector('[data-search-entry]');
      if (!entry) return;
      e.preventDefault();
      const href = entry.getAttribute('href');
      if (href) location.href = href;
    };

    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);

    // 滚动入场
    const items = Array.from(document.querySelectorAll('.rise'));
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let io: IntersectionObserver | null = null;
    if (items.length) {
      if (!('IntersectionObserver' in window) || reduced) {
        items.forEach((el) => el.classList.add('in'));
      } else {
        io = new IntersectionObserver(
          (entries) => {
            entries.forEach((en) => {
              if (en.isIntersecting) {
                en.target.classList.add('in');
                io?.unobserve(en.target);
              }
            });
          },
          { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
        );
        items.forEach((el) => io!.observe(el));
      }
    }

    // 文章目录：h2/h3 两个以上才生成
    const body = document.querySelector('.art-body');
    if (body) {
      const heads = Array.from(body.querySelectorAll('h2, h3')) as HTMLElement[];
      if (heads.length >= 2) {
        heads.forEach((h, i) => {
          if (!h.id) h.id = `sec-${i}`;
        });
        const toc = document.createElement('aside');
        toc.className = 'toc';
        toc.innerHTML = '<div class="toc-title">目录</div>';
        const list = document.createElement('ul');
        heads.forEach((h) => {
          const li = document.createElement('li');
          li.className = `toc-item ${h.tagName.toLowerCase()}`;
          const a = document.createElement('a');
          a.href = `#${h.id}`;
          a.textContent = h.textContent;
          a.addEventListener('click', (ev) => {
            ev.preventDefault();
            document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            history.replaceState(null, '', `#${h.id}`);
          });
          li.appendChild(a);
          list.appendChild(li);
        });
        toc.appendChild(list);

        const article = body.closest('article');
        if (article) {
          article.classList.add('has-toc');
          article.querySelector('.wrap')?.insertBefore(toc, body);
        }
      }
    }

    // 背景微粒 + 鼠标光晕：降级为「减少动效」时直接不画
    let raf = 0;
    let canvas: HTMLCanvasElement | null = null;
    let glow: HTMLDivElement | null = null;
    let moveHandler: ((e: MouseEvent) => void) | null = null;

    if (!reduced) {
      canvas = document.createElement('canvas');
      canvas.id = 'bg-particles';
      canvas.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;opacity:0.4;';
      document.body.appendChild(canvas);
      const ctx = canvas.getContext('2d');
      let w = 0;
      let h = 0;
      const dots = Array.from({ length: 60 }, () => ({
        x: Math.random() * (w = window.innerWidth),
        y: Math.random() * (h = window.innerHeight),
        r: 1 + Math.random() * 2,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        alpha: 0.2 + Math.random() * 0.4,
      }));
      const resize = () => {
        if (!canvas) return;
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
      };
      resize();
      window.addEventListener('resize', resize);
      const tick = () => {
        if (!ctx) return;
        ctx.clearRect(0, 0, w, h);
        dots.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) p.x = w;
          if (p.x > w) p.x = 0;
          if (p.y < 0) p.y = h;
          if (p.y > h) p.y = 0;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(90, 138, 122, ${p.alpha})`;
          ctx.fill();
        });
        raf = requestAnimationFrame(tick);
      };
      tick();

      glow = document.createElement('div');
      glow.id = 'cursor-glow';
      glow.style.cssText = `position:fixed;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle, rgba(90,138,122,.08) 0%, transparent 70%);pointer-events:none;z-index:1;transform:translate(-50%,-50%);transition:opacity .3s;opacity:0;`;
      document.body.appendChild(glow);

      let mx = 0;
      let my = 0;
      let gx = 0;
      let gy = 0;
      moveHandler = (e: MouseEvent) => {
        mx = e.clientX;
        my = e.clientY;
        if (glow) glow.style.opacity = '1';
      };
      document.addEventListener('mousemove', moveHandler);
      const loop = () => {
        gx += (mx - gx) * 0.08;
        gy += (my - gy) * 0.08;
        if (glow) {
          glow.style.left = `${gx}px`;
          glow.style.top = `${gy}px`;
        }
        requestAnimationFrame(loop);
      };
      loop();
    }

    // 访客埋点：同一天同一路径只打一次，sendBeacon 不挡首屏
    const VISIT_KEY = 'nepenthe:visit';
    try {
      const today = new Date().toISOString().slice(0, 10);
      const last = localStorage.getItem(VISIT_KEY);
      if (last !== `${today}:${location.pathname}`) {
        localStorage.setItem(VISIT_KEY, `${today}:${location.pathname}`);
        const payload = JSON.stringify({ path: location.pathname, ref: document.referrer });
        const blob = new Blob([payload], { type: 'text/plain;charset=UTF-8' });
        if (navigator.sendBeacon) navigator.sendBeacon('/api/hit', blob);
        else fetch('/api/hit', { method: 'POST', body: payload, keepalive: true });
      }
    } catch {
      /* ignore */
    }

    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
      io?.disconnect();
      cancelAnimationFrame(raf);
      if (moveHandler) document.removeEventListener('mousemove', moveHandler);
      canvas?.remove();
      glow?.remove();
    };
  }, []);

  return null;
}
