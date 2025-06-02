import { ApiProperty } from '@nestjs/swagger';

export class FollowerResponseDto {
  @ApiProperty({
    description: 'ID của bản ghi quan hệ theo dõi',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Thông tin người dùng',
    type: 'object',
    properties: {
      id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
      firstName: { type: 'string', example: 'Nguyễn' },
      lastName: { type: 'string', example: 'Văn A' },
      avatar: { type: 'string', example: 'https://example.com/avatar.jpg' },
    },
  })
  user_1: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string;
  };

  @ApiProperty({
    description: 'Thông tin người được theo dõi',
    type: 'object',
    properties: {
      id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
      firstName: { type: 'string', example: 'Nguyễn' },
      lastName: { type: 'string', example: 'Văn A' },
      avatar: { type: 'string', example: 'https://example.com/avatar.jpg' },
    },
  })
  user_2: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string;
  };

  @ApiProperty({
    description:
      'Trạng thái theo dõi (true nếu đang theo dõi, false nếu không theo dõi)',
    example: true,
  })
  isFollow: boolean;

  @ApiProperty({
    description:
      'Trạng thái được theo dõi (true nếu được theo dõi, false nếu không được theo dõi)',
    example: true,
  })
  isFollowed: boolean;

  @ApiProperty({
    description: 'Thời gian tạo bản ghi',
    type: 'string',
    format: 'date-time',
  })
  createdAt: Date;
}

export class FollowerUserDto {
  @ApiProperty({
    description: 'Thông tin người được theo dõi',
    type: 'object',
    properties: {
      id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
      firstName: { type: 'string', example: 'Nguyễn' },
      lastName: { type: 'string', example: 'Văn A' },
      avatar: { type: 'string', example: 'https://example.com/avatar.jpg' },
    },
  })
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string;
  };

  @ApiProperty({
    description: 'Thời gian tạo bản ghi tương ứng',
    type: 'string',
    format: 'date-time',
  })
  createdAt: Date;
}

export class SuggestionFollowerDto {
  @ApiProperty({
    description: 'ID của người dùng được gợi ý theo dõi',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;
  @ApiProperty({
    description: 'Tên người dùng được gợi ý theo dõi',
    example: 'Nguyễn Văn A',
  })
  name: string;

  @ApiProperty({
    description: 'Ảnh đại diện của người dùng được gợi ý theo dõi',
    example: 'https://example.com/avatar.jpg',
  })
  avatar: string;

  @ApiProperty({
    description: 'Mutual friend count of the suggested user',
    example: 'Nguyễn Văn B',
  })
  mutualFriend: string;

  @ApiProperty({
    description: 'Thời gian tạo bản ghi tương ứng',
    example: '2023-10-01T12:00:00Z',
  })
  createdAt: Date;
}
