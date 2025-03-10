import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { User } from './modules/user/entities/user.entity';
import { RefreshToken } from './modules/auth/entities/refresh-token.entity';
import { ProductModule } from './modules/product/product.module';
import { CartModule } from './modules/cart/cart.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { CategoryModule } from './modules/category/category.module';
import { BrandModule } from './modules/brand/brand.module';
import { BannerModule } from './modules/banner/banner.module';
import { Category } from './modules/category/entities/category.entity';
import { Brand } from './modules/brand/entities/brand.entity';
import { Product } from './modules/product/entities/product.entity';
import { ProductVariant } from './modules/product/entities/product-variant.entity';
import { ProductAttribute } from './modules/product/entities/product-attribute.entity';
import { ProductAttributeValue } from './modules/product/entities/product-attribute-value.entity';
import { ProductImage } from './modules/product/entities/product-image.entity';
import { Cart } from './modules/cart/entities/cart.entity';
import { CartItem } from './modules/cart/entities/cart-item.entity';
import { Wishlist } from './modules/wishlist/entities/wishlist.entity';
import { WishlistItem } from './modules/wishlist/entities/wishlist-item.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'password'),
        database: configService.get('DB_DATABASE', 'ecommerce'),
        entities: [
          User,
          RefreshToken,
          Category,
          Brand,
          Product,
          ProductVariant,
          ProductAttribute,
          ProductAttributeValue,
          ProductImage,
          Cart,
          CartItem,
          Wishlist,
          WishlistItem,
        ],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: false,
      }),
    }),
    UserModule,
    AuthModule,
    ProductModule,
    CartModule,
    WishlistModule,
    CategoryModule,
    BrandModule,
    BannerModule,
  ],
})
export class AppModule {}
