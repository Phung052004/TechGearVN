import Input from "../common/Input";

export default function FilterBar({ value, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "center",
        padding: "12px 0",
      }}
    >
      <div style={{ width: 320 }}>
        <Input
          placeholder="Search products..."
          value={value ?? ""}
          onChange={(e) => onChange?.(e.target.value)}
        />
      </div>
    </div>
  );
}
