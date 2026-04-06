# Tính năng dự án

## Tổng quan

Đây là game tu tiên hành động góc nhìn 2D, nơi người chơi điều khiển một kiếm trận xoay quanh tâm trận để săn quái, tích lũy tu vi, đột phá cảnh giới và kích hoạt tuyệt kỹ `Vạn Kiếm Quy Tông`.

## Các tính năng chính

### 1. Trận kiếm 72 thanh

- Kiếm trận có nhiều tầng, nhiều lớp, quay quanh tâm trận theo đội hình hộ thể.
- Mỗi thanh kiếm có thể lao ra tấn công, bị phá hủy, hồi sinh và để lại hiệu ứng mảnh vỡ.
- Khi đổi trạng thái hộ thể, đội hình kiếm sẽ đổi cách xoay và khoảng cách bảo vệ.

### 2. Hai trạng thái hộ thể

- Người chơi có thể chuyển đổi giữa hai đội hình kiếm khác nhau ngay trong lúc chiến đấu.
- Việc đổi trạng thái tiêu hao mana, nên cần cân nhắc khi giao tranh kéo dài.

### 3. Tấn công chủ động

- Giữ nút tấn công để kiếm lao ra truy sát mục tiêu.
- Khi ngừng giữ nút, kiếm sẽ quay về đội hình hộ thể.
- Quái quá mạnh có thể giảm sát thương, né tránh hoặc gần như bất tử nếu chênh lệch cảnh giới quá lớn.

### 4. Mana và tài nguyên chiến đấu

- Mana dùng cho:
  - Tấn công liên tục
  - Di chuyển
  - Đổi trạng thái hộ thể
  - Hồi sinh kiếm bị vỡ
- Mana tự hồi theo thời gian và có thể cộng thêm khi tiêu diệt quái nếu cấu hình cho phép.

### 5. Tu vi và đột phá cảnh giới

- Mỗi quái vật cho tu vi theo cấp độ của nó.
- Khi thanh tu vi đầy, người chơi bước vào trạng thái sẵn sàng đột phá.
- Đột phá có tỉ lệ thành công riêng theo từng cảnh giới.
- Nếu thất bại:
  - Mất một phần tu vi
  - Bị giảm một nửa lượng bonus đột phá đã tích từ đan dược
- Nếu đầy tu vi quá lâu, hệ thống có thể cưỡng ép đột phá.

### 6. Linh thạch

Linh thạch là tiền tệ chính dùng trong cửa hàng.

- Có 4 phẩm chất:
  - Hạ phẩm linh thạch
  - Trung phẩm linh thạch
  - Thượng phẩm linh thạch
  - Cực phẩm linh thạch
- Quy đổi:
  - 1 Trung phẩm = 100 Hạ phẩm
  - 1 Thượng phẩm = 100 Trung phẩm = 10,000 Hạ phẩm
  - 1 Cực phẩm = 100 Thượng phẩm = 1,000,000 Hạ phẩm
- Linh thạch rơi trực tiếp từ quái và tự quy đổi trong ví theo tổng giá trị.

### 7. Đan dược

Đan dược không còn cộng thẳng ngay khi nhặt, mà sẽ được đưa vào túi đồ để người chơi tự quyết định khi nào dùng.

#### Đan tăng tu vi

- Có 4 phẩm chất:
  - Thanh Linh Tụ Khí Đan
  - Bích Hải Tụ Linh Đan
  - Kim Tủy Dưỡng Nguyên Đan
  - Thiên Hoa Uẩn Mạch Đan
- Khi dùng:
  - Tăng trực tiếp một phần tu vi của cảnh giới hiện tại
  - Phẩm chất càng cao, lượng tu vi nhận được càng lớn

#### Đan đột phá

- Có 4 phẩm chất:
  - Hạ phẩm `{cảnh giới lớn kế tiếp} đan`
  - Trung phẩm `{cảnh giới lớn kế tiếp} đan`
  - Thượng phẩm `{cảnh giới lớn kế tiếp} đan`
  - Cực phẩm `{cảnh giới lớn kế tiếp} đan`
- Ví dụ:
  - Hạ phẩm Trúc cơ đan
  - Trung phẩm Kết đan đan
- Khi dùng:
  - Tăng phần trăm tỉ lệ đột phá
  - Chỉ hợp với đúng cảnh giới lớn kế tiếp của người chơi hiện tại

#### Đan tăng công vĩnh viễn

- Gồm các loại như:
  - Thanh Mộc Trảm Linh Đan
  - Kim Tủy Phạt Mạch Đan
  - Liệt Dương Bá Thể Đan
  - Thái Huyền Tru Ma Đan
- Khi dùng:
  - Tăng vĩnh viễn lực công kích của kiếm trận trong lượt chơi hiện tại

#### Đan cuồng bạo tạm thời

- Gồm các loại như:
  - Nhiên Huyết Cuồng Sát Đan
  - Phệ Linh Bạo Khí Đan
  - Trầm Mạch Thiên Sát Đan
  - Nghịch Nguyên Thiêu Huyết Đan
- Khi dùng:
  - Hào quang quanh tâm trận chuyển sang đỏ
  - Sát thương tăng mạnh trong một khoảng thời gian
  - Một số loại kèm tác dụng phụ như:
    - Hao linh lực
    - Giảm giới hạn linh lực tạm thời
    - Giảm tốc độ tạm thời
    - Tổn hao tu vi hiện có
- Giá thành mỗi loại khác nhau tùy độ mạnh và mức tác dụng phụ

#### Đan hỗ trợ khác

- Đan tăng nộ:
  - Tăng ngay lượng nộ kiếm để đẩy nhanh Ultimate
- Đan hồi phục linh lực:
  - Hồi ngay mana hiện tại
- Đan tăng giới hạn linh lực:
  - Tăng vĩnh viễn dung lượng thanh linh lực trong lượt chơi hiện tại
- Đan tăng tốc độ:
  - Tăng tốc độ vận chuyển kiếm trận và tốc độ truy sát của kiếm

### 8. Hệ rơi đồ mới

- Tỉ lệ rơi đan dược đã được giảm xuống để tài nguyên hiếm và có giá trị hơn.
- Bù lại, quái sẽ có thêm cơ chế rơi linh thạch.
- Quái tinh anh có cơ hội rơi nhiều vật phẩm hơn quái thường.

### 9. Cửa hàng

- Có nút `giỏ hàng` ngay cạnh nút cài đặt ở góc trên.
- Khi mở cửa hàng:
  - Hiển thị tổng số linh thạch đang có
  - Hiển thị từng loại linh thạch trong ví
  - Bán các loại đan tăng tu vi
  - Bán các loại đan đột phá cho cảnh giới lớn kế tiếp
  - Bán đan tăng công, đan cuồng bạo, đan tăng nộ, hồi linh, khai hải và thân pháp
- Đan dược trong túi có thể bán ngược lại để thu hồi một phần linh thạch.
- Thanh toán bằng đơn vị quy đổi `hạ phẩm linh thạch`, nên ví có thể tự dùng nhiều loại linh thạch cùng lúc.

### 10. Túi không gian trữ vật

- Có nút riêng cạnh cài đặt để mở túi đồ.
- Túi đồ hiển thị dạng ô vuông dễ nhìn.
- Bên trong chia rõ:
  - Khu đan dược
  - Khu linh thạch
- Mỗi ô vật phẩm đều cho biết:
  - Tên vật phẩm
  - Mô tả tác dụng
  - Số lượng đang có
  - Nút `Dùng` nếu vật phẩm có thể sử dụng ngay
  - Nút `Bán` để đổi lại linh thạch nếu không muốn giữ

### 11. Ultimate: Vạn Kiếm Quy Tông

- Nộ được tích lũy khi tiêu diệt quái.
- Nút Ultimate vừa là nút kích hoạt, vừa là thanh tiến độ nộ.
- Khi bấm Ultimate:
  - Các kiếm nhỏ từ từ hợp lại thành một đại kiếm
  - Sau khi hợp xong, chỉ còn 1 đại kiếm hoạt động
- Khi Ultimate kết thúc:
  - Đại kiếm từ từ tách ra
  - Các kiếm nhỏ quay lại đội hình thường
- Cách thể hiện này vừa đúng logic “vạn kiếm hợp nhất”, vừa giúp giảm lag hơn kiểu nhiều đại kiếm cùng lúc.

### 12. Quái vật theo cấp độ

- Quái sinh ra theo nhiều cảnh giới khác nhau.
- Có cơ chế quái tinh anh, quái có khiên và quái né tránh theo chênh lệch cảnh giới.
- Hệ thống vẫn cố giữ một lượng quái vừa sức để người chơi luôn có mục tiêu farm được.

### 13. Tùy chỉnh cấu hình trực tiếp trong game

- Popup `THIÊN ĐẠO QUY TẮC` cho phép chỉnh nhanh nhiều thông số:
  - Nền, sao, zoom
  - Kiếm trận
  - Quái vật
  - Mana
  - Tỉ lệ rơi đan
  - Tỉ lệ rơi linh thạch
  - Nộ và Ultimate
  - Phạt đột phá, giới hạn tỉ lệ đột phá
- Sau khi lưu, trận pháp sẽ khởi tạo lại theo cấu hình mới.

## Trải nghiệm chơi nhanh

1. Di chuyển tâm trận đến gần quái.
2. Giữ nút tấn công để kiếm lao ra tiêu diệt mục tiêu.
3. Nhặt đan dược và linh thạch rơi ra.
4. Mở túi đồ để dùng đan tăng tu vi hoặc đan đột phá khi cần.
5. Khi đủ tu vi, thực hiện đột phá cảnh giới.
6. Tích nộ để kích hoạt `Vạn Kiếm Quy Tông` trong lúc đông quái hoặc đánh tinh anh.
7. Dùng linh thạch tích lũy được để mua thêm đan trong cửa hàng.

## Ghi chú kỹ thuật

- Toàn bộ hiệu ứng đều chạy trực tiếp trên `canvas`.
- Các popup UI được gắn trực tiếp vào giao diện game để thao tác nhanh trong lúc chơi.
- Dữ liệu cấu hình có thể lưu bằng `localStorage`.
