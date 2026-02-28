# API Documentation (TechGear BE)

Base URL (local): `http://localhost:5000` (hoặc `http://localhost:<PORT>` nếu bạn set `PORT` trong `server/.env`)

Base path:

- Auth: `/api/v1/auth`
- Users: `/api/v1/users`
- Products: `/api/v1/products`

## Health / Default

### GET /

- Mục đích: kiểm tra server có chạy
- Response: text

Ví dụ:

```bash
curl http://localhost:5000/
```

---

## Auth APIs

## Email (Gmail SMTP) Setup

Để chức năng gửi email (OTP đăng ký / reset password) hoạt động với Gmail:

1. Bật **2-Step Verification** cho tài khoản Gmail.
2. Tạo **App Password** (Google Account → Security → App Passwords).
3. Cập nhật file `BE/server/.env`:

```dotenv
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx  # App Password (16 ký tự, không có khoảng trắng khi paste)
SMTP_FROM="TechGear <your_gmail@gmail.com>"
```

Gợi ý: nếu bạn dùng port `587` thì cần `SMTP_PORT=587` (TLS STARTTLS). Hiện code auto `secure=true` khi port là `465`.

### POST /api/v1/auth/register

- Mục đích: đăng ký (bước 1) — gửi mã OTP về email (chưa tạo user thật)
- Content-Type: `application/json`

Request body:

```json
{
  "fullName": "Nguyen Van A",
  "email": "a@gmail.com",
  "password": "123456",
  "phone": "0900000000",
  "address": "HCM"
}
```

Response (200):

```json
{
  "message": "Đã gửi mã xác nhận về email. Vui lòng nhập mã để hoàn tất đăng ký.",
  "email": "a@gmail.com",
  "expiresAt": "2026-02-03T10:00:00.000Z"
}
```

Lỗi thường gặp:

- `400`: Email đã được sử dụng

---

### POST /api/v1/auth/register/confirm

- Mục đích: đăng ký (bước 2) — nhập OTP để tạo tài khoản thật và có thể sử dụng
- Content-Type: `application/json`

Request body:

```json
{
  "email": "a@gmail.com",
  "code": "123456"
}
```

Response (201):

```json
{
  "message": "Đăng ký thành công",
  "_id": "<mongo_id>",
  "fullName": "Nguyen Van A",
  "email": "a@gmail.com",
  "role": "CUSTOMER",
  "isVerified": true,
  "token": "<jwt_token>"
}
```

Lỗi thường gặp:

- `400`: Mã xác nhận không đúng
- `400`: Mã xác nhận đã hết hạn

---

### POST /api/v1/auth/register/resend

- Mục đích: gửi lại OTP đăng ký
- Content-Type: `application/json`

Request body:

```json
{
  "email": "a@gmail.com"
}
```

Response (200):

```json
{
  "message": "Đã gửi lại mã xác nhận về email.",
  "email": "a@gmail.com",
  "expiresAt": "2026-02-03T10:00:00.000Z"
}
```

---

### POST /api/v1/auth/login

- Mục đích: đăng nhập
- Content-Type: `application/json`

Request body:

```json
{
  "email": "a@gmail.com",
  "password": "123456"
}
```

Response (200):

```json
{
  "_id": "<mongo_id>",
  "fullName": "Nguyen Van A",
  "email": "a@gmail.com",
  "role": "<role>",
  "token": "<jwt_token>"
}
```

Lỗi thường gặp:

- `401`: Email hoặc mật khẩu không đúng
- `403`: Tài khoản chưa được xác thực email

---

### POST /api/v1/auth/reset-password

- Mục đích: gửi email link đặt lại mật khẩu
- Content-Type: `application/json`

Request body:

```json
{
  "email": "a@gmail.com"
}
```

Response (200):

```json
{
  "message": "Nếu email tồn tại, hệ thống đã gửi link đặt lại mật khẩu."
}
```

---

### POST /api/v1/auth/reset-password/confirm

- Mục đích: xác nhận đặt lại mật khẩu bằng token từ link email
- Content-Type: `application/json`

Request body:

```json
{
  "token": "<token_from_email>",
  "password": "123456"
}
```

---

### GET /api/v1/auth/me

- Mục đích: lấy thông tin user đang đăng nhập
- Auth: `Authorization: Bearer <token>`

Ví dụ:

```bash
curl -H "Authorization: Bearer <token>" http://localhost:5000/api/v1/auth/me
```

---

## User APIs

### GET /api/v1/users/me

- Mục đích: lấy profile hiện tại
- Auth: `Authorization: Bearer <token>`

---

### PUT /api/v1/users/me

- Mục đích: cập nhật thông tin user (tên, email, địa chỉ, số điện thoại, tỉnh/thành phố)
- Auth: `Authorization: Bearer <token>`
- Content-Type: `application/json`

Request body (gửi field nào update field đó):

```json
{
  "fullName": "Nguyen Van A",
  "email": "a-new@gmail.com",
  "phone": "0900000000",
  "address": "123 Lê Lợi, Quận 1",
  "provinceCity": "TP. Hồ Chí Minh"
}
```

Response (200): user (không có password)

---

## Product APIs

### GET /api/v1/products

- Mục đích: lấy danh sách sản phẩm
- Query optional:
  - `category`: lọc theo category (regex, không phân biệt hoa thường)

Ví dụ:

```bash
curl "http://localhost:5000/api/v1/products"
curl "http://localhost:5000/api/v1/products?category=PC%20Gaming"
```

Response (200): array sản phẩm

---

### GET /api/v1/products/:id

- Mục đích: lấy chi tiết sản phẩm theo MongoDB ObjectId

Ví dụ:

```bash
curl "http://localhost:5000/api/v1/products/65f000000000000000000000"
```

Response:

- `200`: object sản phẩm
- `404`: `{ "message": "Không tìm thấy sản phẩm" }`

---

### POST /api/v1/products

- Mục đích: tạo sản phẩm mới (hiện chưa có auth/admin middleware)
- Content-Type: `application/json`

Request body:

- Backend hiện đang `new Product(req.body)` nên body theo schema `Product`.
- Fields:
  - `name` (string, required)
  - `image` (string, required)
  - `price` (number, required)
  - `oldPrice` (number, optional)
  - `description` (string, optional)
  - `category` (string, required)
  - `subCategory` (string, optional)
  - `countInStock` (number, optional, default `0`)
  - `status` (string, optional, default `"Còn hàng"`)
  - `discount` (number, optional, default `0`)

Ví dụ body (minh hoạ):

```json
{
  "name": "Laptop Gaming",
  "price": 25000000,
  "category": "Laptop",
  "description": "...",
  "image": "https://...",
  "countInStock": 10,
  "status": "Còn hàng",
  "discount": 5
}
```

Response:

- `201`: object sản phẩm vừa tạo
- `400`: `{ "message": "..." }`
