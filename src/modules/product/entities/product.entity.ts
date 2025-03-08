import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Brand } from '../../brand/entities/brand.entity';
import { Category } from '../../category/entities/category.entity';
import { ProductVariant } from './product-variant.entity';
import { ProductImage } from './product-image.entity';
import { CartItem } from 'src/modules/cart/entities/cart-item.entity';
import { WishlistItem } from 'src/modules/wishlist/entities/wishlist-item.entity';

export enum ProductStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  OUT_OF_STOCK = 'out_of_stock',
  DISCONTINUED = 'discontinued',
}

export enum ProductType {
  SIMPLE = 'simple',
  VARIABLE = 'variable',
  DIGITAL = 'digital',
  SERVICE = 'service',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ProductType, default: ProductType.SIMPLE })
  type: ProductType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({
    name: 'discount_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  discountPrice: number;

  @Column({ unique: true, nullable: true })
  sku: string;

  @Column({ default: 0 })
  quantity: number;

  @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.DRAFT })
  status: ProductStatus;

  @Column({ nullable: true })
  weight: number;

  @Column({ nullable: true })
  dimensions: string;

  @Column({ name: 'brand_id', nullable: true })
  brandId: string;

  @ManyToOne(() => Brand, (brand) => brand.products, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'brand_id' })
  brand: Brand;

  @ManyToMany(() => Category, (category) => category.products)
  @JoinTable({
    name: 'product_categories',
    joinColumn: { name: 'product_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' },
  })
  categories: Category[];

  @OneToMany(() => ProductVariant, (variant) => variant.product, {
    cascade: true,
  })
  variants: ProductVariant[];

  @OneToMany(() => ProductImage, (image) => image.product, { cascade: true })
  images: ProductImage[];

  @OneToMany(() => CartItem, (cartItem) => cartItem.product)
  cartItems: CartItem[];

  @OneToMany(() => WishlistItem, (wishlistItem) => wishlistItem.product)
  wishlistItems: WishlistItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Helper methods
  hasVariants(): boolean {
    return (
      this.type === ProductType.VARIABLE &&
      this.variants &&
      this.variants.length > 0
    );
  }

  getDefaultImage(): string | null {
    if (this.images && this.images.length > 0) {
      const defaultImage = this.images.find((img) => img.isDefault);
      return defaultImage ? defaultImage.url : this.images[0].url;
    }
    return null;
  }

  getLowestPrice(): number {
    if (this.hasVariants()) {
      const prices = this.variants
        .map((v) => v.discountPrice || v.price || 0)
        .filter((p) => p > 0);
      return prices.length > 0
        ? Math.min(...prices)
        : this.discountPrice || this.price || 0;
    }
    return this.discountPrice || this.price || 0;
  }

  getHighestPrice(): number {
    if (this.hasVariants()) {
      const prices = this.variants
        .map((v) => v.discountPrice || v.price || 0)
        .filter((p) => p > 0);
      return prices.length > 0
        ? Math.max(...prices)
        : this.discountPrice || this.price || 0;
    }
    return this.discountPrice || this.price || 0;
  }

  getTotalStock(): number {
    if (this.hasVariants()) {
      return this.variants.reduce((sum, variant) => sum + variant.quantity, 0);
    }
    return this.quantity;
  }

  isInStock(): boolean {
    return this.getTotalStock() > 0;
  }
}
