import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    description: 'The name of the product',
    example: 'Laptop',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'The price of the product',
    example: 999.99,
  })
  @IsString()
  price: number;

  @ApiProperty({
    description: 'The status of the product',
    example: true,
  })
  @IsString()
  isActive?: boolean;

  @ApiProperty({
    description: 'The ID of the user who created the product',
  })
  @IsString()
  user_id: string;
}
