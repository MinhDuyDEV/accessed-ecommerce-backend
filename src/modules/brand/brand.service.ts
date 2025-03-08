import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from './entities/brand.entity';
import {
  CreateBrandDto,
  UpdateBrandDto,
  QueryBrandDto,
  BrandResponseDto,
} from './dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class BrandService {
  constructor(
    @InjectRepository(Brand)
    private brandRepository: Repository<Brand>,
  ) {}

  async create(createBrandDto: CreateBrandDto): Promise<BrandResponseDto> {
    // Check if brand with the same name already exists
    const existingBrand = await this.brandRepository.findOne({
      where: { name: createBrandDto.name },
    });

    if (existingBrand) {
      throw new ConflictException(
        `Brand with name '${createBrandDto.name}' already exists`,
      );
    }

    // Create new brand
    const brand = this.brandRepository.create(createBrandDto);
    const savedBrand = await this.brandRepository.save(brand);

    return plainToInstance(BrandResponseDto, savedBrand, {
      excludeExtraneousValues: true,
    });
  }

  async findAll(query: QueryBrandDto): Promise<BrandResponseDto[]> {
    const {
      name,
      isActive,
      includeInactive = false,
      includeProducts = false,
    } = query;

    // Build where conditions
    const whereConditions: any = {};

    if (name) {
      whereConditions.name = name;
    }

    if (!includeInactive && isActive !== false) {
      whereConditions.isActive = true;
    } else if (isActive !== undefined) {
      whereConditions.isActive = isActive;
    }

    // Build relations
    const relations: string[] = [];

    if (includeProducts) {
      relations.push('products');
    }

    // Find brands
    const brands = await this.brandRepository.find({
      where: whereConditions,
      relations,
      order: { name: 'ASC' },
    });

    return brands.map((brand) =>
      plainToInstance(BrandResponseDto, brand, {
        excludeExtraneousValues: true,
      }),
    );
  }

  async findOne(
    id: string,
    includeProducts = false,
  ): Promise<BrandResponseDto> {
    const relations: string[] = [];

    if (includeProducts) {
      relations.push('products');
    }

    const brand = await this.brandRepository.findOne({
      where: { id },
      relations,
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID '${id}' not found`);
    }

    return plainToInstance(BrandResponseDto, brand, {
      excludeExtraneousValues: true,
    });
  }

  async update(
    id: string,
    updateBrandDto: UpdateBrandDto,
  ): Promise<BrandResponseDto> {
    const brand = await this.brandRepository.findOne({
      where: { id },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID '${id}' not found`);
    }

    // Check if name is being updated and if it already exists
    if (updateBrandDto.name && updateBrandDto.name !== brand.name) {
      const existingBrand = await this.brandRepository.findOne({
        where: { name: updateBrandDto.name },
      });

      if (existingBrand && existingBrand.id !== id) {
        throw new ConflictException(
          `Brand with name '${updateBrandDto.name}' already exists`,
        );
      }
    }

    // Update brand
    Object.assign(brand, updateBrandDto);
    const updatedBrand = await this.brandRepository.save(brand);

    return plainToInstance(BrandResponseDto, updatedBrand, {
      excludeExtraneousValues: true,
    });
  }

  async remove(id: string): Promise<void> {
    const brand = await this.brandRepository.findOne({
      where: { id },
      relations: ['products'],
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID '${id}' not found`);
    }

    // Check if brand has products
    if (brand.products && brand.products.length > 0) {
      throw new BadRequestException(
        'Cannot delete brand with products. Remove products first or reassign them.',
      );
    }

    await this.brandRepository.remove(brand);
  }

  async findBrandsWithProducts(): Promise<BrandResponseDto[]> {
    const brands = await this.brandRepository.find({
      where: { isActive: true },
      relations: ['products'],
      order: { name: 'ASC' },
    });

    // Filter brands that have products
    const brandsWithProducts = brands.filter(
      (brand) => brand.products && brand.products.length > 0,
    );

    return brandsWithProducts.map((brand) =>
      plainToInstance(BrandResponseDto, brand, {
        excludeExtraneousValues: true,
      }),
    );
  }
}
