export default function Button({ children, type = "button", ...props }) {
  return (
    <button
      type={type}
      style={{
        padding: "8px 12px",
        borderRadius: 8,
        border: "1px solid #ddd",
        background: "#fff",
        cursor: "pointer",
      }}
      {...props}
    >
      {children}
    </button>
  );
}
