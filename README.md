<div align="center">
  <h1 align="center">🎬 CINESCOPE - YOUR MOVIE UNIVERSE</h1>
  <p align="center">
    <b>Nền tảng xem phim trực tuyến hiện đại được xây dựng với React, TypeScript và Firebase.</b>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/React-18.x-blue?style=for-the-badge&logo=react" alt="React">
    <img src="https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript" alt="TypeScript">
    <img src="https://img.shields.io/badge/Firebase-Auth-orange?style=for-the-badge&logo=firebase" alt="Firebase">
    <img src="https://img.shields.io/badge/Vite-Fast-yellow?style=for-the-badge&logo=vite" alt="Vite">
  </p>
</div>

---

## 🌟 Giới thiệu dự án
**CineScope** là một ứng dụng web xem phim và khám phá điện ảnh quy mô lớn, cung cấp hàng nghìn bộ phim độc lập với hình ảnh poster & backdrop sắc nét, đồng bộ trực tiếp từ dataset TMDB trên Hugging Face. Dự án được thiết kế với giao diện tối (Dark Cinema Theme) sang trọng, mang lại trải nghiệm mượt mà không thua kém các nền tảng streaming chuyên nghiệp.

---

## 🚀 Tính năng nổi bật

- 🎥 **Kho dữ liệu khổng lồ:** Đồng bộ hóa gần 4.000 bộ phim độc lập, chuẩn xác kèm poster và backdrop độc lập[cite: 1].
- 🇻🇳 **Tự động dịch mô tả:** Tích hợp script quét và tự động dịch nội dung mô tả (`overview`) sang tiếng Việt nhưng vẫn giữ nguyên tiêu đề gốc quốc tế.
- 🔐 **Bảo mật & Xác thực Firebase:** Quản lý tài khoản người dùng an toàn (Đăng nhập, Đăng ký, Ghi nhớ phiên đăng nhập, Popup thông báo giữa màn hình). Yêu cầu đăng nhập trước khi xem phim.
- 🎞️ **Hiệu ứng Banner mượt mà:** Tự động chuyển động lướt (slide) từ phải sang trái sau mỗi 3 giây cho banner nổi bật hôm nay kèm thiết kế thumbnail tinh tế.
- 🔍 **Tìm kiếm & Bộ lọc thông minh:** Hỗ trợ tìm kiếm nhanh tên phim, diễn viên, năm phát hành, lọc theo thể loại và quản lý danh sách yêu thích cá nhân ("Danh sách của tôi").

---

## 🛠️ Công nghệ sử dụng

- **Frontend:** React, TypeScript, Vite, CSS3 (Keyframes Animation).
- **Backend & Authentication:** Firebase Auth (Local & Session Persistence).
- **Data & Tooling:** Hugging Face Dataset (`lavinal712/tmdb-poster`), Node.js scripts.

---

## ⚙️ Hướng dẫn cài đặt & Chạy dự án

1. **Clone repository về máy:**
   ```bash
   git clone [https://github.com/hainam-it/cinescope.git](https://github.com/hainam-it/cinescope.git)
   cd cinescope-frontend