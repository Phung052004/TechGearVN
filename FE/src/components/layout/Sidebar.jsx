export default function Sidebar() {
  return (
    <aside style={{ padding: 16, borderRight: "1px solid #eee" }}>
      <div style={{ fontWeight: 600, marginBottom: 12 }}>Admin</div>
      <nav style={{ display: "grid", gap: 8 }}>
        <a href="#/admin">Dashboard</a>
        <a href="#/admin/products">Products</a>
        <a href="#/admin/orders">Orders</a>
      </nav>
    </aside>
  );
}
