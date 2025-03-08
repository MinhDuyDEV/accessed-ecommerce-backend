import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, IsNull } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { Product, ProductStatus } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductImage } from './entities/product-image.entity';
import { ProductAttribute } from './entities/product-attribute.entity';
import { ProductAttributeValue } from './entities/product-attribute-value.entity';
import { Category } from '../category/entities/category.entity';
import { Brand } from '../brand/entities/brand.entity';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductResponseDto,
  QueryProductDto,
  PaginationResponseDto,
  ProductSortBy,
} from './dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
    @InjectRepository(ProductImage)
    private imageRepository: Repository<ProductImage>,
    @InjectRepository(ProductAttribute)
    private attributeRepository: Repository<ProductAttribute>,
    @InjectRepository(ProductAttributeValue)
    private attributeValueRepository: Repository<ProductAttributeValue>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Brand)
    private brandRepository: Repository<Brand>,
  ) {}

  async create(
    createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    // Check if product with same name already exists
    const existingProduct = await this.productRepository.findOne({
      where: { name: createProductDto.name },
    });

    if (existingProduct) {
      throw new BadRequestException(
        `Product with name '${createProductDto.name}' already exists`,
      );
    }

    // Check if brand exists if brandId is provided
    if (createProductDto.brandId) {
      const brand = await this.brandRepository.findOne({
        where: { id: createProductDto.brandId },
      });

      if (!brand) {
        throw new BadRequestException(
          `Brand with id '${createProductDto.brandId}' not found`,
        );
      }
    }

    // Check if categories exist if categoryIds are provided
    if (
      createProductDto.categoryIds &&
      createProductDto.categoryIds.length > 0
    ) {
      const categories = await this.categoryRepository.find({
        where: { id: In(createProductDto.categoryIds) },
      });

      if (categories.length !== createProductDto.categoryIds.length) {
        throw new BadRequestException('One or more categories not found');
      }
    }

    // Create product
    const product = this.productRepository.create({
      name: createProductDto.name,
      description: createProductDto.description,
      type: createProductDto.type,
      price: createProductDto.price,
      discountPrice: createProductDto.discountPrice,
      sku: createProductDto.sku,
      quantity: createProductDto.quantity,
      status: createProductDto.status,
      weight: createProductDto.weight,
      dimensions: createProductDto.dimensions,
      brandId: createProductDto.brandId,
    });

    // Save product to get ID
    const savedProduct = await this.productRepository.save(product);

    // Add categories if provided
    if (
      createProductDto.categoryIds &&
      createProductDto.categoryIds.length > 0
    ) {
      const categories = await this.categoryRepository.find({
        where: { id: In(createProductDto.categoryIds) },
      });
      savedProduct.categories = categories;
      await this.productRepository.save(savedProduct);
    }

    // Add images if provided
    if (createProductDto.images && createProductDto.images.length > 0) {
      const images = createProductDto.images.map((imageDto, index) => {
        const image = this.imageRepository.create({
          url: imageDto.url,
          alt: imageDto.alt || savedProduct.name,
          displayOrder: imageDto.displayOrder || index,
          isDefault: imageDto.isDefault || index === 0, // First image is default if not specified
          productId: savedProduct.id,
        });
        return image;
      });
      await this.imageRepository.save(images);
    }

    // Add variants if provided
    if (createProductDto.variants && createProductDto.variants.length > 0) {
      for (const variantDto of createProductDto.variants) {
        const variant = this.variantRepository.create({
          productId: savedProduct.id,
          sku: variantDto.sku,
          name: variantDto.name,
          price: variantDto.price || savedProduct.price,
          discountPrice: variantDto.discountPrice,
          quantity: variantDto.quantity,
          isActive: variantDto.isActive,
          weight: variantDto.weight,
          dimensions: variantDto.dimensions,
        });

        const savedVariant = await this.variantRepository.save(variant);

        // Add attribute values if provided
        if (
          variantDto.attributeValues &&
          variantDto.attributeValues.length > 0
        ) {
          for (const attrValueDto of variantDto.attributeValues) {
            // Check if attribute exists
            const attribute = await this.attributeRepository.findOne({
              where: { id: attrValueDto.attributeId },
            });

            if (!attribute) {
              throw new BadRequestException(
                `Attribute with id '${attrValueDto.attributeId}' not found`,
              );
            }

            // Check if attribute value already exists
            let attributeValue = await this.attributeValueRepository.findOne({
              where: {
                attributeId: attrValueDto.attributeId,
                value: attrValueDto.value,
              },
            });

            // Create attribute value if it doesn't exist
            if (!attributeValue) {
              attributeValue = this.attributeValueRepository.create({
                attributeId: attrValueDto.attributeId,
                value: attrValueDto.value,
                description: attrValueDto.description,
                colorCode: attrValueDto.colorCode,
              });
              attributeValue =
                await this.attributeValueRepository.save(attributeValue);
            }

            // Add attribute value to variant
            await this.variantRepository
              .createQueryBuilder()
              .relation(ProductVariant, 'attributeValues')
              .of(savedVariant)
              .add(attributeValue);
          }
        }

        // Add images if provided
        if (variantDto.images && variantDto.images.length > 0) {
          const variantImages = variantDto.images.map((imageDto, index) => {
            const image = this.imageRepository.create({
              url: imageDto.url,
              alt: imageDto.alt || variant.name || savedProduct.name,
              displayOrder: imageDto.displayOrder || index,
              isDefault: imageDto.isDefault || index === 0,
              variantId: savedVariant.id,
            });
            return image;
          });
          await this.imageRepository.save(variantImages);
        }
      }
    }

    // Return the complete product
    return this.findOne(savedProduct.id, true);
  }

  async findAll(
    query: QueryProductDto,
  ): Promise<PaginationResponseDto<ProductResponseDto>> {
    const {
      name,
      status,
      type,
      categoryIds,
      brandId,
      minPrice,
      maxPrice,
      hasDiscount,
      inStock,
      includeInactive,
      includeVariants,
      includeImages,
      includeCategories,
      includeBrand,
      sortBy,
      sortOrder,
      page,
      limit,
    } = query;

    // Build query
    const queryBuilder = this.productRepository.createQueryBuilder('product');

    // Apply filters
    if (name) {
      queryBuilder.andWhere('product.name ILIKE :name', {
        name: `%${name}%`,
      });
    }

    if (status && status.length > 0) {
      queryBuilder.andWhere('product.status IN (:...status)', { status });
    } else if (!includeInactive) {
      queryBuilder.andWhere('product.status != :status', {
        status: ProductStatus.DRAFT,
      });
    }

    if (type && type.length > 0) {
      queryBuilder.andWhere('product.type IN (:...type)', { type });
    }

    if (brandId) {
      queryBuilder.andWhere('product.brandId = :brandId', { brandId });
    }

    if (minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    if (hasDiscount) {
      queryBuilder.andWhere('product.discountPrice IS NOT NULL');
      queryBuilder.andWhere('product.discountPrice > 0');
      queryBuilder.andWhere('product.discountPrice < product.price');
    }

    if (inStock) {
      queryBuilder.andWhere('product.quantity > 0');
    }

    if (categoryIds && categoryIds.length > 0) {
      queryBuilder.innerJoin(
        'product.categories',
        'category',
        'category.id IN (:...categoryIds)',
        { categoryIds },
      );
    }

    // Apply relations
    if (includeVariants) {
      queryBuilder.leftJoinAndSelect('product.variants', 'variant');

      if (includeImages) {
        queryBuilder.leftJoinAndSelect('variant.images', 'variantImage');
        queryBuilder.leftJoinAndSelect(
          'variant.attributeValues',
          'attributeValue',
        );
        queryBuilder.leftJoinAndSelect('attributeValue.attribute', 'attribute');
      }
    }

    if (includeImages) {
      queryBuilder.leftJoinAndSelect('product.images', 'image');
    }

    if (includeCategories) {
      queryBuilder.leftJoinAndSelect('product.categories', 'categories');
    }

    if (includeBrand) {
      queryBuilder.leftJoinAndSelect('product.brand', 'brand');
    }

    // Apply sorting
    switch (sortBy) {
      case ProductSortBy.NAME:
        queryBuilder.orderBy('product.name', sortOrder);
        break;
      case ProductSortBy.PRICE:
        queryBuilder.orderBy('product.price', sortOrder);
        break;
      case ProductSortBy.CREATED_AT:
      default:
        queryBuilder.orderBy('product.createdAt', sortOrder);
        break;
    }

    // Get total count
    const totalItems = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(query.skip);
    queryBuilder.take(limit);

    // Get results
    const products = await queryBuilder.getMany();

    // Transform to DTOs
    const productDtos = products.map((product) =>
      plainToInstance(ProductResponseDto, product, {
        excludeExtraneousValues: true,
      }),
    );

    // Return paginated response
    return new PaginationResponseDto<ProductResponseDto>(
      productDtos,
      page,
      limit,
      totalItems,
    );
  }

  async findOne(
    id: string,
    includeRelations = true,
  ): Promise<ProductResponseDto> {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .where('product.id = :id', { id });

    if (includeRelations) {
      queryBuilder
        .leftJoinAndSelect('product.variants', 'variant')
        .leftJoinAndSelect('variant.attributeValues', 'attributeValue')
        .leftJoinAndSelect('attributeValue.attribute', 'attribute')
        .leftJoinAndSelect('variant.images', 'variantImage')
        .leftJoinAndSelect('product.images', 'image')
        .leftJoinAndSelect('product.categories', 'category')
        .leftJoinAndSelect('product.brand', 'brand');
    }

    const product = await queryBuilder.getOne();

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    return plainToInstance(ProductResponseDto, product, {
      excludeExtraneousValues: true,
    });
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['categories', 'variants', 'images'],
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    // Check if product with same name already exists (if name is being updated)
    if (updateProductDto.name && updateProductDto.name !== product.name) {
      const existingProduct = await this.productRepository.findOne({
        where: { name: updateProductDto.name, id: Not(id) },
      });

      if (existingProduct) {
        throw new BadRequestException(
          `Product with name '${updateProductDto.name}' already exists`,
        );
      }
    }

    // Check if brand exists if brandId is provided
    if (updateProductDto.brandId) {
      const brand = await this.brandRepository.findOne({
        where: { id: updateProductDto.brandId },
      });

      if (!brand) {
        throw new BadRequestException(
          `Brand with id '${updateProductDto.brandId}' not found`,
        );
      }
    }

    // Update basic product properties
    if (updateProductDto.name) product.name = updateProductDto.name;
    if (updateProductDto.description !== undefined)
      product.description = updateProductDto.description;
    if (updateProductDto.type) product.type = updateProductDto.type;
    if (updateProductDto.price !== undefined)
      product.price = updateProductDto.price;
    if (updateProductDto.discountPrice !== undefined)
      product.discountPrice = updateProductDto.discountPrice;
    if (updateProductDto.sku) product.sku = updateProductDto.sku;
    if (updateProductDto.quantity !== undefined)
      product.quantity = updateProductDto.quantity;
    if (updateProductDto.status) product.status = updateProductDto.status;
    if (updateProductDto.weight !== undefined)
      product.weight = updateProductDto.weight;
    if (updateProductDto.dimensions !== undefined)
      product.dimensions = updateProductDto.dimensions;
    if (updateProductDto.brandId !== undefined)
      product.brandId = updateProductDto.brandId;

    // Save product to update basic properties
    await this.productRepository.save(product);

    // Update categories if provided
    if (
      updateProductDto.categoryIds &&
      updateProductDto.categoryIds.length > 0
    ) {
      const categories = await this.categoryRepository.find({
        where: { id: In(updateProductDto.categoryIds) },
      });

      if (categories.length !== updateProductDto.categoryIds.length) {
        throw new BadRequestException('One or more categories not found');
      }

      // Add new categories
      if (!product.categories) {
        product.categories = [];
      }

      // Get existing category IDs
      const existingCategoryIds = product.categories.map((cat) => cat.id);

      // Filter out categories that are already associated
      const newCategories = categories.filter(
        (cat) => !existingCategoryIds.includes(cat.id),
      );

      // Add new categories
      product.categories = [...product.categories, ...newCategories];
    }

    // Remove categories if provided
    if (
      updateProductDto.removeCategoryIds &&
      updateProductDto.removeCategoryIds.length > 0
    ) {
      if (product.categories) {
        product.categories = product.categories.filter(
          (category) =>
            !updateProductDto.removeCategoryIds.includes(category.id),
        );
      }
    }

    // Save product to update categories
    await this.productRepository.save(product);

    // Add new images if provided
    if (updateProductDto.images && updateProductDto.images.length > 0) {
      const images = updateProductDto.images.map((imageDto, index) => {
        const image = this.imageRepository.create({
          url: imageDto.url,
          alt: imageDto.alt || product.name,
          displayOrder: imageDto.displayOrder || index,
          isDefault: imageDto.isDefault || false,
          productId: product.id,
        });
        return image;
      });
      await this.imageRepository.save(images);
    }

    // Remove images if provided
    if (
      updateProductDto.removeImageIds &&
      updateProductDto.removeImageIds.length > 0
    ) {
      await this.imageRepository.delete({
        id: In(updateProductDto.removeImageIds),
        productId: product.id,
      });
    }

    // Add new variants if provided
    if (updateProductDto.variants && updateProductDto.variants.length > 0) {
      for (const variantDto of updateProductDto.variants) {
        const variant = this.variantRepository.create({
          productId: product.id,
          sku: variantDto.sku,
          name: variantDto.name,
          price: variantDto.price || product.price,
          discountPrice: variantDto.discountPrice,
          quantity: variantDto.quantity,
          isActive: variantDto.isActive,
          weight: variantDto.weight,
          dimensions: variantDto.dimensions,
        });

        const savedVariant = await this.variantRepository.save(variant);

        // Add attribute values if provided
        if (
          variantDto.attributeValues &&
          variantDto.attributeValues.length > 0
        ) {
          for (const attrValueDto of variantDto.attributeValues) {
            // Check if attribute exists
            const attribute = await this.attributeRepository.findOne({
              where: { id: attrValueDto.attributeId },
            });

            if (!attribute) {
              throw new BadRequestException(
                `Attribute with id '${attrValueDto.attributeId}' not found`,
              );
            }

            // Check if attribute value already exists
            let attributeValue = await this.attributeValueRepository.findOne({
              where: {
                attributeId: attrValueDto.attributeId,
                value: attrValueDto.value,
              },
            });

            // Create attribute value if it doesn't exist
            if (!attributeValue) {
              attributeValue = this.attributeValueRepository.create({
                attributeId: attrValueDto.attributeId,
                value: attrValueDto.value,
                description: attrValueDto.description,
                colorCode: attrValueDto.colorCode,
              });
              attributeValue =
                await this.attributeValueRepository.save(attributeValue);
            }

            // Add attribute value to variant
            await this.variantRepository
              .createQueryBuilder()
              .relation(ProductVariant, 'attributeValues')
              .of(savedVariant)
              .add(attributeValue);
          }
        }

        // Add images if provided
        if (variantDto.images && variantDto.images.length > 0) {
          const variantImages = variantDto.images.map((imageDto, index) => {
            const image = this.imageRepository.create({
              url: imageDto.url,
              alt: imageDto.alt || variant.name || product.name,
              displayOrder: imageDto.displayOrder || index,
              isDefault: imageDto.isDefault || index === 0,
              variantId: savedVariant.id,
            });
            return image;
          });
          await this.imageRepository.save(variantImages);
        }
      }
    }

    // Remove variants if provided
    if (
      updateProductDto.removeVariantIds &&
      updateProductDto.removeVariantIds.length > 0
    ) {
      await this.variantRepository.delete({
        id: In(updateProductDto.removeVariantIds),
        productId: product.id,
      });
    }

    // Return the updated product
    return this.findOne(id, true);
  }

  async remove(id: string): Promise<void> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['variants', 'images'],
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    // Delete all related entities
    if (product.variants && product.variants.length > 0) {
      await this.variantRepository.delete({ productId: id });
    }

    if (product.images && product.images.length > 0) {
      await this.imageRepository.delete({ productId: id });
    }

    // Delete the product
    await this.productRepository.delete(id);
  }

  async findByCategory(
    categoryId: string,
    query: QueryProductDto,
  ): Promise<PaginationResponseDto<ProductResponseDto>> {
    // Ensure categoryId is included in the query
    query.categoryIds = [categoryId];

    return this.findAll(query);
  }

  async findByBrand(
    brandId: string,
    query: QueryProductDto,
  ): Promise<PaginationResponseDto<ProductResponseDto>> {
    // Ensure brandId is included in the query
    query.brandId = brandId;

    return this.findAll(query);
  }

  async findFeaturedProducts(limit = 10): Promise<ProductResponseDto[]> {
    const products = await this.productRepository.find({
      where: {
        status: ProductStatus.PUBLISHED,
      },
      relations: ['images', 'brand'],
      order: {
        createdAt: 'DESC',
      },
      take: limit,
    });

    return products.map((product) =>
      plainToInstance(ProductResponseDto, product, {
        excludeExtraneousValues: true,
      }),
    );
  }

  async findDiscountedProducts(limit = 10): Promise<ProductResponseDto[]> {
    const products = await this.productRepository.find({
      where: {
        status: ProductStatus.PUBLISHED,
        discountPrice: Not(IsNull()),
      },
      relations: ['images', 'brand'],
      order: {
        discountPrice: 'ASC',
      },
      take: limit,
    });

    return products.map((product) =>
      plainToInstance(ProductResponseDto, product, {
        excludeExtraneousValues: true,
      }),
    );
  }

  async searchProducts(
    searchTerm: string,
    query: QueryProductDto,
  ): Promise<PaginationResponseDto<ProductResponseDto>> {
    const {
      includeVariants,
      includeImages,
      includeCategories,
      includeBrand,
      sortBy,
      sortOrder,
      page,
      limit,
    } = query;

    // Build query
    const queryBuilder = this.productRepository.createQueryBuilder('product');

    // Apply search filter
    queryBuilder.where('product.name ILIKE :searchTerm', {
      searchTerm: `%${searchTerm}%`,
    });
    queryBuilder.orWhere('product.description ILIKE :searchTerm', {
      searchTerm: `%${searchTerm}%`,
    });
    queryBuilder.orWhere('product.sku ILIKE :searchTerm', {
      searchTerm: `%${searchTerm}%`,
    });

    // Only include published products
    queryBuilder.andWhere('product.status = :status', {
      status: ProductStatus.PUBLISHED,
    });

    // Apply relations
    if (includeVariants) {
      queryBuilder.leftJoinAndSelect('product.variants', 'variant');

      if (includeImages) {
        queryBuilder.leftJoinAndSelect('variant.images', 'variantImage');
        queryBuilder.leftJoinAndSelect(
          'variant.attributeValues',
          'attributeValue',
        );
        queryBuilder.leftJoinAndSelect('attributeValue.attribute', 'attribute');
      }
    }

    if (includeImages) {
      queryBuilder.leftJoinAndSelect('product.images', 'image');
    }

    if (includeCategories) {
      queryBuilder.leftJoinAndSelect('product.categories', 'categories');
    }

    if (includeBrand) {
      queryBuilder.leftJoinAndSelect('product.brand', 'brand');
    }

    // Apply sorting
    switch (sortBy) {
      case ProductSortBy.NAME:
        queryBuilder.orderBy('product.name', sortOrder);
        break;
      case ProductSortBy.PRICE:
        queryBuilder.orderBy('product.price', sortOrder);
        break;
      case ProductSortBy.CREATED_AT:
      default:
        queryBuilder.orderBy('product.createdAt', sortOrder);
        break;
    }

    // Get total count
    const totalItems = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(query.skip);
    queryBuilder.take(limit);

    // Get results
    const products = await queryBuilder.getMany();

    // Transform to DTOs
    const productDtos = products.map((product) =>
      plainToInstance(ProductResponseDto, product, {
        excludeExtraneousValues: true,
      }),
    );

    // Return paginated response
    return new PaginationResponseDto<ProductResponseDto>(
      productDtos,
      page,
      limit,
      totalItems,
    );
  }

  async advancedSearch(
    searchTerm?: string,
    query?: QueryProductDto,
  ): Promise<PaginationResponseDto<ProductResponseDto>> {
    const {
      categoryIds,
      brandId,
      minPrice,
      maxPrice,
      hasDiscount,
      inStock,
      status,
      type,
      createdAfter,
      createdBefore,
      includeInactive = false,
      includeVariants = false,
      includeImages = false,
      includeCategories = false,
      includeBrand = false,
      sortBy = ProductSortBy.CREATED_AT,
      sortOrder = 'DESC',
      page = 1,
      limit = 10,
    } = query || {};

    // Build query
    const queryBuilder = this.productRepository.createQueryBuilder('product');

    // Join with categories if filtering by category
    if (categoryIds && categoryIds.length > 0) {
      queryBuilder.innerJoin('product.categories', 'category');
      queryBuilder.andWhere('category.id IN (:...categoryIds)', {
        categoryIds,
      });
    }

    // Apply search term filter if provided
    if (searchTerm && searchTerm.trim() !== '') {
      queryBuilder.andWhere(
        '(product.name ILIKE :searchTerm OR product.description ILIKE :searchTerm OR product.sku ILIKE :searchTerm)',
        { searchTerm: `%${searchTerm.trim()}%` },
      );
    }

    // Apply brand filter if provided
    if (brandId) {
      queryBuilder.andWhere('product.brandId = :brandId', { brandId });
    }

    // Apply price range filters if provided
    if (minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    // Apply discount filter if provided
    if (hasDiscount === true) {
      queryBuilder.andWhere('product.discountPrice IS NOT NULL');
      queryBuilder.andWhere('product.discountPrice > 0');
    }

    // Apply stock filter if provided
    if (inStock === true) {
      queryBuilder.andWhere('product.quantity > 0');
    }

    // Apply date range filters if provided
    if (createdAfter) {
      queryBuilder.andWhere('product.createdAt >= :createdAfter', {
        createdAfter,
      });
    }

    if (createdBefore) {
      queryBuilder.andWhere('product.createdAt <= :createdBefore', {
        createdBefore,
      });
    }

    // Apply status filter if provided
    if (status && status.length > 0) {
      queryBuilder.andWhere('product.status IN (:...status)', { status });
    } else if (!includeInactive) {
      // By default, only include published products
      queryBuilder.andWhere('product.status = :status', {
        status: ProductStatus.PUBLISHED,
      });
    }

    // Apply type filter if provided
    if (type && type.length > 0) {
      queryBuilder.andWhere('product.type IN (:...type)', { type });
    }

    // Apply relations
    if (includeVariants) {
      queryBuilder.leftJoinAndSelect('product.variants', 'variant');

      if (includeImages) {
        queryBuilder.leftJoinAndSelect('variant.images', 'variantImage');
        queryBuilder.leftJoinAndSelect(
          'variant.attributeValues',
          'attributeValue',
        );
        queryBuilder.leftJoinAndSelect('attributeValue.attribute', 'attribute');
      }
    }

    if (includeImages) {
      queryBuilder.leftJoinAndSelect('product.images', 'image');
    }

    if (includeCategories) {
      queryBuilder.leftJoinAndSelect('product.categories', 'categories');
    }

    if (includeBrand) {
      queryBuilder.leftJoinAndSelect('product.brand', 'brand');
    }

    // Apply sorting
    switch (sortBy) {
      case ProductSortBy.NAME:
        queryBuilder.orderBy('product.name', sortOrder);
        break;
      case ProductSortBy.PRICE:
        queryBuilder.orderBy('product.price', sortOrder);
        break;
      case ProductSortBy.CREATED_AT:
      default:
        queryBuilder.orderBy('product.createdAt', sortOrder);
        break;
    }

    // Get total count
    const totalItems = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip((page - 1) * limit);
    queryBuilder.take(limit);

    // Get results
    const products = await queryBuilder.getMany();

    // Transform to DTOs
    const productDtos = products.map((product) =>
      plainToInstance(ProductResponseDto, product, {
        excludeExtraneousValues: true,
      }),
    );

    // Return paginated response
    return new PaginationResponseDto<ProductResponseDto>(
      productDtos,
      page,
      limit,
      totalItems,
    );
  }
}
