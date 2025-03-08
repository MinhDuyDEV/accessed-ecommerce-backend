import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { RefreshToken } from './entities/refresh-token.entity';
import { UserService } from '../user/user.service';
import { User } from '../user/entities/user.entity';
import { RegisterDto, RefreshTokenDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      return null;
    }

    const isPasswordValid = await user.verifyPassword(password);

    if (!isPasswordValid) {
      return null;
    }

    // Create a copy of user and remove password
    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;

    return userWithoutPassword;
  }

  async login(user: any) {
    return this.generateTokens(user);
  }

  async register(registerDto: RegisterDto) {
    // Check if email already exists
    const existingUser = await this.userService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new BadRequestException('Email is already in use');
    }

    // Check if username already exists
    const existingUsername = await this.userService.findByUsername(
      registerDto.username,
    );
    if (existingUsername) {
      throw new BadRequestException('Username is already in use');
    }

    // Create new user
    const newUser = await this.userService.create(registerDto);

    // Create a copy of user and remove password
    const userWithoutPassword = { ...newUser };
    delete userWithoutPassword.password;

    // Generate tokens
    return this.generateTokens(userWithoutPassword);
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    // Find refresh token in database
    const tokenEntity = await this.validateRefreshToken(refreshToken);

    if (!tokenEntity) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (tokenEntity.isExpired()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    if (tokenEntity.isRevoked || tokenEntity.isUsed) {
      throw new UnauthorizedException('Refresh token is no longer valid');
    }

    // Get user information
    const user = tokenEntity.user;

    // Rotate refresh token (create new token and mark old token as used)
    await this.rotateRefreshToken(tokenEntity);

    // Create a copy of user and remove password
    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;

    // Generate new tokens
    return this.generateTokens(userWithoutPassword);
  }

  async logout(refreshToken: string) {
    return this.revokeRefreshToken(refreshToken);
  }

  private async generateTokens(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };

    // Generate access token
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION'),
    });

    // Generate refresh token
    const refreshTokenEntity = await this.generateRefreshToken(user);

    return {
      user,
      accessToken,
      refreshToken: refreshTokenEntity.token,
      expiresIn: this.getAccessTokenExpiration(),
    };
  }

  private getAccessTokenExpiration(): number {
    const expiration = this.configService.get<string>(
      'JWT_ACCESS_EXPIRATION',
      '15m',
    );

    // Convert expiration time to seconds
    if (expiration.endsWith('m')) {
      return parseInt(expiration) * 60;
    } else if (expiration.endsWith('h')) {
      return parseInt(expiration) * 60 * 60;
    } else if (expiration.endsWith('d')) {
      return parseInt(expiration) * 60 * 60 * 24;
    }

    return 900; // Default 15 minutes (900 seconds)
  }

  async generateRefreshToken(user: User): Promise<RefreshToken> {
    // Generate random token
    const token = randomBytes(64).toString('hex');

    // Calculate expiration time based on configuration
    const expiresAt = new Date();
    const expirationString = this.configService.get<string>(
      'JWT_REFRESH_EXPIRATION',
      '7d',
    );

    // Convert expiration time
    if (expirationString.endsWith('d')) {
      expiresAt.setDate(expiresAt.getDate() + parseInt(expirationString));
    } else if (expirationString.endsWith('h')) {
      expiresAt.setHours(expiresAt.getHours() + parseInt(expirationString));
    } else if (expirationString.endsWith('m')) {
      expiresAt.setMinutes(expiresAt.getMinutes() + parseInt(expirationString));
    } else {
      // Default 7 days
      expiresAt.setDate(expiresAt.getDate() + 7);
    }

    // Create new refresh token
    const refreshToken = new RefreshToken();
    refreshToken.token = token;
    refreshToken.userId = user.id;
    refreshToken.expiresAt = expiresAt;
    refreshToken.isRevoked = false;
    refreshToken.isUsed = false;

    // Save to database
    return this.refreshTokenRepository.save(refreshToken);
  }

  async validateRefreshToken(token: string): Promise<RefreshToken | null> {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token },
      relations: ['user'],
    });

    if (!refreshToken) {
      return null;
    }

    return refreshToken;
  }

  async rotateRefreshToken(oldToken: RefreshToken): Promise<RefreshToken> {
    // Mark old token as used
    oldToken.isUsed = true;
    await this.refreshTokenRepository.save(oldToken);

    // Generate new token
    return this.generateRefreshToken(oldToken.user);
  }

  async revokeRefreshToken(token: string): Promise<boolean> {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token },
    });

    if (!refreshToken) {
      return false;
    }

    refreshToken.isRevoked = true;
    await this.refreshTokenRepository.save(refreshToken);
    return true;
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
  }

  async cleanupExpiredTokens(): Promise<void> {
    const now = new Date();
    await this.refreshTokenRepository.delete({
      expiresAt: now,
    });
  }
}
