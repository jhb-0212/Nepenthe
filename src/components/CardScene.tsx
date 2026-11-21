export default function CardScene({ src, alt = '' }: { src: string; alt?: string }) {
  return (
    <div className="card-scene" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="card-scene__img" src={src} alt={alt} loading="lazy" decoding="async" />
      <span className="card-scene__veil" />
    </div>
  );
}
