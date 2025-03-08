import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { IsArray, IsOptional, IsUUID } from 'class-validator';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  removeCategoryIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  removeVariantIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  removeImageIds?: string[];
}
