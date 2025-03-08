import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  QueryCategoryDto,
  CategoryResponseDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.categoryService.create(createCategoryDto);
  }

  @Get()
  findAll(@Query() query: QueryCategoryDto): Promise<CategoryResponseDto[]> {
    return this.categoryService.findAll(query);
  }

  @Get('tree')
  getCategoryTree(): Promise<CategoryResponseDto[]> {
    return this.categoryService.findCategoryTree();
  }

  @Get('root')
  getRootCategories(): Promise<CategoryResponseDto[]> {
    return this.categoryService.findRootCategories();
  }

  @Get('with-products')
  getCategoriesWithProducts(): Promise<CategoryResponseDto[]> {
    return this.categoryService.findCategoriesWithProducts();
  }

  @Get('without-parent')
  getCategoriesWithoutParent(): Promise<CategoryResponseDto[]> {
    return this.categoryService.findCategoriesWithoutParent();
  }

  @Get('with-parent')
  getCategoriesWithParent(): Promise<CategoryResponseDto[]> {
    return this.categoryService.findCategoriesWithParent();
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('includeChildren') includeChildren?: boolean,
    @Query('includeProducts') includeProducts?: boolean,
  ): Promise<CategoryResponseDto> {
    return this.categoryService.findOne(id, includeChildren, includeProducts);
  }

  @Get(':id/children')
  getChildCategories(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CategoryResponseDto[]> {
    return this.categoryService.findChildCategories(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.categoryService.remove(id);
  }
}
