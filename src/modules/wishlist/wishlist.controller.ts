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
import { WishlistService } from './wishlist.service';
import {
  AddToWishlistDto,
  CreateWishlistDto,
  UpdateWishlistDto,
  WishlistResponseDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards';

@Controller('wishlists')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post()
  create(
    @Request() req,
    @Body() createWishlistDto: CreateWishlistDto,
  ): Promise<WishlistResponseDto> {
    return this.wishlistService.create(req.user.id, createWishlistDto);
  }

  @Get()
  findAll(@Request() req): Promise<WishlistResponseDto[]> {
    return this.wishlistService.findAll(req.user.id);
  }

  @Get('default')
  getDefaultWishlist(@Request() req): Promise<WishlistResponseDto> {
    return this.wishlistService.getDefaultWishlist(req.user.id);
  }

  @Get(':id')
  findOne(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<WishlistResponseDto> {
    return this.wishlistService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateWishlistDto: UpdateWishlistDto,
  ): Promise<WishlistResponseDto> {
    return this.wishlistService.update(id, req.user.id, updateWishlistDto);
  }

  @Delete(':id')
  remove(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.wishlistService.remove(id, req.user.id);
  }

  @Post(':id/items')
  addToWishlist(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() addToWishlistDto: AddToWishlistDto,
  ): Promise<WishlistResponseDto> {
    return this.wishlistService.addToWishlist(
      id,
      req.user.id,
      addToWishlistDto,
    );
  }

  @Delete(':id/items/:itemId')
  removeFromWishlist(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<WishlistResponseDto> {
    return this.wishlistService.removeFromWishlist(id, itemId, req.user.id);
  }

  @Delete(':id/items')
  clearWishlist(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<WishlistResponseDto> {
    return this.wishlistService.clearWishlist(id, req.user.id);
  }

  @Post(':sourceId/items/:itemId/move/:targetId')
  moveItemToWishlist(
    @Request() req,
    @Param('sourceId', ParseUUIDPipe) sourceId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Param('targetId', ParseUUIDPipe) targetId: string,
  ): Promise<WishlistResponseDto> {
    return this.wishlistService.moveItemToWishlist(
      sourceId,
      targetId,
      itemId,
      req.user.id,
    );
  }
}
