import { Expose, Transform, Type } from 'class-transformer';
import { ProductResponseDto } from '../../product/dto/product-response.dto';
import { ProductVariantResponseDto } from '../../product/dto/product-response.dto';

export class WishlistItemResponseDto {
  @Expose()
  id: string;

  @Expose()
  @Type(() => ProductResponseDto)
  product: ProductResponseDto;

  @Expose()
  @Type(() => ProductVariantResponseDto)
  @Transform(({ value }) => value || null)
  variant: ProductVariantResponseDto | null;

  @Expose()
  @Transform(({ obj }) => {
    if (obj.variant) {
      return obj.variant.discountPrice || obj.variant.price || 0;
    }
    return obj.product.discountPrice || obj.product.price || 0;
  })
  price: number;

  @Expose()
  @Transform(({ obj }) => {
    if (obj.variant) {
      return obj.variant.quantity > 0;
    }
    return obj.product.isInStock();
  })
  inStock: boolean;

  @Expose()
  addedAt: Date;

  constructor(partial: Partial<WishlistItemResponseDto>) {
    Object.assign(this, partial);
  }
}

export class WishlistResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  @Type(() => WishlistItemResponseDto)
  items: WishlistItemResponseDto[];

  @Expose()
  @Transform(({ obj }) => obj.items?.length || 0)
  totalItems: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<WishlistResponseDto>) {
    Object.assign(this, partial);
  }
}
