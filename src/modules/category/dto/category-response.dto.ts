import { Exclude, Expose, Type } from 'class-transformer';

export class CategoryResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  image: string;

  @Expose()
  parentId: string;

  @Expose()
  isActive: boolean;

  @Expose()
  displayOrder: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  @Type(() => CategoryResponseDto)
  children?: CategoryResponseDto[];

  @Expose()
  @Type(() => CategoryResponseDto)
  parent?: CategoryResponseDto;

  @Exclude()
  products?: any[];

  constructor(partial: Partial<CategoryResponseDto>) {
    Object.assign(this, partial);
  }
}
