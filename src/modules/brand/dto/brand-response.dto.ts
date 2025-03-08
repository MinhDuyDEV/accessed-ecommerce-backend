import { Exclude, Expose } from 'class-transformer';

export class BrandResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  logo: string;

  @Expose()
  website: string;

  @Expose()
  isActive: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Exclude()
  products?: any[];

  constructor(partial: Partial<BrandResponseDto>) {
    Object.assign(this, partial);
  }
}
