export default function Input(props) {
  return (
    <input
      style={{
        padding: "8px 12px",
        borderRadius: 8,
        border: "1px solid #ddd",
        width: "100%",
      }}
      {...props}
    />
  );
}
