import { IsNotEmpty, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class AddToCartDto {
  @IsNotEmpty()
  @IsUUID(4)
  productId: string;

  @IsOptional()
  @IsUUID(4)
  variantId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number = 1;
}
