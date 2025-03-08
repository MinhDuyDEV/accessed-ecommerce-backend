import {
  IsOptional,
  IsString,
  IsBoolean,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum CategorySortBy {
  CREATED_AT = 'createdAt',
  NAME = 'name',
  DISPLAY_ORDER = 'displayOrder',
}

export class QueryCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUUID(4, { message: 'Parent ID must be a valid UUID' })
  parentId?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeInactive?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeChildren?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeProducts?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  onlyRootCategories?: boolean;

  @IsOptional()
  @IsEnum(CategorySortBy)
  sortBy?: CategorySortBy = CategorySortBy.DISPLAY_ORDER;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.ASC;

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
