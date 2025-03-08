import {
  IsOptional,
  IsString,
  IsUUID,
  IsBoolean,
  IsNumber,
  Min,
} from 'class-validator';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString({ message: 'Category name must be a string' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'Image URL must be a string' })
  image?: string;

  @IsOptional()
  @IsUUID(4, { message: 'Parent ID must be a valid UUID' })
  parentId?: string;

  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  isActive?: boolean;

  @IsOptional()
  @IsNumber({}, { message: 'Display order must be a number' })
  @Min(0, { message: 'Display order must be at least 0' })
  displayOrder?: number;
}
