# 72 Thanh Trúc Phong Vân Kiếm – Đại Canh Kiếm Trận

Một demo HTML5 Canvas mô phỏng **72 thanh kiếm hộ thể** xoay quanh nhân vật, lấy cảm hứng từ thế giới *Phàm Nhân Tu Tiên*. Dự án tập trung vào hiệu ứng thị giác, chuyển động vật lý và quy trình tối ưu hóa mã nguồn hiện đại.

---

## ✦ Link Dự án

* **Demo trực tuyến**: [https://vhn-dev.github.io/thanh-truc-phong-van-kiem/](https://vhn-dev.github.io/thanh-truc-phong-van-kiem/)
* **Mã nguồn (GitHub)**: [https://github.com/VHN-DEV/thanh-truc-phong-van-kiem](https://github.com/VHN-DEV/thanh-truc-phong-van-kiem)

---

## ✦ Tổng quan

* **Số lượng**: 72 thanh kiếm chia thành **3 tầng trận** (mỗi tầng 24 kiếm).
* **Ngoại tầng**: phòng ngự, ngăn cản đối phương tiếp cận
* **Trung tầng**: quấy nhiễu, tiêu hao linh lực địch
* **Nội tầng**: sát chiêu chủ lực, tập trung diệt địch
* **Hành vi**: Kiếm xoay quanh tâm trận (Trận nhãn).
* **Hình thức**: 2 chế độ hộ thể kiếm trận có thể chuyển đổi linh hoạt.
* **Chiến đấu**: Cơ chế tấn công tự động và các mục tiêu sinh ngẫu nhiên để thử nghiệm va chạm.
---

# 🗡️ Đại Canh Kiếm Trận - 72 Thanh Trúc Phong Vân Kiếm

**Đại Canh Kiếm Trận** là một hệ thống mô phỏng trận pháp kiếm tiên huyền ảo, nơi người chơi điều khiển tâm trận để vận hành 72 thanh linh kiếm, tạo ra một vùng cấm địa bất khả xâm phạm.

## 🌌 Cơ Chế Tam Tầng Kiếm Trận (Three-Tier Formation)

Trận pháp được chia thành 3 vòng xoáy cực hạn, mỗi tầng gồm **24 thanh linh kiếm**, vận hành theo nguyên lý "Thiên - Địa - Nhân":

* **Ngoại Tầng - Hộ Thiên Kiếm:** Lớp phòng vệ ngoài cùng. Các thanh kiếm di chuyển với quỹ đạo rộng, tạo thành bức tường khí kình vững chãi, ngăn chặn tà khí và kẻ địch tiếp cận.
* **Trung Tầng - Huyền Cơ Kiếm:** Lớp quấy nhiễu chủ lực. Vận hành biến hóa khôn lường, liên tục tiêu hao linh lực và làm suy yếu ý chí chiến đấu của đối phương.
* **Nội Tầng - Tru Diệt Kiếm:** Sát chiêu cuối cùng. Tập trung linh khí cực đại, sẵn sàng tung ra những nhát chém chí mạng vào bất kỳ mục tiêu nào lọt vào trung tâm trận nhãn.

## 🔄 Lưỡng Nghi Chuyển Hoán (Switching Forms)

Người điều khiển có thể linh hoạt thay đổi hình thái của kiếm trận để thích ứng với chiến trường:

1. **Toàn Chân Hình Thái (Standard Form):** Kiếm trận xoay tròn ổn định, mũi kiếm hướng ngoại, duy trì thế cân bằng giữa công và thủ, tối ưu hóa việc tiêu hao linh lực.
2. **Cuồng Phong Hình Thái (Flow Form):** Các thanh kiếm chuyển động theo quỹ đạo hỗn loạn nhưng có quy luật, tốc độ xoay tăng vọt, tạo ra luồng kiếm khí bao phủ diện rộng.

## ⚔️ Linh Tính Chiến Đấu (Combat Mechanics)

Hệ thống mô phỏng các tương tác vật lý và linh lực phức tạp:

* **Khí Cơ Cảm Ứng:** Linh kiếm tự động nhận diện sát khí từ kẻ địch (mục tiêu ngẫu nhiên). Khi mục tiêu xuất hiện, các thanh kiếm sẽ tự động tách hàng ngũ, lao vút như lôi quang để tập kích.
* **Vạn Kiếm Quy Tông:** Sau khi tiêu diệt mục tiêu hoặc va chạm với hộ thân bảo pháp (Shield) của địch, linh kiếm sẽ ngay lập tức quay về vị trí cũ trong tầng trận để duy trì trận thế.
* **Linh Khí Tái Tạo:** Khi linh kiếm tổn hại quá nặng (cạn độ bền), chúng sẽ vỡ tan thành các mảnh linh thạch (Fragments) và quay về Trận Nhãn. Người chơi cần tiêu tốn **Mana** để tái tạo lại kiếm từ hư không.

## 🛠️ Thông Số Kỹ Thuật (Configuration)

Hệ thống được vận hành dựa trên các thông số cấu hình linh hoạt:

* **Số lượng:** 72 Linh kiếm.
* **Năng lượng:** Hệ thống Mana tự phục hồi theo thời gian (Regen).
* **Hiệu ứng:** Mảnh vỡ vật lý khi vỡ kiếm, hiệu ứng hào quang (Aura) khi chiến đấu.
* **Tương tác:** Hỗ trợ cảm ứng đa điểm (Pinch to Zoom) và điều khiển bằng chuột/phím trên máy tính.

---

### 📜 Hướng dẫn điều khiển

* **Di chuyển:** Di chuyển chuột hoặc chạm màn hình để điều khiển Trận Nhãn.
* **Tấn công:** Nhấn giữ nút Kiếm (hoặc phím tắt) để kích hoạt trạng thái truy kích.
* **Chuyển trận:** Sử dụng nút Form để thay đổi giữa Toàn Chân và Cuồng Phong.

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