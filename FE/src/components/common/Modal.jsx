export default function Modal({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: 16,
          minWidth: 320,
          maxWidth: 720,
          width: "100%",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {title ? (
          <div style={{ fontWeight: 600, marginBottom: 12 }}>{title}</div>
        ) : null}
        {children}
      </div>
    </div>
  );
}
