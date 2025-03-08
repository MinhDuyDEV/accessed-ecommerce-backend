import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto, CartResponseDto, UpdateCartItemDto } from './dto';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../auth/guards';

@Controller('carts')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async getCart(@Request() req): Promise<CartResponseDto> {
    // If user is authenticated, get their cart
    if (req.user) {
      return this.cartService.getCart(req.user.id);
    }

    // If guest cart ID is provided in request, get that cart
    if (req.headers['x-cart-id']) {
      return this.cartService.getGuestCart(req.headers['x-cart-id']);
    }

    // Otherwise create a new guest cart
    return this.cartService.createGuestCart();
  }

  @Post('items')
  @UseGuards(OptionalJwtAuthGuard)
  async addToCart(
    @Request() req,
    @Body() addToCartDto: AddToCartDto,
  ): Promise<CartResponseDto> {
    // If user is authenticated, add to their cart
    if (req.user) {
      // Get or create user cart
      const cart = await this.cartService.getCart(req.user.id);
      return this.cartService.addToCart(cart.id, addToCartDto);
    }

    // If guest cart ID is provided in request, add to that cart
    if (req.headers['x-cart-id']) {
      return this.cartService.addToCart(req.headers['x-cart-id'], addToCartDto);
    }

    // Otherwise create a new guest cart and add item to it
    const cart = await this.cartService.createGuestCart();
    return this.cartService.addToCart(cart.id, addToCartDto);
  }

  @Patch('items/:id')
  @UseGuards(OptionalJwtAuthGuard)
  async updateCartItem(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    // If user is authenticated, update item in their cart
    if (req.user) {
      // Get user cart
      const cart = await this.cartService.getCart(req.user.id);
      return this.cartService.updateCartItem(cart.id, id, updateCartItemDto);
    }

    // If guest cart ID is provided in request, update item in that cart
    if (req.headers['x-cart-id']) {
      return this.cartService.updateCartItem(
        req.headers['x-cart-id'],
        id,
        updateCartItemDto,
      );
    }

    throw new Error('No cart found. Please provide a cart ID or log in.');
  }

  @Delete('items/:id')
  @UseGuards(OptionalJwtAuthGuard)
  async removeCartItem(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CartResponseDto> {
    // If user is authenticated, remove item from their cart
    if (req.user) {
      // Get user cart
      const cart = await this.cartService.getCart(req.user.id);
      return this.cartService.removeCartItem(cart.id, id);
    }

    // If guest cart ID is provided in request, remove item from that cart
    if (req.headers['x-cart-id']) {
      return this.cartService.removeCartItem(req.headers['x-cart-id'], id);
    }

    throw new Error('No cart found. Please provide a cart ID or log in.');
  }

  @Delete()
  @UseGuards(OptionalJwtAuthGuard)
  async clearCart(@Request() req): Promise<CartResponseDto> {
    // If user is authenticated, clear their cart
    if (req.user) {
      // Get user cart
      const cart = await this.cartService.getCart(req.user.id);
      return this.cartService.clearCart(cart.id);
    }

    // If guest cart ID is provided in request, clear that cart
    if (req.headers['x-cart-id']) {
      return this.cartService.clearCart(req.headers['x-cart-id']);
    }

    throw new Error('No cart found. Please provide a cart ID or log in.');
  }

  @Post('merge')
  @UseGuards(JwtAuthGuard)
  async mergeGuestCart(
    @Request() req,
    @Body('guestCartId') guestCartId: string,
  ): Promise<CartResponseDto> {
    return this.cartService.mergeGuestCart(req.user.id, guestCartId);
  }
}
