import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="page">
      <div className="wrap" style={{ padding: '120px 0 80px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 'clamp(40px, 8vw, 76px)', margin: 0, letterSpacing: '0.08em' }}>404</h1>
        <p style={{ marginTop: 18, opacity: 0.75 }}>这条河道还没流过这里。</p>
        <p style={{ marginTop: 26 }}>
          <Link className="btn btn-primary" href="/">
            回首页
          </Link>
        </p>
      </div>
    </div>
  );
}
