import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { BannerService } from './banner.service';
import { Banner, BannerPosition, BannerType } from './entities/banner.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../user/entities/user.entity';
import { Roles } from '../auth/decorators';

@Controller('banners')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Get()
  findAll() {
    return this.bannerService.findAll();
  }

  @Get('position/:position')
  findByPosition(@Param('position') position: BannerPosition) {
    return this.bannerService.findByPosition(position);
  }

  @Get('type/:type')
  findByType(@Param('type') type: BannerType) {
    return this.bannerService.findByType(type);
  }

  @Get('promotions/active')
  findActivePromotions() {
    return this.bannerService.findActivePromotions();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bannerService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() createBannerDto: Partial<Banner>) {
    return this.bannerService.create(createBannerDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateBannerDto: Partial<Banner>) {
    return this.bannerService.update(id, updateBannerDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.bannerService.remove(id);
  }
}
