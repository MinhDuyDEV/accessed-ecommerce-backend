import { User } from 'src/modules/user/entities/user.entity';

export class AuthResponseDto {
  user: Partial<User>;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
