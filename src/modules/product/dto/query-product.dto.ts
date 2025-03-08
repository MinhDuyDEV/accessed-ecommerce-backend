import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsBoolean,
  Min,
  Max,
  IsArray,
  IsDate,
} from 'class-validator';
import { ProductStatus, ProductType } from '../entities/product.entity';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum ProductSortBy {
  CREATED_AT = 'createdAt',
  PRICE = 'price',
  NAME = 'name',
}

export class QueryProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(ProductStatus, { each: true })
  @IsArray()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  status?: ProductStatus[];

  @IsOptional()
  @IsEnum(ProductType, { each: true })
  @IsArray()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  type?: ProductType[];

  @IsOptional()
  @IsUUID(4, { each: true })
  @IsArray()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  categoryIds?: string[];

  @IsOptional()
  @IsUUID(4)
  brandId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  hasDiscount?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  inStock?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeInactive?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeVariants?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeImages?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeCategories?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeBrand?: boolean;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  createdAfter?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  createdBefore?: Date;

  @IsOptional()
  @IsEnum(ProductSortBy)
  sortBy?: ProductSortBy = ProductSortBy.CREATED_AT;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}
