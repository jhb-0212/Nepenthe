import { restoreVersion } from '@/actions/post';

type Version = {
  id: number;
  title: string;
  body: string;
  createdAt: Date;
};

const fmt = (d: Date) =>
  new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);

export default function VersionPanel({ postId, versions }: { postId: number; versions: Version[] }) {
  if (!versions.length) {
    return (
      <section className="version-box">
        <h2>
          历史版本 <small>还没有</small>
        </h2>
        <p className="version-hint">每次点「保存」都会自动留一份快照，改错、删多了都能从这里退回。</p>
      </section>
    );
  }

  return (
    <section className="version-box">
      <h2>
        历史版本 <small>共 {versions.length} 份</small>
      </h2>
      <p className="version-hint">
        回滚前会先把当前内容再存一份快照，所以「回滚」本身也可以再回滚。
      </p>
      <ol className="version-list">
        {versions.map((v) => (
          <li key={v.id}>
            <details>
              <summary>
                <span className="version-time">{fmt(v.createdAt)}</span>
                <span className="version-title">{v.title || '（无标题）'}</span>
                <span className="version-size">{v.body.length} 字</span>
              </summary>
              <pre className="version-body">{v.body.slice(0, 600) || '（空）'}</pre>
              <form action={restoreVersion}>
                <input type="hidden" name="versionId" value={v.id} />
                <input type="hidden" name="postId" value={postId} />
                <button className="admin-btn" type="submit">
                  回到这一版
                </button>
              </form>
            </details>
          </li>
        ))}
      </ol>
    </section>
  );
}
