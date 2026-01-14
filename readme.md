# 72 Thanh Trúc Phong Vân Kiếm – Đại Canh Kiếm Trận

Một demo HTML5 Canvas mô phỏng **72 thanh kiếm hộ thể** xoay quanh nhân vật, lấy cảm hứng từ thế giới *Phàm Nhân Tu Tiên*. Dự án tập trung vào hiệu ứng thị giác, chuyển động vật lý và quy trình tối ưu hóa mã nguồn hiện đại.

---

## ✦ Link Dự án

* **Demo trực tuyến**: [https://vhn-dev.github.io/thanh-truc-phong-van-kiem/](https://vhn-dev.github.io/thanh-truc-phong-van-kiem/)
* **Mã nguồn (GitHub)**: [https://github.com/VHN-DEV/thanh-truc-phong-van-kiem](https://github.com/VHN-DEV/thanh-truc-phong-van-kiem)

---

## ✦ Tổng quan

* **Số lượng**: 72 thanh kiếm chia thành **3 tầng trận** (mỗi tầng 24 kiếm).
* **Hành vi**: Kiếm xoay, bám tâm và phản ứng linh hoạt theo tốc độ di chuyển của chuột/touch.
* **Hình thức**: 2 chế độ hộ thể kiếm trận (Guard Form) có thể chuyển đổi linh hoạt.
* **Chiến đấu**: Cơ chế tấn công tự động (Auto-attack) và Enemy sinh ngẫu nhiên để thử nghiệm va chạm.

---

## ✦ Cấu trúc Dự án (Pipeline)

Dự án sử dụng quy trình **Build Pipeline** để tối ưu hóa hiệu suất tải trang:

```text
THANH-TRUC-PHONG-VAN-KIEM/
├── assets/                 # Mã nguồn gốc (Development)
│   ├── css/style.scss      # Kiểu dáng viết bằng SCSS
│   ├── js/                 # Các module JS (config, entities, main)
│   └── images/             # Tài nguyên ảnh gốc (SVG)
├── public/                 # Bản phân phối đã tối ưu (Production)
│   └── assets/
│       ├── css/style.min.css    # CSS đã biên dịch và nén
│       ├── js/scripts.min.js    # JS đã gộp module và nén
│       └── images/              # Tài nguyên ảnh đã đồng bộ
├── index.html              # Sử dụng tài nguyên từ thư mục /public
├── gulpfile.js             # Cấu hình tự động nén và gộp file
├── package.json            # Quản lý thư viện và scripts
└── .gitignore              # Loại bỏ node_modules và các file build

```

---

## ✦ Quy trình Phát triển

### 1. Cài đặt

Yêu cầu đã cài đặt [Node.js](https://nodejs.org/). Tại thư mục gốc, chạy:

```bash
npm install

```

### 2. Các lệnh thực thi (Gulp)

| Lệnh | Mô tả |
| --- | --- |
| `npx gulp` | Biên dịch SCSS, gộp JS và copy ảnh sang `/public` (Chạy 1 lần). |
| `npx gulp watch` | **Chế độ phát triển:** Tự động build lại mỗi khi bạn nhấn **Save (Ctrl+S)**. |

---

## ✦ Điều khiển

### Chuột / Touch

| Thao tác | Chức năng |
| --- | --- |
| **Di chuyển** | Điều khiển tâm kiếm trận |
| **Nhấn giữ nút Attack** | Kích hoạt tấn công mục tiêu gần nhất |
| **Double-tap nút Form** | Chuyển đổi giữa 2 dạng hộ thể |
| **Nút Zoom (+/-)** | Thay đổi khoảng cách camera |

### Guard Form

* **Form 1 (Ổn định)**: Kiếm bám vị trí trận chặt chẽ, mượt mà.
* **Form 2 (Linh động)**: Kiếm có quán tính cao, dao động mạnh, cảm giác sống động.

---

## ✦ Định hướng mở rộng (Roadmap)

* [x] Chuyển đổi sang hệ thống Build (Gulp + SCSS).
* [x] Tối ưu hóa dung lượng (Minification & Bundling).
* [ ] Thêm hiệu ứng tụ khí (VFX) khi đổi trận.
* [ ] Hệ thống âm thanh kiếm khí.
* [ ] Boss AI và nhiều tầng kiếm trận phức tạp hơn.

---

## ✦ Tác giả

**VHN-DEV**

* Website: [https://github.com/VHN-DEV](https://www.google.com/search?q=https://github.com/VHN-DEV)

---

> *“Kiếm trận không nằm ở số lượng, mà ở tâm không loạn.”*

---