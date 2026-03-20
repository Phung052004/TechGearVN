# State Machine Diagrams — TechGearVN (theo model enums hiện tại)

Các state machine dưới đây bám theo enum trong models:

- Order: `Order.orderStatus`, `Order.paymentStatus`
- Review: `Review.status`
- WarrantyClaim: `WarrantyClaim.status`
- ChatRoom: `ChatRoom.status`
- Product: `Product.status`
- Voucher: `Voucher.status`

---

## 1) Order — OrderStatus

Nguồn: `BE/server/models/Order.js`

States:

- `PENDING` → `PROCESSING` → `SHIPPING` → `COMPLETED`
- Nhánh kết thúc khác: `CANCELLED`, `RETURNED`

```mermaid
stateDiagram-v2
  [*] --> PENDING: createOrder

  PENDING --> PROCESSING: staff/admin updateStatus
  PROCESSING --> SHIPPING: staff/admin/delivery updateStatus
  SHIPPING --> COMPLETED: staff/admin/delivery updateStatus

  PENDING --> CANCELLED: staff/admin updateStatus
  PROCESSING --> CANCELLED: staff/admin updateStatus

  COMPLETED --> RETURNED: staff/admin updateStatus

  CANCELLED --> [*]
  RETURNED --> [*]
  COMPLETED --> [*]
```

> Ghi chú: API cập nhật status hiện là `PUT /api/v1/orders/:id/status` cho role `ADMIN/STAFF/DELIVERY`.

---

## 2) Order — PaymentStatus

Nguồn: `BE/server/models/Order.js`

States:

- `UNPAID` → `PAID`

```mermaid
stateDiagram-v2
  [*] --> UNPAID: createOrder
  UNPAID --> PAID: payment webhook/return
  PAID --> [*]
```

> Ghi chú: `paymentMethod` có thể là `COD|VNPAY|MOMO|PAYOS`; dự án hiện dùng callbacks/return/webhook để mark paid.

---

## 3) Review — ReviewStatus

Nguồn: `BE/server/models/Review.js`

States:

- `PENDING` → (`APPROVED` | `HIDDEN`)

```mermaid
stateDiagram-v2
  [*] --> PENDING: customer createReview
  PENDING --> APPROVED: staff/admin moderate
  PENDING --> HIDDEN: staff/admin moderate

  APPROVED --> HIDDEN: staff/admin moderate
  HIDDEN --> APPROVED: staff/admin moderate

  APPROVED --> [*]
  HIDDEN --> [*]
```

---

## 4) WarrantyClaim — WarrantyStatus

Nguồn: `BE/server/models/WarrantyClaim.js`

States:

- `PENDING` → `RECEIVED_PRODUCT` → `PROCESSING` → `COMPLETED`
- Nhánh từ chối: `REJECTED`

```mermaid
stateDiagram-v2
  [*] --> PENDING: customer createClaim

  PENDING --> RECEIVED_PRODUCT: staff/admin updateClaim
  RECEIVED_PRODUCT --> PROCESSING: staff/admin updateClaim
  PROCESSING --> COMPLETED: staff/admin updateClaim

  PENDING --> REJECTED: staff/admin updateClaim
  RECEIVED_PRODUCT --> REJECTED: staff/admin updateClaim
  PROCESSING --> REJECTED: staff/admin updateClaim

  COMPLETED --> [*]
  REJECTED --> [*]
```

---

## 5) ChatRoom — ChatRoomStatus

Nguồn: `BE/server/models/ChatRoom.js`

States:

- `OPEN` ↔ `CLOSED`

```mermaid
stateDiagram-v2
  [*] --> OPEN: getOrCreateMyRoom
  OPEN --> CLOSED: staff/admin closeRoom
  CLOSED --> OPEN: staff/admin reopenRoom
  CLOSED --> [*]
```

> Ghi chú: Trong routes có `PUT /chat/rooms/:roomId/status` cho `ADMIN/STAFF`.

---

## 6) Product — ProductStatus

Nguồn: `BE/server/models/Product.js`

States:

- `ACTIVE` ↔ `INACTIVE`

```mermaid
stateDiagram-v2
  [*] --> ACTIVE: createProduct (default)
  ACTIVE --> INACTIVE: staff/admin updateProduct
  INACTIVE --> ACTIVE: staff/admin updateProduct
```

---

## 7) Voucher — VoucherStatus

Nguồn: `BE/server/models/Voucher.js`

States:

- `ACTIVE` ↔ `INACTIVE`

```mermaid
stateDiagram-v2
  [*] --> ACTIVE: createVoucher (default)
  ACTIVE --> INACTIVE: staff/admin updateVoucher
  INACTIVE --> ACTIVE: staff/admin updateVoucher
```
