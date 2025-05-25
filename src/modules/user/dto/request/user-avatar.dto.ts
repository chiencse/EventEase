import { ApiProperty } from '@nestjs/swagger';

import { File as MulterFile } from 'multer';

export class UserAvatarDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Ảnh đại diện của người dùng',
  })
  avatar?: MulterFile;
}
