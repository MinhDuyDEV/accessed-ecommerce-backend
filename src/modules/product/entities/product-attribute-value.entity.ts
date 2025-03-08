import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
} from 'typeorm';
import { ProductAttribute } from './product-attribute.entity';
import { ProductVariant } from './product-variant.entity';

@Entity('product_attribute_values')
export class ProductAttributeValue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  value: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  colorCode: string;

  @Column({ default: 0 })
  displayOrder: number;

  @Column({ name: 'attribute_id' })
  attributeId: string;

  @ManyToOne(() => ProductAttribute, (attribute) => attribute.values, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'attribute_id' })
  attribute: ProductAttribute;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToMany(() => ProductVariant, (variant) => variant.attributeValues)
  variants: ProductVariant[];
}
