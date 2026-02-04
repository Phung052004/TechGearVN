import ProductCard from "./ProductCard";

export default function ProductList({ products = [] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 12,
      }}
    >
      {products.map((p) => (
        <ProductCard key={p?.id ?? p?._id ?? JSON.stringify(p)} product={p} />
      ))}
    </div>
  );
}
