import { Expose } from 'class-transformer';

export class PaginationMetaDto {
  @Expose()
  page: number;

  @Expose()
  limit: number;

  @Expose()
  totalItems: number;

  @Expose()
  totalPages: number;

  @Expose()
  hasNextPage: boolean;

  @Expose()
  hasPreviousPage: boolean;

  constructor(page: number, limit: number, totalItems: number) {
    this.page = page;
    this.limit = limit;
    this.totalItems = totalItems;
    this.totalPages = Math.ceil(totalItems / limit);
    this.hasNextPage = page < this.totalPages;
    this.hasPreviousPage = page > 1;
  }
}

export class PaginationResponseDto<T> {
  @Expose()
  data: T[];

  @Expose()
  meta: PaginationMetaDto;

  constructor(data: T[], page: number, limit: number, totalItems: number) {
    this.data = data;
    this.meta = new PaginationMetaDto(page, limit, totalItems);
  }
}
