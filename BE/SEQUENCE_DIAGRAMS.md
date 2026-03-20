# Sequence Diagrams — TechGearVN (theo API/Routes hiện tại)

Các sequence diagram dưới đây bám theo routes trong `BE/server/routes/*`.

> Quy ước:
>
> - FE: Frontend (React)
> - BE: Backend API (Express)
> - DB: MongoDB (Mongoose)
> - Auth: `Authorization: Bearer <jwt>` cho các API có `protect`

---

## 1) Register (OTP) — `/api/v1/auth/register` + confirm

```mermaid
sequenceDiagram
  autonumber
  actor Guest
  participant FE as FE (Web)
  participant BE as BE (API)
  participant DB as MongoDB
  participant SMTP as Email SMTP

  Guest->>FE: Nhập fullName/email/password...
  FE->>BE: POST /api/v1/auth/register
  BE->>DB: Check User by email
  alt Email đã tồn tại
    DB-->>BE: found
    BE-->>FE: 400 Email đã được sử dụng
  else Email chưa tồn tại
    DB-->>BE: not found
    BE->>DB: Upsert PendingRegistration (codeHash, expire)
    BE->>SMTP: Send OTP email
    BE-->>FE: 200 Đã gửi mã xác nhận
  end

  Guest->>FE: Nhập OTP
  FE->>BE: POST /api/v1/auth/register/confirm
  BE->>DB: Find PendingRegistration by email
  alt OTP sai/hết hạn
    DB-->>BE: invalid/expired
    BE-->>FE: 400 Mã không đúng/hết hạn
  else OTP hợp lệ
    DB-->>BE: ok
    BE->>DB: Create User (role=CUSTOMER,isVerified=true)
    BE->>DB: Delete PendingRegistration
    BE-->>FE: 201 User + JWT token
  end
```

---

## 2) Login — `/api/v1/auth/login`

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant FE as FE (Web)
  participant BE as BE (API)
  participant DB as MongoDB

  User->>FE: Nhập email/password
  FE->>BE: POST /api/v1/auth/login
  BE->>DB: Find User by email
  alt Không tồn tại / sai mật khẩu
    DB-->>BE: not found / mismatch
    BE-->>FE: 401 Unauthorized
  else Chưa verify email
    DB-->>BE: found(isVerified=false)
    BE-->>FE: 403 Chưa xác thực email
  else OK
    DB-->>BE: found
    BE-->>FE: 200 User + JWT token
    FE->>FE: Lưu token (localStorage/cookie)
  end
```

---

## 3) Browse + View Product Detail — `/api/v1/products`

```mermaid
sequenceDiagram
  autonumber
  actor Guest
  participant FE as FE (Web)
  participant BE as BE (API)
  participant DB as MongoDB

  Guest->>FE: Mở trang danh sách sản phẩm
  FE->>BE: GET /api/v1/products?query...
  BE->>DB: Product.find(filters)
  DB-->>BE: list
  BE-->>FE: 200 products

  Guest->>FE: Click xem chi tiết
  FE->>BE: GET /api/v1/products/:id
  BE->>DB: Product.findById
  DB-->>BE: product
  BE-->>FE: 200 product

  opt Load specs
    FE->>BE: GET /api/v1/products/:id/specs
    BE->>DB: ProductSpec.find({product:id})
    DB-->>BE: specs
    BE-->>FE: 200 specs
  end
```

---

## 4) Manage Cart (Add/Update/Remove) — `/api/v1/cart/me/*`

```mermaid
sequenceDiagram
  autonumber
  actor Customer
  participant FE as FE (Web)
  participant BE as BE (API)
  participant DB as MongoDB

  Customer->>FE: Add to cart
  FE->>BE: POST /api/v1/cart/me/items (Auth)
  BE->>DB: Find Cart by user (unique)
  alt Chưa có cart
    DB-->>BE: not found
    BE->>DB: Create Cart(user, items[])
  else Đã có cart
    DB-->>BE: found
    BE->>DB: Upsert item (product, quantity)
  end
  BE-->>FE: 200 cart

  Customer->>FE: Update/remove item
  FE->>BE: DELETE /api/v1/cart/me/items/:productId (Auth)
  BE->>DB: Pull item from cart.items
  DB-->>BE: updated
  BE-->>FE: 200 cart

  Customer->>FE: View cart
  FE->>BE: GET /api/v1/cart/me (Auth)
  BE->>DB: Find Cart by user
  DB-->>BE: cart
  BE-->>FE: 200 cart
```

---

## 5) Checkout (COD) — Create Order — `POST /api/v1/orders`

```mermaid
sequenceDiagram
  autonumber
  actor Customer
  participant FE as FE (Web)
  participant BE as BE (API)
  participant DB as MongoDB

  Customer->>FE: Nhập địa chỉ, chọn COD
  opt Validate voucher
    FE->>BE: GET /api/v1/vouchers/validate?code=...&orderValue=...
    BE->>DB: Voucher.findOne({code,status})
    DB-->>BE: voucher
    BE-->>FE: 200 valid + discount
  end

  FE->>BE: POST /api/v1/orders (Auth)
  BE->>DB: Create Order(user, items[], amounts, paymentMethod=COD)
  DB-->>BE: orderId
  opt Clear cart
    BE->>DB: Update Cart(user).items=[]
  end
  BE-->>FE: 201 order

  FE->>BE: GET /api/v1/orders/me (Auth)
  BE->>DB: Order.find({user})
  DB-->>BE: orders
  BE-->>FE: 200 orders
```

---

## 6) Checkout (PayOS/VNPay/MoMo) — tạo link thanh toán + callback/webhook

> BE có endpoints: `POST /api/v1/payments/payos|vnpay|momo/create/:orderId` và các URL return/webhook.

```mermaid
sequenceDiagram
  autonumber
  actor Customer
  participant FE as FE (Web)
  participant BE as BE (API)
  participant DB as MongoDB
  participant PSP as Payment Provider (PayOS/VNPay/MoMo)

  FE->>BE: POST /api/v1/orders (Auth)
  BE->>DB: Create Order(paymentStatus=UNPAID)
  DB-->>BE: order
  BE-->>FE: 201 order

  FE->>BE: POST /api/v1/payments/payos/create/:orderId (Auth)
  BE->>DB: Find Order by id
  DB-->>BE: order
  BE->>PSP: Create payment link (amount, returnUrl)
  PSP-->>BE: paymentUrl + ids
  BE->>DB: Update Order(payosOrderCode, payosPaymentLinkId)
  BE-->>FE: 200 paymentUrl

  FE->>PSP: Redirect user to paymentUrl
  alt User thanh toán thành công
    PSP-->>BE: POST /api/v1/payments/payos/webhook
    BE->>DB: Mark Order.paymentStatus=PAID
    DB-->>BE: updated
    PSP-->>FE: Redirect returnUrl (/payos/return)
    FE->>BE: GET /api/v1/orders/:id (Auth)
    BE->>DB: Load order
    DB-->>BE: order(PAID)
    BE-->>FE: 200
  else User huỷ
    PSP-->>FE: Redirect /api/v1/payments/payos/cancel
    FE->>BE: GET /api/v1/orders/:id (Auth)
    BE-->>FE: 200 (UNPAID)
  end
```

---

## 7) View/Track/Cancel Order — `/api/v1/orders/me` + update status (nếu cho phép)

> Lưu ý: trong code, cập nhật status là API admin/staff/delivery (`PUT /api/v1/orders/:id/status`). Customer thường chỉ “xem” và có thể yêu cầu huỷ (nếu bạn có logic); nếu hiện chưa có endpoint cancel riêng thì cancel nằm trong update status do staff/admin.

```mermaid
sequenceDiagram
  autonumber
  actor Customer
  participant FE as FE
  participant BE as BE
  participant DB as MongoDB

  Customer->>FE: Mở trang đơn hàng
  FE->>BE: GET /api/v1/orders/me (Auth)
  BE->>DB: Order.find({user}).sort(createdAt desc)
  DB-->>BE: orders
  BE-->>FE: 200 orders

  Customer->>FE: Xem chi tiết/track
  FE->>BE: GET /api/v1/orders/:id (Auth)
  BE->>DB: Order.findById
  DB-->>BE: order(orderStatus)
  BE-->>FE: 200 order
```

---

## 8) Rate & Review — `POST /api/v1/reviews`

```mermaid
sequenceDiagram
  autonumber
  actor Customer
  participant FE as FE
  participant BE as BE
  participant DB as MongoDB

  Customer->>FE: Chọn đơn + sản phẩm để đánh giá
  FE->>BE: POST /api/v1/reviews (Auth)
  BE->>DB: Create Review(user, product, order, rating, comment)
  alt Đã review (unique user+product+order)
    DB-->>BE: duplicate key error
    BE-->>FE: 409 Already reviewed
  else OK
    DB-->>BE: review
    BE-->>FE: 201 review(status=PENDING)
  end

  opt Staff/Admin duyệt review
    FE->>BE: GET /api/v1/reviews/pending (Auth STAFF/ADMIN)
    BE->>DB: Review.find({status:PENDING})
    DB-->>BE: pending
    BE-->>FE: 200

    FE->>BE: PUT /api/v1/reviews/:id/moderate (Auth STAFF/ADMIN)
    BE->>DB: Update Review.status=APPROVED/HIDDEN
    DB-->>BE: updated
    BE-->>FE: 200
  end
```

---

## 9) Chat Support — rooms + messages

```mermaid
sequenceDiagram
  autonumber
  actor Customer
  participant FE as FE
  participant BE as BE
  participant DB as MongoDB

  Customer->>FE: Mở chat
  FE->>BE: GET /api/v1/chat/rooms/me (Auth)
  BE->>DB: Find or create ChatRoom(user)
  DB-->>BE: room
  BE-->>FE: 200 room

  FE->>BE: GET /api/v1/chat/rooms/:roomId/messages (Auth)
  BE->>DB: ChatMessage.find({room}).sort(createdAt)
  DB-->>BE: messages
  BE-->>FE: 200 messages

  Customer->>FE: Gửi tin nhắn
  FE->>BE: POST /api/v1/chat/rooms/:roomId/messages (Auth)
  BE->>DB: Create ChatMessage(room, sender, message)
  DB-->>BE: message
  BE-->>FE: 201 message
```

---

## 10) Staff/Admin xử lý đơn (Update Status) — `PUT /api/v1/orders/:id/status`

```mermaid
sequenceDiagram
  autonumber
  actor Staff as Staff/Admin/Delivery
  participant FE as Admin FE
  participant BE as BE
  participant DB as MongoDB

  Staff->>FE: Chọn đơn cần xử lý
  FE->>BE: GET /api/v1/orders (Auth ROLE)
  BE->>DB: Order.find({}).sort(createdAt desc)
  DB-->>BE: orders
  BE-->>FE: 200

  Staff->>FE: Cập nhật trạng thái (PROCESSING/SHIPPING/COMPLETED/...)
  FE->>BE: PUT /api/v1/orders/:id/status (Auth ROLE)
  BE->>DB: Update Order.orderStatus
  DB-->>BE: updated
  BE-->>FE: 200
```

---

## 11) Warranty Claim — create & staff update

```mermaid
sequenceDiagram
  autonumber
  actor Customer
  participant FE as FE
  participant BE as BE
  participant DB as MongoDB

  Customer->>FE: Tạo yêu cầu bảo hành
  FE->>BE: POST /api/v1/warranty (Auth)
  BE->>DB: Create WarrantyClaim(user, orderItemId, reason, proof)
  DB-->>BE: claim
  BE-->>FE: 201

  opt Staff/Admin xử lý
    participant Staff as Staff/Admin
    Staff->>BE: GET /api/v1/warranty (Auth STAFF/ADMIN)
    BE->>DB: WarrantyClaim.find({})
    DB-->>BE: claims
    BE-->>Staff: 200

    Staff->>BE: PUT /api/v1/warranty/:id (Auth STAFF/ADMIN)
    BE->>DB: Update status/resolution/staffNote
    DB-->>BE: updated
    BE-->>Staff: 200
  end
```

---

## 12) Import Receipt (Nhập hàng) — `POST /api/v1/import-receipts`

```mermaid
sequenceDiagram
  autonumber
  actor Staff
  participant FE as Admin FE
  participant BE as BE
  participant DB as MongoDB

  Staff->>FE: Tạo phiếu nhập
  FE->>BE: POST /api/v1/import-receipts (Auth STAFF/ADMIN)
  BE->>DB: Create ImportReceipt(supplier, staff, details[])
  DB-->>BE: receipt
  BE-->>FE: 201

  FE->>BE: GET /api/v1/import-receipts (Auth STAFF/ADMIN)
  BE->>DB: ImportReceipt.find({}).sort(createdAt desc)
  DB-->>BE: receipts
  BE-->>FE: 200
```
