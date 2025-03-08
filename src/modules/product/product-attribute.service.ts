import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { ProductAttribute } from './entities/product-attribute.entity';
import { ProductAttributeValue } from './entities/product-attribute-value.entity';
import {
  CreateProductAttributeDto,
  UpdateProductAttributeDto,
  ProductAttributeResponseDto,
} from './dto';

@Injectable()
export class ProductAttributeService {
  constructor(
    @InjectRepository(ProductAttribute)
    private attributeRepository: Repository<ProductAttribute>,
    @InjectRepository(ProductAttributeValue)
    private attributeValueRepository: Repository<ProductAttributeValue>,
  ) {}

  async create(
    createAttributeDto: CreateProductAttributeDto,
  ): Promise<ProductAttributeResponseDto> {
    // Check if attribute with same name already exists
    const existingAttribute = await this.attributeRepository.findOne({
      where: { name: createAttributeDto.name },
    });

    if (existingAttribute) {
      throw new BadRequestException(
        `Attribute with name '${createAttributeDto.name}' already exists`,
      );
    }

    // Create attribute
    const attribute = this.attributeRepository.create({
      name: createAttributeDto.name,
      description: createAttributeDto.description,
      isActive: createAttributeDto.isActive,
      displayOrder: createAttributeDto.displayOrder,
    });

    // Save attribute
    const savedAttribute = await this.attributeRepository.save(attribute);

    // Return response
    return plainToInstance(ProductAttributeResponseDto, savedAttribute, {
      excludeExtraneousValues: true,
    });
  }

  async findAll(): Promise<ProductAttributeResponseDto[]> {
    const attributes = await this.attributeRepository.find({
      relations: ['values'],
      order: {
        displayOrder: 'ASC',
        name: 'ASC',
      },
    });

    return attributes.map((attribute) =>
      plainToInstance(ProductAttributeResponseDto, attribute, {
        excludeExtraneousValues: true,
      }),
    );
  }

  async findOne(id: string): Promise<ProductAttributeResponseDto> {
    const attribute = await this.attributeRepository.findOne({
      where: { id },
      relations: ['values'],
    });

    if (!attribute) {
      throw new NotFoundException(`Attribute with id ${id} not found`);
    }

    return plainToInstance(ProductAttributeResponseDto, attribute, {
      excludeExtraneousValues: true,
    });
  }

  async update(
    id: string,
    updateAttributeDto: UpdateProductAttributeDto,
  ): Promise<ProductAttributeResponseDto> {
    const attribute = await this.attributeRepository.findOne({
      where: { id },
    });

    if (!attribute) {
      throw new NotFoundException(`Attribute with id ${id} not found`);
    }

    // Check if attribute with same name already exists (if name is being updated)
    if (updateAttributeDto.name && updateAttributeDto.name !== attribute.name) {
      const existingAttribute = await this.attributeRepository.findOne({
        where: { name: updateAttributeDto.name, id: Not(id) },
      });

      if (existingAttribute) {
        throw new BadRequestException(
          `Attribute with name '${updateAttributeDto.name}' already exists`,
        );
      }
    }

    // Update attribute
    if (updateAttributeDto.name) attribute.name = updateAttributeDto.name;
    if (updateAttributeDto.description !== undefined)
      attribute.description = updateAttributeDto.description;
    if (updateAttributeDto.isActive !== undefined)
      attribute.isActive = updateAttributeDto.isActive;
    if (updateAttributeDto.displayOrder !== undefined)
      attribute.displayOrder = updateAttributeDto.displayOrder;

    // Save attribute
    const updatedAttribute = await this.attributeRepository.save(attribute);

    // Return response
    return this.findOne(updatedAttribute.id);
  }

  async remove(id: string): Promise<void> {
    const attribute = await this.attributeRepository.findOne({
      where: { id },
      relations: ['values'],
    });

    if (!attribute) {
      throw new NotFoundException(`Attribute with id ${id} not found`);
    }

    // Delete attribute values
    if (attribute.values && attribute.values.length > 0) {
      await this.attributeValueRepository.delete({
        attributeId: id,
      });
    }

    // Delete attribute
    await this.attributeRepository.delete(id);
  }

  async addAttributeValue(
    attributeId: string,
    value: string,
    description?: string,
    colorCode?: string,
  ): Promise<ProductAttributeResponseDto> {
    const attribute = await this.attributeRepository.findOne({
      where: { id: attributeId },
      relations: ['values'],
    });

    if (!attribute) {
      throw new NotFoundException(`Attribute with id ${attributeId} not found`);
    }

    // Check if value already exists for this attribute
    const existingValue = attribute.values.find((v) => v.value === value);
    if (existingValue) {
      throw new BadRequestException(
        `Value '${value}' already exists for attribute '${attribute.name}'`,
      );
    }

    // Create attribute value
    const attributeValue = this.attributeValueRepository.create({
      attributeId,
      value,
      description,
      colorCode,
    });

    // Save attribute value
    await this.attributeValueRepository.save(attributeValue);

    // Return updated attribute
    return this.findOne(attributeId);
  }

  async removeAttributeValue(
    attributeId: string,
    valueId: string,
  ): Promise<ProductAttributeResponseDto> {
    const attribute = await this.attributeRepository.findOne({
      where: { id: attributeId },
      relations: ['values'],
    });

    if (!attribute) {
      throw new NotFoundException(`Attribute with id ${attributeId} not found`);
    }

    // Check if value exists
    const valueExists = attribute.values.some((v) => v.id === valueId);
    if (!valueExists) {
      throw new NotFoundException(
        `Value with id ${valueId} not found for attribute '${attribute.name}'`,
      );
    }

    // Delete attribute value
    await this.attributeValueRepository.delete(valueId);

    // Return updated attribute
    return this.findOne(attributeId);
  }
}
