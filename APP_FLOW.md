# Lưu đồ hoạt động app Check-in Du lịch 2026

## 1. Mục tiêu hệ thống

App dùng để CBNV tự check-in theo số điện thoại, Trưởng xe theo dõi danh sách xe và báo phát sinh, Admin quản lý dữ liệu, xử lý điều chuyển và theo dõi báo cáo.

## 2. Vai trò sử dụng

| Vai trò | Cách vào hệ thống | Quyền chính |
|---|---|---|
| CBNV | Nhập số điện thoại | Xem hồ sơ cá nhân, check-in các mốc được mở đúng giờ |
| Trưởng xe | Nhập số điện thoại có quyền `Truong_xe` | Xem danh sách xe, trạng thái check-in, copy SĐT, báo phát sinh |
| Admin | Bấm Admin và nhập PIN | Import/export dữ liệu, check-in thủ công, điều chuyển xe, xử lý phát sinh, xem báo cáo |

## 3. Lưu đồ tổng quan

```mermaid
flowchart TD
    A[Người dùng mở app] --> B[Màn hình nhập số điện thoại]
    B --> C{Tìm thấy SĐT trong dữ liệu?}
    C -- Không --> D[Thông báo không tìm thấy hồ sơ]
    C -- Có --> E[Load hồ sơ cá nhân]
    E --> F{Có quyền Trưởng xe?}
    F -- Không --> G[Màn hình check-in cá nhân]
    F -- Có --> H[Màn hình check-in cá nhân + Bảng Trưởng xe]
    G --> I{Đúng khung giờ check-in?}
    I -- Chưa đến giờ --> J[Không cho check-in]
    I -- Quá giờ --> K[Khóa check-in]
    I -- Đang mở --> L[Ghi nhận check-in]
    H --> M[Theo dõi danh sách xe]
    M --> N[Báo phát sinh nếu có]
    L --> O[Đồng bộ Supabase]
    N --> O
    O --> P[Admin và các máy khác tự cập nhật]
```

## 4. Luồng CBNV tự check-in

```mermaid
flowchart TD
    A[CBNV nhập SĐT] --> B[Hệ thống lọc hồ sơ]
    B --> C[Xem thông tin cá nhân]
    C --> D[Xem các mốc cần check-in]
    D --> E{Mốc hiện tại có mở không?}
    E -- Sớm hơn 10 phút --> F[Chưa được check-in]
    E -- Sau quá 5 phút --> G[Không được check-in]
    E -- Trong khung giờ --> H[Bấm Check-in]
    H --> I[Lưu thời gian check-in]
    I --> J[Đồng bộ dữ liệu chung]
```

## 5. Luồng Trưởng xe

```mermaid
flowchart TD
    A[Trưởng xe nhập SĐT] --> B[Hệ thống nhận diện quyền Trưởng xe]
    B --> C[Hiển thị Bảng Trưởng xe]
    C --> D[Xem danh sách người trên xe]
    D --> E[Xem 5 trạng thái check-in]
    D --> F[Copy SĐT để liên hệ]
    D --> G{Có phát sinh?}
    G -- Không --> H[Tiếp tục theo dõi]
    G -- Có --> I[Chọn loại phát sinh]
    I --> J[Nhập ghi chú / xe đề xuất]
    J --> K[Gửi Admin phê duyệt]
    K --> L[Đồng bộ Supabase]
```

## 6. Các loại phát sinh Trưởng xe có thể báo

| Loại phát sinh | Ý nghĩa | Admin xử lý |
|---|---|---|
| Báo điều chuyển | CBNV cần chuyển sang xe khác | Bấm `Chuyển xe` để đổi `Nhóm_xe` |
| Báo không đi nữa | CBNV không tham gia/không đi xe | Bấm `Không đi nữa`, loại khỏi danh sách xe |
| Phát sinh ăn uống | Thay đổi/thiếu suất/nhu cầu ăn uống | Bấm `Đã xử lý` sau khi xử lý |
| Phát sinh lưu trú | Vấn đề phòng ở/lưu trú | Bấm `Đã xử lý` sau khi xử lý |
| Đến muộn / chưa thấy người | Cần Admin nắm tình hình | Bấm `Đã xử lý` hoặc xử lý thủ công |
| Sức khỏe / cần hỗ trợ | Trường hợp cần hỗ trợ đặc biệt | Bấm `Đã xử lý` sau khi xử lý |
| Phát sinh khác | Tình huống ngoài danh mục | Admin đọc ghi chú và xử lý |

## 7. Luồng Admin xử lý phát sinh

```mermaid
flowchart TD
    A[Admin đăng nhập bằng PIN] --> B[Màn hình Admin chính]
    B --> C{Có phát sinh chờ phê duyệt?}
    C -- Không --> D[Hiển thị danh sách hoạt động check-in]
    C -- Có --> E[Hiển thị khối Chờ Admin phê duyệt]
    E --> F{Loại phát sinh}
    F -- Điều chuyển --> G[Bấm Chuyển xe]
    G --> H[Cập nhật Nhóm_xe]
    F -- Không đi nữa --> I[Bấm Không đi nữa]
    I --> J[Cập nhật Có_đi_xe = false]
    F -- Ăn ở/sức khỏe/khác --> K[Bấm Đã xử lý]
    K --> L[Cập nhật trạng thái Đã xử lý]
    E --> M[Bấm Bỏ báo nếu báo nhầm]
    H --> N[Cập nhật danh sách xe và báo cáo]
    J --> N
    L --> N
    M --> N
    N --> O[Đồng bộ Supabase]
```

## 8. Luồng Admin check-in thủ công

```mermaid
flowchart TD
    A[Admin đăng nhập] --> B[Chọn hoạt động]
    B --> C[Tìm nhân viên]
    C --> D{Thông tin đủ xác thực?}
    D -- Không --> E[Cập nhật SĐT / Phòng ban / Đơn vị / Xe]
    D -- Có --> F[Bấm Check-in]
    F --> G[Xác thực bằng SĐT/Mã NV]
    G --> H[Ghi nhận check-in]
    H --> I[Đồng bộ dữ liệu chung]
```

## 9. Luồng đồng bộ dữ liệu

```mermaid
flowchart TD
    A[Người dùng/Admin thao tác] --> B[Cập nhật dữ liệu trong app]
    B --> C[Lưu local tạm thời]
    B --> D[Gửi lên Supabase]
    D --> E{Gửi thành công?}
    E -- Có --> F[Các máy khác tự tải dữ liệu mới]
    E -- Không --> G[Hiển thị lỗi đồng bộ]
    F --> H[Màn hình cập nhật sau vài giây]
```

## 10. Nguyên tắc an toàn thông tin

- Mỗi lần mở app đều quay về màn hình nhập số điện thoại.
- Không lưu số điện thoại đăng nhập của người trước vào trình duyệt.
- Không dùng chung màn hình Trưởng xe giữa các tab/người dùng.
- Dữ liệu check-in được đồng bộ chung, nhưng quyền xem màn hình được lọc lại theo số điện thoại nhập vào.
- Admin dùng PIN riêng để vào khu vực quản trị.

## 11. Các mốc check-in chính

| Mốc | Người cần check-in | Điều kiện mở |
|---|---|---|
| Xe đi | Người có đi xe | Mở trước giờ sự kiện 10 phút, khóa sau 5 phút |
| Trưa 12/7 | Người có suất ăn | Mở trước giờ sự kiện 10 phút, khóa sau 5 phút |
| Tối 12/7 | Người có suất ăn | Mở trước giờ sự kiện 10 phút, khóa sau 5 phút |
| Trưa 13/7 | Người có suất ăn | Mở trước giờ sự kiện 10 phút, khóa sau 5 phút |
| Xe về HN | Người có đi xe | Mở trước giờ sự kiện 10 phút, khóa sau 5 phút |

