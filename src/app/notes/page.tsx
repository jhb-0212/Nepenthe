import type { Metadata } from 'next';
import { listNotes } from '@/lib/content';
import { renderMarkdown } from '@/lib/markdown';
import { getPages } from '@/lib/pages';

export async function generateMetadata(): Promise<Metadata> {
  const pages = await getPages();
  return { title: pages.notes.title, description: pages.notes.lead };
}

export default async function NotesPage() {
  const [notes, pages] = await Promise.all([listNotes(), getPages()]);
  const rows = await Promise.all(
    notes.map(async (n) => ({ note: n, html: await renderMarkdown(n.body) })),
  );

  return (
    <div className="page moments-page">
      <div className="wrap">
        <div className="page-head moments-head">
          {/* 页头的一小片云气：几道极淡的墨线，只给页面一个落点，不抢字 */}
          <svg className="head-sky" viewBox="0 0 640 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
            <path d="M0 46C70 26 120 60 196 44C272 28 318 58 392 42C466 26 520 56 586 44C612 39 626 42 644 38" strokeOpacity="0.22" />
            <path d="M0 84C84 62 132 96 214 80C292 64 340 94 418 78C492 62 546 92 610 82C626 78 636 80 648 76" strokeOpacity="0.17" />
            <path d="M96 122C176 106 226 132 306 118C386 104 436 128 512 116" strokeOpacity="0.13" />
            <path d="M150 158C214 148 258 166 326 156C394 146 440 164 506 156C534 152 552 158 574 154" strokeOpacity="0.09" />
          </svg>
          <h1>
            <span className="kicker">{pages.notes.kicker}</span>{pages.notes.title}
          </h1>
          <p>{pages.notes.lead}</p>
        </div>
      </div>

      <div className="wrap moments-wrap">
        <div className={notes.length ? 'scroll-panel moments-scroll' : undefined}>
          <div className="moments-list">
            {rows.map(({ note, html }, i) => {
              const year = note.date.getUTCFullYear();
              const prevYear = i > 0 ? rows[i - 1].note.date.getUTCFullYear() : null;
              // 年份只在换年时出现一次，同一年里不必每条都写一遍
              const showYear = year !== prevYear;
              const mm = String(note.date.getUTCMonth() + 1).padStart(2, '0');
              const dd = String(note.date.getUTCDate()).padStart(2, '0');
              return (
                <div className="moment" key={note.id} id={`note-${note.id}`}>
                  <div className="moment-rail">
                    <time className="moment-date" dateTime={note.date.toISOString()} aria-label={`${year}年${mm}月${dd}日`}>
                      <span className={`md-year${showYear ? '' : ' md-year--blank'}`} aria-hidden={!showYear}>
                        {showYear ? year : '\u00A0'}
                      </span>
                      <span className="md-day">
                        {mm}.{dd}
                      </span>
                    </time>
                  </div>
                  <div className="moment-body">
                    <div className="moment-head">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <span className="moment-avatar">
                        <img src="/avatar.png" alt="" />
                      </span>
                      <span className="moment-name">忘忧居主</span>
                    </div>
                    <div className="moment-text" dangerouslySetInnerHTML={{ __html: html }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {notes.length === 0 && pages.notes.note ? <p className="plain-note">{pages.notes.note}</p> : null}
      </div>
    </div>
  );
}
