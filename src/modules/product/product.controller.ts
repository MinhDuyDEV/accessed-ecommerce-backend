import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from './product.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductResponseDto,
  QueryProductDto,
  PaginationResponseDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';

@Controller('api/products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(
    @Body() createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    return this.productService.create(createProductDto);
  }

  @Get()
  findAll(
    @Query() query: QueryProductDto,
  ): Promise<PaginationResponseDto<ProductResponseDto>> {
    return this.productService.findAll(query);
  }

  @Get('featured')
  findFeatured(@Query('limit') limit?: number): Promise<ProductResponseDto[]> {
    return this.productService.findFeaturedProducts(limit);
  }

  @Get('discounted')
  findDiscounted(
    @Query('limit') limit?: number,
  ): Promise<ProductResponseDto[]> {
    return this.productService.findDiscountedProducts(limit);
  }

  @Get('search')
  search(
    @Query('term') term: string,
    @Query() query: QueryProductDto,
  ): Promise<PaginationResponseDto<ProductResponseDto>> {
    return this.productService.searchProducts(term, query);
  }

  @Get('category/:categoryId')
  findByCategory(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Query() query: QueryProductDto,
  ): Promise<PaginationResponseDto<ProductResponseDto>> {
    return this.productService.findByCategory(categoryId, query);
  }

  @Get('brand/:brandId')
  findByBrand(
    @Param('brandId', ParseUUIDPipe) brandId: string,
    @Query() query: QueryProductDto,
  ): Promise<PaginationResponseDto<ProductResponseDto>> {
    return this.productService.findByBrand(brandId, query);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('includeRelations') includeRelations?: boolean,
  ): Promise<ProductResponseDto> {
    return this.productService.findOne(id, includeRelations);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.productService.remove(id);
  }
}
