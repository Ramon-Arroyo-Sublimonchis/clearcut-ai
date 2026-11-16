// Marco con la proporción de la foto: ocupa todo el alto o ancho del visor (.image-box) sin franjas
export default function PhotoFrame({ src, alt, label, ratio, previewBg, dimmed, onDoubleClick, children }) {
  return (
    <div
      className={`photo-frame${previewBg ? ` preview-bg-${previewBg}` : ''}`}
      style={{ '--ratio': ratio }}
      onDoubleClick={onDoubleClick}
    >
      {/* Capa del zoom de la vista previa (usePreviewZoom); etiqueta y botones quedan fuera y no crecen */}
      <div className="photo-zoom">
        {src && <img src={src} alt={alt} className={`compare-img${dimmed ? ' is-dimmed' : ''}`} draggable={false} />}
      </div>
      <span className="compare-tag compare-tag-left">{label}</span>
      {children}
    </div>
  );
}
