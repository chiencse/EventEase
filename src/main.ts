import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AccessLogInterceptor } from './common/interceptors/access-log.interceptor';

/**
 * Hàm bootstrap khởi tạo ứng dụng NestJS
 * - Kích hoạt validation
 * - Cấu hình CORS
 * - Tích hợp Swagger
 * - Redirect mặc định từ "/" sang "/docs"
 */
async function bootstrap() {
  // Khởi tạo NestJS app với AppModule
  const app = await NestFactory.create(AppModule);

  // Thêm global prefix cho toàn bộ API
  app.setGlobalPrefix('eventease/api');

  // Global ValidationPipe áp dụng cho toàn bộ request body/query/param
  app.useGlobalPipes(
    new ValidationPipe({
      disableErrorMessages: false, // Cho phép hiển thị message lỗi (true để ẩn message trong production)
      whitelist: false,             // Tự động loại bỏ field không khai báo trong DTO
      transform: true,             // Tự động chuyển đổi kiểu dữ liệu (string -> number/date)
    }),
  );

  // Global interceptors
  app.useGlobalInterceptors(
    new AccessLogInterceptor()
  );

  // Cho phép gọi API từ các origin khác (CORS)
  app.enableCors({
    allowedHeaders: '*',
    origin: '*',
    credentials: true,
  });

  // Cấu hình Swagger (API documentation)
  const config = new DocumentBuilder()
    .setTitle('EventEase API')
    .setDescription('API Documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        in: 'header',
      },
      'JWT-auth', // Tên security để gắn với @ApiBearerAuth('JWT-auth')
    )
    .build();

  // Tạo tài liệu Swagger từ config
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document); // Gắn vào route /docs

  // Redirect mặc định "/" → "/docs" để người dùng vào dễ hơn
  app.getHttpAdapter().get('/', (req, res) => {
    res.redirect('/docs');
  });

  // Khởi động app trên port từ biến môi trường hoặc 5002
  await app.listen(process.env.PORT ?? 5002);
}
bootstrap();
