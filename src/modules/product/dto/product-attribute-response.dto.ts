import { Expose, Type } from 'class-transformer';

export class AttributeValueResponseDto {
  @Expose()
  id: string;

  @Expose()
  value: string;

  @Expose()
  description: string;

  @Expose()
  colorCode: string;

  @Expose()
  displayOrder: number;

  constructor(partial: Partial<AttributeValueResponseDto>) {
    Object.assign(this, partial);
  }
}

export class ProductAttributeResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  isActive: boolean;

  @Expose()
  displayOrder: number;

  @Expose()
  @Type(() => AttributeValueResponseDto)
  values: AttributeValueResponseDto[];

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<ProductAttributeResponseDto>) {
    Object.assign(this, partial);
  }
}
