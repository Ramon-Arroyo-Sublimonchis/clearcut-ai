// Marco con la proporción de la foto: ocupa todo el alto o ancho del visor (.image-box) sin franjas
export default function PhotoFrame({ src, alt, label, ratio, previewBg, dimmed, onDoubleClick, children }) {
  return (
    <div
      className={`photo-frame${previewBg ? ` preview-bg-${previewBg}` : ''}`}
      style={{ '--ratio': ratio }}
      onDoubleClick={onDoubleClick}
    >
      {src && <img src={src} alt={alt} className={`compare-img${dimmed ? ' is-dimmed' : ''}`} draggable={false} />}
      <span className="compare-tag compare-tag-left">{label}</span>
      {children}
    </div>
  );
}
