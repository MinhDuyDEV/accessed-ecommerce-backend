import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { Wishlist } from './entities/wishlist.entity';
import { WishlistItem } from './entities/wishlist-item.entity';
import { Product } from '../product/entities/product.entity';
import { ProductVariant } from '../product/entities/product-variant.entity';
import {
  AddToWishlistDto,
  CreateWishlistDto,
  UpdateWishlistDto,
  WishlistResponseDto,
} from './dto';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Wishlist)
    private wishlistRepository: Repository<Wishlist>,
    @InjectRepository(WishlistItem)
    private wishlistItemRepository: Repository<WishlistItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
  ) {}

  async create(
    userId: string,
    createWishlistDto: CreateWishlistDto,
  ): Promise<WishlistResponseDto> {
    // Create wishlist
    const wishlist = this.wishlistRepository.create({
      userId,
      name: createWishlistDto.name || 'My Wishlist',
    });

    // Save wishlist
    const savedWishlist = await this.wishlistRepository.save(wishlist);

    return plainToInstance(WishlistResponseDto, savedWishlist, {
      excludeExtraneousValues: true,
    });
  }

  async findAll(userId: string): Promise<WishlistResponseDto[]> {
    // Find all wishlists for user
    const wishlists = await this.wishlistRepository.find({
      where: { userId },
      relations: [
        'items',
        'items.product',
        'items.variant',
        'items.product.images',
        'items.variant.images',
      ],
      order: {
        createdAt: 'DESC',
      },
    });

    return wishlists.map((wishlist) =>
      plainToInstance(WishlistResponseDto, wishlist, {
        excludeExtraneousValues: true,
      }),
    );
  }

  async findOne(id: string, userId: string): Promise<WishlistResponseDto> {
    // Find wishlist
    const wishlist = await this.wishlistRepository.findOne({
      where: { id, userId },
      relations: [
        'items',
        'items.product',
        'items.variant',
        'items.product.images',
        'items.variant.images',
      ],
    });

    if (!wishlist) {
      throw new NotFoundException(`Wishlist with id ${id} not found`);
    }

    return plainToInstance(WishlistResponseDto, wishlist, {
      excludeExtraneousValues: true,
    });
  }

  async update(
    id: string,
    userId: string,
    updateWishlistDto: UpdateWishlistDto,
  ): Promise<WishlistResponseDto> {
    // Find wishlist
    const wishlist = await this.wishlistRepository.findOne({
      where: { id, userId },
    });

    if (!wishlist) {
      throw new NotFoundException(`Wishlist with id ${id} not found`);
    }

    // Update wishlist
    if (updateWishlistDto.name) {
      wishlist.name = updateWishlistDto.name;
    }

    // Save wishlist
    const updatedWishlist = await this.wishlistRepository.save(wishlist);

    return this.findOne(updatedWishlist.id, userId);
  }

  async remove(id: string, userId: string): Promise<void> {
    // Find wishlist
    const wishlist = await this.wishlistRepository.findOne({
      where: { id, userId },
    });

    if (!wishlist) {
      throw new NotFoundException(`Wishlist with id ${id} not found`);
    }

    // Delete wishlist
    await this.wishlistRepository.remove(wishlist);
  }

  async addToWishlist(
    wishlistId: string,
    userId: string,
    addToWishlistDto: AddToWishlistDto,
  ): Promise<WishlistResponseDto> {
    const { productId, variantId } = addToWishlistDto;

    // Find wishlist
    const wishlist = await this.wishlistRepository.findOne({
      where: { id: wishlistId, userId },
      relations: ['items'],
    });

    if (!wishlist) {
      throw new NotFoundException(`Wishlist with id ${wishlistId} not found`);
    }

    // Check if product exists
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${productId} not found`);
    }

    // Check if variant exists if provided
    if (variantId) {
      const variant = await this.variantRepository.findOne({
        where: { id: variantId, productId },
      });

      if (!variant) {
        throw new NotFoundException(
          `Variant with id ${variantId} not found for product ${productId}`,
        );
      }
    }

    // Check if item already exists in wishlist
    const existingItem = await this.wishlistItemRepository.findOne({
      where: {
        wishlistId,
        productId,
        variantId: variantId || null,
      },
    });

    if (existingItem) {
      throw new BadRequestException('This item is already in your wishlist');
    }

    // Create new wishlist item
    const wishlistItem = this.wishlistItemRepository.create({
      wishlistId,
      productId,
      variantId,
    });

    // Save wishlist item
    await this.wishlistItemRepository.save(wishlistItem);

    // Return updated wishlist
    return this.findOne(wishlistId, userId);
  }

  async removeFromWishlist(
    wishlistId: string,
    itemId: string,
    userId: string,
  ): Promise<WishlistResponseDto> {
    // Find wishlist
    const wishlist = await this.wishlistRepository.findOne({
      where: { id: wishlistId, userId },
    });

    if (!wishlist) {
      throw new NotFoundException(`Wishlist with id ${wishlistId} not found`);
    }

    // Find wishlist item
    const wishlistItem = await this.wishlistItemRepository.findOne({
      where: { id: itemId, wishlistId },
    });

    if (!wishlistItem) {
      throw new NotFoundException(`Wishlist item with id ${itemId} not found`);
    }

    // Remove wishlist item
    await this.wishlistItemRepository.remove(wishlistItem);

    // Return updated wishlist
    return this.findOne(wishlistId, userId);
  }

  async clearWishlist(
    wishlistId: string,
    userId: string,
  ): Promise<WishlistResponseDto> {
    // Find wishlist
    const wishlist = await this.wishlistRepository.findOne({
      where: { id: wishlistId, userId },
    });

    if (!wishlist) {
      throw new NotFoundException(`Wishlist with id ${wishlistId} not found`);
    }

    // Remove all wishlist items
    await this.wishlistItemRepository.delete({ wishlistId });

    // Return updated wishlist
    return this.findOne(wishlistId, userId);
  }

  async getDefaultWishlist(userId: string): Promise<WishlistResponseDto> {
    // Find default wishlist for user
    let wishlist = await this.wishlistRepository.findOne({
      where: { userId },
      order: { createdAt: 'ASC' },
      relations: [
        'items',
        'items.product',
        'items.variant',
        'items.product.images',
        'items.variant.images',
      ],
    });

    // Create default wishlist if not exists
    if (!wishlist) {
      wishlist = this.wishlistRepository.create({
        userId,
        name: 'My Wishlist',
      });
      wishlist = await this.wishlistRepository.save(wishlist);
    }

    return plainToInstance(WishlistResponseDto, wishlist, {
      excludeExtraneousValues: true,
    });
  }

  async moveItemToWishlist(
    sourceWishlistId: string,
    targetWishlistId: string,
    itemId: string,
    userId: string,
  ): Promise<WishlistResponseDto> {
    // Find source wishlist
    const sourceWishlist = await this.wishlistRepository.findOne({
      where: { id: sourceWishlistId, userId },
    });

    if (!sourceWishlist) {
      throw new NotFoundException(
        `Source wishlist with id ${sourceWishlistId} not found`,
      );
    }

    // Find target wishlist
    const targetWishlist = await this.wishlistRepository.findOne({
      where: { id: targetWishlistId, userId },
    });

    if (!targetWishlist) {
      throw new NotFoundException(
        `Target wishlist with id ${targetWishlistId} not found`,
      );
    }

    // Find wishlist item
    const wishlistItem = await this.wishlistItemRepository.findOne({
      where: { id: itemId, wishlistId: sourceWishlistId },
    });

    if (!wishlistItem) {
      throw new NotFoundException(`Wishlist item with id ${itemId} not found`);
    }

    // Check if item already exists in target wishlist
    const existingItem = await this.wishlistItemRepository.findOne({
      where: {
        wishlistId: targetWishlistId,
        productId: wishlistItem.productId,
        variantId: wishlistItem.variantId,
      },
    });

    if (existingItem) {
      // Remove from source wishlist
      await this.wishlistItemRepository.remove(wishlistItem);
      throw new BadRequestException(
        'This item is already in the target wishlist',
      );
    }

    // Move item to target wishlist
    wishlistItem.wishlistId = targetWishlistId;
    await this.wishlistItemRepository.save(wishlistItem);

    // Return updated target wishlist
    return this.findOne(targetWishlistId, userId);
  }
}
