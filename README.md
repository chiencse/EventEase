[![Phiên bản](https://img.shields.io/github/v/release/chiencse/sample_nestjs?style=flat-square)](https://github.com/chiencse/sample_nestjs/releases)

## Mô tả

Đây là repository khởi đầu cho framework [Nest](https://github.com/nestjs/nest) sử dụng TypeScript.

## Cấu trúc Dự án

```
├── src/                                # Thư mục chứa mã nguồn
│   ├── modules/                        # Các module chức năng
│   │   ├── event/                     # Module quản lý sự kiện
│   │   ├── participated_event/        # Module quản lý sự kiện đã tham gia
│   │   ├── favourite_event/           # Module quản lý sự kiện yêu thích
│   │   └── tracked_event/             # Module quản lý sự kiện đang theo dõi
│   │
│   ├── common/                        # Thư mục chứa các thành phần dùng chung
│   │   ├── entities/                  # Các entity dùng chung
│   │   ├── interceptors/              # Các interceptor
│   │   ├── s3/                        # Cấu hình và tiện ích AWS S3
│   │   ├── utils/                     # Các hàm tiện ích
│   │   ├── interfaces/                # Các interface TypeScript
│   │   ├── pipes/                     # Các custom pipe
│   │   ├── exceptions/                # Các custom exception
│   │   └── guards/                    # Các guard bảo mật
│   │
│   ├── database/                      # Cấu hình database
│   │   └── ormconfig.ts              # Cấu hình TypeORM
│   │
│   ├── app.module.ts                  # Module gốc của ứng dụng
│   ├── main.ts                       # Điểm khởi đầu của ứng dụng
│   └── app.service.ts                # Service gốc
│
├── test/                              # Thư mục chứa các file test
├── dist/                              # Thư mục chứa code đã biên dịch
├── node_modules/                      # Thư mục chứa các dependencies
├── .github/                           # Cấu hình GitHub
├── docker-compose.yml                 # Cấu hình Docker Compose
├── Dockerfile                        # Cấu hình Docker
└── package.json                      # Thông tin dự án và dependencies
```

### Giải thích Cấu trúc Thư mục

- **src/**: Chứa toàn bộ mã nguồn của ứng dụng
  - **modules/**: Chứa các module chức năng của ứng dụng
    - **event/**: Module quản lý thông tin và hoạt động của sự kiện
    - **participated_event/**: Module quản lý các sự kiện mà người dùng đã tham gia
    - **favourite_event/**: Module quản lý các sự kiện được người dùng đánh dấu yêu thích
    - **tracked_event/**: Module quản lý các sự kiện mà người dùng đang theo dõi

  - **common/**: Chứa các thành phần dùng chung trong toàn bộ ứng dụng
    - **entities/**: Chứa các entity được sử dụng chung giữa nhiều module
    - **interceptors/**: Chứa các interceptor để xử lý request/response
    - **s3/**: Chứa cấu hình và các tiện ích làm việc với AWS S3
    - **utils/**: Chứa các hàm tiện ích dùng chung
    - **interfaces/**: Chứa các interface TypeScript định nghĩa kiểu dữ liệu
    - **pipes/**: Chứa các custom pipe để xử lý và validate dữ liệu
    - **exceptions/**: Chứa các custom exception để xử lý lỗi
    - **guards/**: Chứa các guard để bảo vệ các route và endpoint

  - **database/**: Chứa cấu hình và quản lý database
    - **ormconfig.ts**: File cấu hình TypeORM cho kết nối database

  - **app.module.ts**: Module gốc của ứng dụng, nơi đăng ký tất cả các module khác
  - **main.ts**: Điểm khởi đầu của ứng dụng, nơi khởi tạo ứng dụng NestJS
  - **app.controller.ts**: Controller gốc của ứng dụng
  - **app.service.ts**: Service gốc của ứng dụng

- **test/**: Chứa các file test cho ứng dụng
- **dist/**: Thư mục chứa code đã được biên dịch
- **node_modules/**: Chứa các dependencies của dự án
- **.github/**: Chứa các cấu hình cho GitHub như workflows, templates
- **docker-compose.yml**: Cấu hình Docker Compose cho môi trường phát triển
- **Dockerfile**: Cấu hình để build Docker image
- **package.json**: Chứa thông tin dự án và danh sách dependencies

## Cài đặt Dự án

```bash
$ npm install
```

## Biên dịch và Chạy Dự án

```bash
# Môi trường phát triển
$ npm run start

# Chế độ theo dõi thay đổi
$ npm run start:dev

# Môi trường sản phẩm
$ npm run start:prod
```

## Chạy Tests

```bash
# Unit tests
$ npm run test

# End-to-end tests
$ npm run test:e2e

# Kiểm tra độ phủ test
$ npm run test:cov
```

## Triển khai

Khi bạn đã sẵn sàng để triển khai ứng dụng NestJS lên môi trường sản phẩm, có một số bước quan trọng để đảm bảo ứng dụng chạy hiệu quả nhất. Xem thêm tại [tài liệu triển khai](https://docs.nestjs.com/deployment).

Nếu bạn đang tìm kiếm một nền tảng đám mây để triển khai ứng dụng NestJS, hãy xem [Mau](https://mau.nestjs.com), nền tảng chính thức của chúng tôi để triển khai ứng dụng NestJS trên AWS. Mau giúp việc triển khai trở nên đơn giản và nhanh chóng, chỉ cần vài bước:

```bash
$ npm install -g mau
$ mau deploy
```

Với Mau, bạn có thể triển khai ứng dụng chỉ với vài cú nhấp chuột, cho phép bạn tập trung vào việc xây dựng tính năng thay vì quản lý cơ sở hạ tầng.

## Tài nguyên

Một số tài nguyên hữu ích khi làm việc với NestJS:

- Truy cập [Tài liệu NestJS](https://docs.nestjs.com) để tìm hiểu thêm về framework.
- Để được hỗ trợ và giải đáp thắc mắc, hãy ghé thăm [kênh Discord](https://discord.gg/G7Qnnhy) của chúng tôi.
- Để học sâu hơn và có thêm kinh nghiệm thực tế, hãy xem các [khóa học video](https://courses.nestjs.com/) chính thức của chúng tôi.
- Triển khai ứng dụng lên AWS với sự hỗ trợ của [NestJS Mau](https://mau.nestjs.com) chỉ với vài cú nhấp chuột.
- Trực quan hóa đồ thị ứng dụng và tương tác với ứng dụng NestJS theo thời gian thực bằng [NestJS Devtools](https://devtools.nestjs.com).
- Cần hỗ trợ cho dự án của bạn (bán thời gian đến toàn thời gian)? Hãy xem [hỗ trợ doanh nghiệp](https://enterprise.nestjs.com) chính thức của chúng tôi.
- Để cập nhật tin tức mới nhất, theo dõi chúng tôi trên [X](https://x.com/nestframework) và [LinkedIn](https://linkedin.com/company/nestjs).
- Đang tìm việc hoặc có việc cần tuyển? Hãy xem [bảng tin tuyển dụng](https://jobs.nestjs.com) chính thức của chúng tôi.

## Hỗ trợ

Nest là một dự án mã nguồn mở được cấp phép MIT. Dự án phát triển nhờ vào sự tài trợ và hỗ trợ từ những người ủng hộ tuyệt vời. Nếu bạn muốn tham gia cùng họ, vui lòng [đọc thêm tại đây](https://docs.nestjs.com/support).

## Liên hệ

- Tác giả - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## Giấy phép

Nest được cấp phép theo [MIT](https://github.com/nestjs/nest/blob/master/LICENSE).