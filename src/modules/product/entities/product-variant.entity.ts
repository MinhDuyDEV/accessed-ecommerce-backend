import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { Product } from './product.entity';
import { ProductAttributeValue } from './product-attribute-value.entity';
import { CartItem } from '../../cart/entities/cart-item.entity';
import { WishlistItem } from '../../wishlist/entities/wishlist-item.entity';
import { ProductImage } from './product-image.entity';

@Entity('product_variants')
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ unique: true })
  sku: string;

  @Column({ nullable: true })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  discountPrice: number;

  @Column({ default: 0 })
  quantity: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  weight: number;

  @Column({ nullable: true })
  dimensions: string;

  @ManyToOne(() => Product, (product) => product.variants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToMany(
    () => ProductAttributeValue,
    (attributeValue) => attributeValue.variants,
  )
  @JoinTable({
    name: 'product_variant_attribute_values',
    joinColumn: { name: 'variant_id', referencedColumnName: 'id' },
    inverseJoinColumn: {
      name: 'attribute_value_id',
      referencedColumnName: 'id',
    },
  })
  attributeValues: ProductAttributeValue[];

  @OneToMany(() => ProductImage, (image) => image.variant)
  images: ProductImage[];

  @OneToMany(() => CartItem, (cartItem) => cartItem.variant)
  cartItems: CartItem[];

  @OneToMany(() => WishlistItem, (wishlistItem) => wishlistItem.variant)
  wishlistItems: WishlistItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Helper methods
  getAttributeDisplay(): string {
    if (!this.attributeValues || this.attributeValues.length === 0) {
      return '';
    }

    return this.attributeValues
      .map((av) => `${av.attribute.name}: ${av.value}`)
      .join(', ');
  }
}
