import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ProductAttributeService } from './product-attribute.service';
import {
  CreateProductAttributeDto,
  UpdateProductAttributeDto,
  ProductAttributeResponseDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';

@Controller('api/product-attributes')
export class ProductAttributeController {
  constructor(
    private readonly productAttributeService: ProductAttributeService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(
    @Body() createAttributeDto: CreateProductAttributeDto,
  ): Promise<ProductAttributeResponseDto> {
    return this.productAttributeService.create(createAttributeDto);
  }

  @Get()
  findAll(): Promise<ProductAttributeResponseDto[]> {
    return this.productAttributeService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProductAttributeResponseDto> {
    return this.productAttributeService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAttributeDto: UpdateProductAttributeDto,
  ): Promise<ProductAttributeResponseDto> {
    return this.productAttributeService.update(id, updateAttributeDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.productAttributeService.remove(id);
  }

  @Post(':id/values')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  addValue(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('value') value: string,
    @Body('description') description?: string,
    @Body('colorCode') colorCode?: string,
  ): Promise<ProductAttributeResponseDto> {
    return this.productAttributeService.addAttributeValue(
      id,
      value,
      description,
      colorCode,
    );
  }

  @Delete(':id/values/:valueId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  removeValue(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('valueId', ParseUUIDPipe) valueId: string,
  ): Promise<ProductAttributeResponseDto> {
    return this.productAttributeService.removeAttributeValue(id, valueId);
  }
}
