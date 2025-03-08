import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseFilters,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto, RegisterDto, RefreshTokenDto } from './dto';
import { GetUser } from './decorators/get-user.decorator';
import { User } from '../user/entities/user.entity';
import { JwtExceptionFilter } from './filters/jwt-exception.filter';
import { RefreshTokenExceptionFilter } from './filters/refresh-token-exception.filter';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() _loginDto: LoginDto, @GetUser() user: User) {
    return this.authService.login(user);
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @UseFilters(RefreshTokenExceptionFilter)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseFilters(JwtExceptionFilter)
  async logout(@Body() { refreshToken }: RefreshTokenDto) {
    return this.authService.logout(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseFilters(JwtExceptionFilter)
  async logoutAll(@GetUser('id') userId: string) {
    return this.authService.revokeAllUserTokens(userId);
  }
}
