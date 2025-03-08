import { IsOptional, IsString } from 'class-validator';

export class CreateWishlistDto {
  @IsOptional()
  @IsString()
  name?: string;
}
