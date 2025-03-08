import { Expose, Transform, Type } from 'class-transformer';
import { ProductResponseDto } from '../../product/dto/product-response.dto';
import { ProductVariantResponseDto } from '../../product/dto/product-response.dto';

export class CartItemResponseDto {
  @Expose()
  id: string;

  @Expose()
  quantity: number;

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
    const price = obj.variant
      ? obj.variant.discountPrice || obj.variant.price || 0
      : obj.product.discountPrice || obj.product.price || 0;
    return price * obj.quantity;
  })
  subtotal: number;

  constructor(partial: Partial<CartItemResponseDto>) {
    Object.assign(this, partial);
  }
}

export class CartResponseDto {
  @Expose()
  id: string;

  @Expose()
  @Type(() => CartItemResponseDto)
  items: CartItemResponseDto[];

  @Expose()
  @Transform(({ obj }) => {
    if (!obj.items) return 0;
    return obj.items.reduce((sum, item) => sum + item.quantity, 0);
  })
  totalItems: number;

  @Expose()
  @Transform(({ obj }) => {
    if (!obj.items) return 0;
    return obj.items.reduce((sum, item) => {
      const price = item.variant
        ? item.variant.discountPrice || item.variant.price || 0
        : item.product.discountPrice || item.product.price || 0;
      return sum + price * item.quantity;
    }, 0);
  })
  totalPrice: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<CartResponseDto>) {
    Object.assign(this, partial);
  }
}
