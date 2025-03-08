import { Category } from 'src/modules/category/entities/category.entity';
import { Product } from 'src/modules/product/entities/product.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';

export enum BannerType {
  HERO = 'hero',
  PROMOTION = 'promotion',
  CATEGORY = 'category',
  BRAND = 'brand',
  SEASONAL = 'seasonal',
}

export enum BannerPosition {
  HOME_TOP = 'home_top',
  HOME_MIDDLE = 'home_middle',
  HOME_BOTTOM = 'home_bottom',
  CATEGORY_PAGE = 'category_page',
  PRODUCT_PAGE = 'product_page',
}

@Entity('banners')
export class Banner {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  subtitle: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  imageUrl: string;

  @Column({ nullable: true })
  mobileImageUrl: string;

  @Column({ nullable: true })
  buttonText: string;

  @Column({ nullable: true })
  buttonLink: string;

  @Column({ type: 'enum', enum: BannerType, default: BannerType.PROMOTION })
  type: BannerType;

  @Column({
    type: 'enum',
    enum: BannerPosition,
    default: BannerPosition.HOME_TOP,
  })
  position: BannerPosition;

  @Column({ default: 0 })
  displayOrder: number;

  @Column({ type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isDefault: boolean;

  @ManyToMany(() => Product)
  @JoinTable({
    name: 'banner_products',
    joinColumn: { name: 'banner_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'product_id', referencedColumnName: 'id' },
  })
  products: Product[];

  @ManyToMany(() => Category)
  @JoinTable({
    name: 'banner_categories',
    joinColumn: { name: 'banner_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' },
  })
  categories: Category[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Helper methods
  isExpired(): boolean {
    if (!this.endDate) return false;
    return new Date() > this.endDate;
  }

  isActiveNow(): boolean {
    if (!this.isActive) return false;
    if (this.isExpired()) return false;
    if (this.startDate && new Date() < this.startDate) return false;
    return true;
  }
}
