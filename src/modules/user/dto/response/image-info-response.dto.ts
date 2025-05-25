import { ApiProperty } from '@nestjs/swagger';

export class ImageInfoDto {
    @ApiProperty({ example: 'img123' })
    id: string;
  
    @ApiProperty({ example: 'https://s3.amazonaws.com/bucket/image.jpg' })
    link: string;
  
    @ApiProperty({ example: 204800 })
    size: number;
  
    @ApiProperty({ example: 'banner.jpg' })
    filename: string;

    @ApiProperty({ example: false })
    isMain: boolean;
}