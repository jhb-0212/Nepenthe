export default function Loading() {
  return (
    <section className="state-page" aria-busy="true" aria-live="polite">
      <span className="sk sk-title" />
      <span className="sk sk-line" />
      <span className="sk sk-line" style={{ width: '72%' }} />
      <span className="sk sk-line" style={{ width: '46%' }} />
      <small className="state-digest">正在取数据…</small>
    </section>
  );
}
