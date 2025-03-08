import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { ProductStatus, ProductType } from '../entities/product.entity';
import { CategoryResponseDto } from '../../category/dto/category-response.dto';
import { BrandResponseDto } from '../../brand/dto/brand-response.dto';

export class ProductImageResponseDto {
  @Expose()
  id: string;

  @Expose()
  url: string;

  @Expose()
  alt: string;

  @Expose()
  isDefault: boolean;

  @Expose()
  displayOrder: number;

  constructor(partial: Partial<ProductImageResponseDto>) {
    Object.assign(this, partial);
  }
}

export class ProductAttributeValueResponseDto {
  @Expose()
  id: string;

  @Expose()
  value: string;

  @Expose()
  attributeId: string;

  @Expose()
  attributeName: string;

  @Expose()
  colorCode: string;

  constructor(partial: Partial<ProductAttributeValueResponseDto>) {
    Object.assign(this, partial);
  }
}

export class ProductVariantResponseDto {
  @Expose()
  id: string;

  @Expose()
  sku: string;

  @Expose()
  name: string;

  @Expose()
  price: number;

  @Expose()
  discountPrice: number;

  @Expose()
  quantity: number;

  @Expose()
  isActive: boolean;

  @Expose()
  weight: number;

  @Expose()
  dimensions: string;

  @Expose()
  @Type(() => ProductAttributeValueResponseDto)
  attributeValues: ProductAttributeValueResponseDto[];

  @Expose()
  @Type(() => ProductImageResponseDto)
  images: ProductImageResponseDto[];

  constructor(partial: Partial<ProductVariantResponseDto>) {
    Object.assign(this, partial);
  }
}

export class ProductResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  type: ProductType;

  @Expose()
  price: number;

  @Expose()
  discountPrice: number;

  @Expose()
  sku: string;

  @Expose()
  quantity: number;

  @Expose()
  status: ProductStatus;

  @Expose()
  weight: number;

  @Expose()
  dimensions: string;

  @Expose()
  @Transform(({ value }) => value || null)
  brandId: string | null;

  @Expose()
  @Type(() => BrandResponseDto)
  @Transform(({ value }) => value || null)
  brand: BrandResponseDto | null;

  @Expose()
  @Type(() => CategoryResponseDto)
  categories: CategoryResponseDto[];

  @Expose()
  @Type(() => ProductVariantResponseDto)
  variants: ProductVariantResponseDto[];

  @Expose()
  @Type(() => ProductImageResponseDto)
  images: ProductImageResponseDto[];

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  @Transform(({ obj }) => {
    if (obj.discountPrice && obj.discountPrice < obj.price) {
      return Math.round(((obj.price - obj.discountPrice) / obj.price) * 100);
    }
    return 0;
  })
  discountPercentage: number;

  @Expose()
  @Transform(({ obj }) => obj.getDefaultImage())
  defaultImage: string | null;

  @Expose()
  @Transform(({ obj }) => obj.isInStock())
  inStock: boolean;

  @Exclude()
  cartItems: any[];

  @Exclude()
  wishlistItems: any[];

  constructor(partial: Partial<ProductResponseDto>) {
    Object.assign(this, partial);
  }
}
