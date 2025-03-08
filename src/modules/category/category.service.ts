import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { Category } from './entities/category.entity';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  QueryCategoryDto,
  CategoryResponseDto,
} from './dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async create(
    createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    // Check if category with the same name already exists
    const existingCategory = await this.categoryRepository.findOne({
      where: { name: createCategoryDto.name },
    });

    if (existingCategory) {
      throw new ConflictException(
        `Category with name '${createCategoryDto.name}' already exists`,
      );
    }

    // Check if parent category exists if parentId is provided
    if (createCategoryDto.parentId) {
      const parentCategory = await this.categoryRepository.findOne({
        where: { id: createCategoryDto.parentId },
      });

      if (!parentCategory) {
        throw new NotFoundException(
          `Parent category with ID '${createCategoryDto.parentId}' not found`,
        );
      }
    }

    // Create new category
    const category = this.categoryRepository.create(createCategoryDto);
    const savedCategory = await this.categoryRepository.save(category);

    return plainToInstance(CategoryResponseDto, savedCategory, {
      excludeExtraneousValues: true,
    });
  }

  async findAll(query: QueryCategoryDto): Promise<CategoryResponseDto[]> {
    const {
      name,
      parentId,
      isActive,
      includeInactive = false,
      includeChildren = false,
      includeProducts = false,
      onlyRootCategories = false,
    } = query;

    // Build where conditions
    const whereConditions: any = {};

    if (name) {
      whereConditions.name = name;
    }

    if (parentId) {
      whereConditions.parentId = parentId;
    } else if (onlyRootCategories) {
      whereConditions.parentId = IsNull();
    }

    if (!includeInactive && isActive !== false) {
      whereConditions.isActive = true;
    } else if (isActive !== undefined) {
      whereConditions.isActive = isActive;
    }

    // Build relations
    const relations: string[] = [];

    if (includeChildren) {
      relations.push('children');
    }

    if (includeProducts) {
      relations.push('products');
    }

    // Find categories
    const categories = await this.categoryRepository.find({
      where: whereConditions,
      relations,
      order: { displayOrder: 'ASC', name: 'ASC' },
    });

    return categories.map((category) =>
      plainToInstance(CategoryResponseDto, category, {
        excludeExtraneousValues: true,
      }),
    );
  }

  async findOne(
    id: string,
    includeChildren = false,
    includeProducts = false,
  ): Promise<CategoryResponseDto> {
    const relations: string[] = [];

    if (includeChildren) {
      relations.push('children');
    }

    if (includeProducts) {
      relations.push('products');
    }

    const category = await this.categoryRepository.findOne({
      where: { id },
      relations,
    });

    if (!category) {
      throw new NotFoundException(`Category with ID '${id}' not found`);
    }

    return plainToInstance(CategoryResponseDto, category, {
      excludeExtraneousValues: true,
    });
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID '${id}' not found`);
    }

    // Check if name is being updated and if it already exists
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.categoryRepository.findOne({
        where: { name: updateCategoryDto.name },
      });

      if (existingCategory && existingCategory.id !== id) {
        throw new ConflictException(
          `Category with name '${updateCategoryDto.name}' already exists`,
        );
      }
    }

    // Check if parentId is being updated and if it exists
    if (
      updateCategoryDto.parentId &&
      updateCategoryDto.parentId !== category.parentId
    ) {
      // Prevent setting parent to itself
      if (updateCategoryDto.parentId === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }

      // Check if parent exists
      const parentCategory = await this.categoryRepository.findOne({
        where: { id: updateCategoryDto.parentId },
      });

      if (!parentCategory) {
        throw new NotFoundException(
          `Parent category with ID '${updateCategoryDto.parentId}' not found`,
        );
      }

      // Prevent circular references
      await this.checkCircularReference(id, updateCategoryDto.parentId);
    }

    // Update category
    Object.assign(category, updateCategoryDto);
    const updatedCategory = await this.categoryRepository.save(category);

    return plainToInstance(CategoryResponseDto, updatedCategory, {
      excludeExtraneousValues: true,
    });
  }

  async remove(id: string): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['children', 'products'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID '${id}' not found`);
    }

    // Check if category has children
    if (category.children && category.children.length > 0) {
      throw new BadRequestException(
        'Cannot delete category with children. Delete children first or reassign them.',
      );
    }

    // Check if category has products
    if (category.products && category.products.length > 0) {
      throw new BadRequestException(
        'Cannot delete category with products. Remove products first or reassign them.',
      );
    }

    await this.categoryRepository.remove(category);
  }

  async findRootCategories(): Promise<CategoryResponseDto[]> {
    const rootCategories = await this.categoryRepository.find({
      where: { parentId: IsNull(), isActive: true },
      order: { displayOrder: 'ASC', name: 'ASC' },
    });

    return rootCategories.map((category) =>
      plainToInstance(CategoryResponseDto, category, {
        excludeExtraneousValues: true,
      }),
    );
  }

  async findCategoryTree(): Promise<CategoryResponseDto[]> {
    // First get all root categories
    const rootCategories = await this.categoryRepository.find({
      where: { parentId: IsNull(), isActive: true },
      relations: ['children'],
      order: { displayOrder: 'ASC', name: 'ASC' },
    });

    // Recursively load children
    const loadChildren = async (
      categories: Category[],
    ): Promise<Category[]> => {
      for (const category of categories) {
        if (category.children && category.children.length > 0) {
          category.children = await this.categoryRepository.find({
            where: { parentId: category.id, isActive: true },
            relations: ['children'],
            order: { displayOrder: 'ASC', name: 'ASC' },
          });

          if (category.children.length > 0) {
            category.children = await loadChildren(category.children);
          }
        }
      }
      return categories;
    };

    const categoryTree = await loadChildren(rootCategories);

    return categoryTree.map((category) =>
      plainToInstance(CategoryResponseDto, category, {
        excludeExtraneousValues: true,
      }),
    );
  }

  async findChildCategories(parentId: string): Promise<CategoryResponseDto[]> {
    // Check if parent exists
    const parentExists = await this.categoryRepository.findOne({
      where: { id: parentId },
    });

    if (!parentExists) {
      throw new NotFoundException(
        `Parent category with ID '${parentId}' not found`,
      );
    }

    const childCategories = await this.categoryRepository.find({
      where: { parentId, isActive: true },
      order: { displayOrder: 'ASC', name: 'ASC' },
    });

    return childCategories.map((category) =>
      plainToInstance(CategoryResponseDto, category, {
        excludeExtraneousValues: true,
      }),
    );
  }

  async findCategoriesWithProducts(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryRepository.find({
      where: { isActive: true },
      relations: ['products'],
      order: { displayOrder: 'ASC', name: 'ASC' },
    });

    // Filter categories that have products
    const categoriesWithProducts = categories.filter(
      (category) => category.products && category.products.length > 0,
    );

    return categoriesWithProducts.map((category) =>
      plainToInstance(CategoryResponseDto, category, {
        excludeExtraneousValues: true,
      }),
    );
  }

  async findCategoriesWithoutParent(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryRepository.find({
      where: { parentId: IsNull(), isActive: true },
      order: { displayOrder: 'ASC', name: 'ASC' },
    });

    return categories.map((category) =>
      plainToInstance(CategoryResponseDto, category, {
        excludeExtraneousValues: true,
      }),
    );
  }

  async findCategoriesWithParent(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryRepository.find({
      where: { parentId: Not(IsNull()), isActive: true },
      relations: ['parent'],
      order: { displayOrder: 'ASC', name: 'ASC' },
    });

    return categories.map((category) =>
      plainToInstance(CategoryResponseDto, category, {
        excludeExtraneousValues: true,
      }),
    );
  }

  // Helper method to check for circular references when updating parentId
  private async checkCircularReference(
    categoryId: string,
    newParentId: string,
  ): Promise<void> {
    let currentParentId = newParentId;
    const visitedIds = new Set<string>();

    while (currentParentId) {
      // If we've seen this ID before, we have a cycle
      if (visitedIds.has(currentParentId)) {
        throw new BadRequestException(
          'Circular reference detected in category hierarchy',
        );
      }

      // If the current parent is the category we're updating, we have a cycle
      if (currentParentId === categoryId) {
        throw new BadRequestException(
          'Circular reference detected in category hierarchy',
        );
      }

      visitedIds.add(currentParentId);

      // Get the parent of the current parent
      const parent = await this.categoryRepository.findOne({
        where: { id: currentParentId },
        select: ['id', 'parentId'],
      });

      if (!parent) {
        break;
      }

      currentParentId = parent.parentId;
    }
  }
}
