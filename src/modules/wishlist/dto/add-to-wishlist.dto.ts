import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class AddToWishlistDto {
  @IsNotEmpty()
  @IsUUID(4)
  productId: string;

  @IsOptional()
  @IsUUID(4)
  variantId?: string;
}
