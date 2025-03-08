import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../product/entities/product.entity';
import { ProductVariant } from '../product/entities/product-variant.entity';
import { AddToCartDto, CartResponseDto, UpdateCartItemDto } from './dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
  ) {}

  async getCart(userId: string): Promise<CartResponseDto> {
    // Find or create cart for user
    let cart = await this.cartRepository.findOne({
      where: { userId },
      relations: [
        'items',
        'items.product',
        'items.variant',
        'items.product.images',
        'items.variant.images',
      ],
    });

    if (!cart) {
      cart = this.cartRepository.create({ userId });
      cart = await this.cartRepository.save(cart);
    }

    return plainToInstance(CartResponseDto, cart, {
      excludeExtraneousValues: true,
    });
  }

  async getGuestCart(cartId: string): Promise<CartResponseDto> {
    // Find cart for guest
    const cart = await this.cartRepository.findOne({
      where: { id: cartId },
      relations: [
        'items',
        'items.product',
        'items.variant',
        'items.product.images',
        'items.variant.images',
      ],
    });

    if (!cart) {
      throw new NotFoundException(`Cart with id ${cartId} not found`);
    }

    return plainToInstance(CartResponseDto, cart, {
      excludeExtraneousValues: true,
    });
  }

  async createGuestCart(): Promise<CartResponseDto> {
    // Create cart for guest
    const cart = this.cartRepository.create();
    const savedCart = await this.cartRepository.save(cart);

    return plainToInstance(CartResponseDto, savedCart, {
      excludeExtraneousValues: true,
    });
  }

  async addToCart(
    cartId: string,
    addToCartDto: AddToCartDto,
  ): Promise<CartResponseDto> {
    const { productId, variantId, quantity } = addToCartDto;

    // Find cart
    const cart = await this.cartRepository.findOne({
      where: { id: cartId },
      relations: ['items'],
    });

    if (!cart) {
      throw new NotFoundException(`Cart with id ${cartId} not found`);
    }

    // Check if product exists
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${productId} not found`);
    }

    // Check if variant exists if provided
    let variant = null;
    if (variantId) {
      variant = await this.variantRepository.findOne({
        where: { id: variantId, productId },
      });

      if (!variant) {
        throw new NotFoundException(
          `Variant with id ${variantId} not found for product ${productId}`,
        );
      }
    }

    // Check if product is in stock
    if (variant) {
      if (variant.quantity < quantity) {
        throw new BadRequestException(
          `Not enough stock for variant ${variantId}. Available: ${variant.quantity}`,
        );
      }
    } else {
      if (product.quantity < quantity) {
        throw new BadRequestException(
          `Not enough stock for product ${productId}. Available: ${product.quantity}`,
        );
      }
    }

    // Check if item already exists in cart
    let cartItem = await this.cartItemRepository.findOne({
      where: {
        cartId,
        productId,
        variantId: variantId || null,
      },
    });

    if (cartItem) {
      // Update quantity
      cartItem.quantity += quantity;
      await this.cartItemRepository.save(cartItem);
    } else {
      // Create new cart item
      cartItem = this.cartItemRepository.create({
        cartId,
        productId,
        variantId,
        quantity,
      });
      await this.cartItemRepository.save(cartItem);
    }

    // Return updated cart
    return this.getCartById(cartId);
  }

  async updateCartItem(
    cartId: string,
    itemId: string,
    updateCartItemDto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    const { quantity } = updateCartItemDto;

    // Find cart
    const cart = await this.cartRepository.findOne({
      where: { id: cartId },
    });

    if (!cart) {
      throw new NotFoundException(`Cart with id ${cartId} not found`);
    }

    // Find cart item
    const cartItem = await this.cartItemRepository.findOne({
      where: { id: itemId, cartId },
      relations: ['product', 'variant'],
    });

    if (!cartItem) {
      throw new NotFoundException(`Cart item with id ${itemId} not found`);
    }

    // Check if product is in stock
    if (cartItem.variant) {
      if (cartItem.variant.quantity < quantity) {
        throw new BadRequestException(
          `Not enough stock for variant ${cartItem.variantId}. Available: ${cartItem.variant.quantity}`,
        );
      }
    } else {
      if (cartItem.product.quantity < quantity) {
        throw new BadRequestException(
          `Not enough stock for product ${cartItem.productId}. Available: ${cartItem.product.quantity}`,
        );
      }
    }

    // Update quantity
    cartItem.quantity = quantity;
    await this.cartItemRepository.save(cartItem);

    // Return updated cart
    return this.getCartById(cartId);
  }

  async removeCartItem(
    cartId: string,
    itemId: string,
  ): Promise<CartResponseDto> {
    // Find cart
    const cart = await this.cartRepository.findOne({
      where: { id: cartId },
    });

    if (!cart) {
      throw new NotFoundException(`Cart with id ${cartId} not found`);
    }

    // Find cart item
    const cartItem = await this.cartItemRepository.findOne({
      where: { id: itemId, cartId },
    });

    if (!cartItem) {
      throw new NotFoundException(`Cart item with id ${itemId} not found`);
    }

    // Remove cart item
    await this.cartItemRepository.remove(cartItem);

    // Return updated cart
    return this.getCartById(cartId);
  }

  async clearCart(cartId: string): Promise<CartResponseDto> {
    // Find cart
    const cart = await this.cartRepository.findOne({
      where: { id: cartId },
    });

    if (!cart) {
      throw new NotFoundException(`Cart with id ${cartId} not found`);
    }

    // Remove all cart items
    await this.cartItemRepository.delete({ cartId });

    // Return updated cart
    return this.getCartById(cartId);
  }

  async mergeGuestCart(
    userId: string,
    guestCartId: string,
  ): Promise<CartResponseDto> {
    // Find user cart
    let userCart = await this.cartRepository.findOne({
      where: { userId },
      relations: ['items'],
    });

    if (!userCart) {
      userCart = this.cartRepository.create({ userId });
      userCart = await this.cartRepository.save(userCart);
    }

    // Find guest cart
    const guestCart = await this.cartRepository.findOne({
      where: { id: guestCartId },
      relations: ['items', 'items.product', 'items.variant'],
    });

    if (!guestCart) {
      throw new NotFoundException(
        `Guest cart with id ${guestCartId} not found`,
      );
    }

    // Merge cart items
    if (guestCart.items && guestCart.items.length > 0) {
      for (const guestItem of guestCart.items) {
        // Check if item already exists in user cart
        const existingItem = userCart.items.find(
          (item) =>
            item.productId === guestItem.productId &&
            item.variantId === guestItem.variantId,
        );

        if (existingItem) {
          // Update quantity
          existingItem.quantity += guestItem.quantity;
          await this.cartItemRepository.save(existingItem);
        } else {
          // Create new cart item
          const newItem = this.cartItemRepository.create({
            cartId: userCart.id,
            productId: guestItem.productId,
            variantId: guestItem.variantId,
            quantity: guestItem.quantity,
          });
          await this.cartItemRepository.save(newItem);
        }
      }
    }

    // Delete guest cart
    await this.cartRepository.remove(guestCart);

    // Return updated user cart
    return this.getCart(userId);
  }

  private async getCartById(cartId: string): Promise<CartResponseDto> {
    const cart = await this.cartRepository.findOne({
      where: { id: cartId },
      relations: [
        'items',
        'items.product',
        'items.variant',
        'items.product.images',
        'items.variant.images',
      ],
    });

    if (!cart) {
      throw new NotFoundException(`Cart with id ${cartId} not found`);
    }

    return plainToInstance(CartResponseDto, cart, {
      excludeExtraneousValues: true,
    });
  }
}
