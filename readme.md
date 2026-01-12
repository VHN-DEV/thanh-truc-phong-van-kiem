# 72 Thanh Trúc Phong Vân Kiếm – Đại Canh Kiếm Trận

Một demo HTML5 Canvas mô phỏng **72 thanh kiếm hộ thể** xoay quanh nhân vật, lấy cảm hứng từ thế giới *Phàm Nhân Tu Tiên*. Dự án tập trung vào hiệu ứng thị giác, chuyển động vật lý nhẹ và cơ chế điều khiển bằng chuột / touch (pointer events).

---

## ✦ Tổng quan

- 72 thanh kiếm chia thành **3 tầng trận** (mỗi tầng 24 kiếm)
- Kiếm xoay – bám tâm – phản ứng theo tốc độ chuột
- Có **2 hộ thể kiếm trận** (guard form)
- Có cơ chế **tấn công tự động** khi giữ chuột
- Enemy sinh ngẫu nhiên để kiểm tra va chạm

Dự án **không sử dụng thư viện ngoài**, chỉ dùng:
- HTML5
- Canvas 2D
- JavaScript thuần (Vanilla JS)

---

## ✦ Điều khiển

### Chuột / Touch

| Thao tác | Chức năng |
|--------|-----------|
| Di chuyển | Điều khiển tâm kiếm trận |
| Nhấn giữ | Kích hoạt tấn công (kiếm truy sát mục tiêu gần nhất) |
| Double-click / Double-tap | Chuyển hộ thể kiếm trận |

### Guard Form

- **Form 1 – Hộ thể ổn định**  
  Kiếm bám vị trí trận chặt chẽ, chuyển động mượt và đều.

- **Form 2 – Hộ thể linh động**  
  Kiếm có quán tính, dao động mạnh hơn, cảm giác “linh hoạt – sống”.

---

## ✦ Cơ chế chính

### 1. Trạng thái kiếm

Kiếm tự động chuyển trạng thái dựa trên tốc độ chuột:

- `GUARD_STABLE` – Chuột đứng yên, hộ thể ổn định
- `GUARD_DYNAMIC` – Chuột chậm, hộ thể linh động
- `FOLLOW` – Chuột di chuyển nhanh, kiếm bám theo
- `ATTACK` – Tự động lao về enemy gần con trỏ nhất

---

### 2. Double-tap & Delay

- `DOUBLE_TAP_DELAY = 300ms` – phát hiện đổi trận
- `ATTACK_DELAY = 180ms` – tránh kích hoạt tấn công nhầm khi double-tap

Cơ chế này giúp:
- Không bị spam đổi trận
- Tách rõ **ý định đổi trận** và **ý định tấn công**

---

### 3. Enemy

- Sinh ngẫu nhiên trên canvas
- Máu phụ thuộc kích thước
- Bị kiếm tấn công sẽ mất HP
- Chết → respawn sau 1 giây

---

## ✦ Cấu trúc file

```text
index.html   # Toàn bộ demo (HTML + CSS + JS)
README.md    # Tài liệu mô tả dự án
```

Dự án được thiết kế **1 file duy nhất** để dễ demo và chia sẻ.

---

## ✦ Cách chạy

Chỉ cần mở file HTML bằng trình duyệt hiện đại:

```bash
open index.html
```

Hoặc dùng Live Server nếu muốn chỉnh sửa realtime.

---

## ✦ Định hướng mở rộng (Roadmap)

- [ ] Thêm nhiều kiếm trận (Kiếm Vũ Tán Trận, Thiên La Kiếm Võng, …)
- [ ] Hiệu ứng tụ khí khi đổi trận
- [ ] Boss / Enemy AI
- [ ] Âm thanh kiếm – khí tức
- [ ] Phiên bản mobile tối ưu

---

## ✦ Ghi chú

Dự án mang tính **thử nghiệm hiệu ứng & cảm giác**, không phải game hoàn chỉnh.
Mã nguồn ưu tiên **trực quan và dễ chỉnh** hơn là tối ưu hoá cực đoan.

---

## ✦ Giấy phép

MIT License – Tự do sử dụng, chỉnh sửa và học tập.

---

> *“Kiếm trận không nằm ở số lượng, mà ở tâm không loạn.”*

