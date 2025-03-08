import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { Banner, BannerPosition, BannerType } from './entities/banner.entity';

@Injectable()
export class BannerService {
  constructor(
    @InjectRepository(Banner)
    private bannerRepository: Repository<Banner>,
  ) {}

  async findAll(): Promise<Banner[]> {
    return this.bannerRepository.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC' },
    });
  }

  async findByPosition(position: BannerPosition): Promise<Banner[]> {
    return this.bannerRepository.find({
      where: { position, isActive: true },
      order: { displayOrder: 'ASC' },
    });
  }

  async findByType(type: BannerType): Promise<Banner[]> {
    return this.bannerRepository.find({
      where: { type, isActive: true },
      order: { displayOrder: 'ASC' },
    });
  }

  async findActivePromotions(): Promise<Banner[]> {
    const now = new Date();
    return this.bannerRepository.find({
      where: {
        type: BannerType.PROMOTION,
        isActive: true,
        startDate: LessThanOrEqual(now),
        endDate: MoreThanOrEqual(now),
      },
      order: { displayOrder: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Banner> {
    const banner = await this.bannerRepository.findOne({
      where: { id },
      relations: ['products', 'categories'],
    });

    if (!banner) {
      throw new NotFoundException(`Banner with ID ${id} not found`);
    }

    return banner;
  }

  async create(createBannerDto: Partial<Banner>): Promise<Banner> {
    const banner = this.bannerRepository.create(createBannerDto);
    return this.bannerRepository.save(banner);
  }

  async update(id: string, updateBannerDto: Partial<Banner>): Promise<Banner> {
    const banner = await this.findOne(id);
    Object.assign(banner, updateBannerDto);
    return this.bannerRepository.save(banner);
  }

  async remove(id: string): Promise<void> {
    const banner = await this.findOne(id);
    await this.bannerRepository.remove(banner);
  }
}
