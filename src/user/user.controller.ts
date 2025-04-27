import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/Login.dto';
import { AuthGuard } from 'src/Guards/AppGuard';

@Controller('user')
@ApiTags('User')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('login')
  login(@Body() createUserDto: LoginDto) {
    return this.userService.login(createUserDto);
  }

  // @ApiBearerAuth('JWT-auth')
  // @UseGuards(AuthGuard)
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  findAll() {
    return this.userService.findAll();
  }
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
