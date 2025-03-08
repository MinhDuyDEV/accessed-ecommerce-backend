import { IsOptional, IsString, IsBoolean, IsUrl } from 'class-validator';

export class UpdateBrandDto {
  @IsOptional()
  @IsString({ message: 'Brand name must be a string' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'Logo URL must be a string' })
  @IsUrl({}, { message: 'Logo must be a valid URL' })
  logo?: string;

  @IsOptional()
  @IsString({ message: 'Website URL must be a string' })
  @IsUrl({}, { message: 'Website must be a valid URL' })
  website?: string;

  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  isActive?: boolean;
}
