import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 通用 API 响应 DTO
 * 所有接口统一返回此格式
 */
export class ApiResponseDto<T> {
  @ApiProperty({
    description: '状态码，0 表示成功',
    example: 0,
  })
  code: number;

  @ApiProperty({
    description: '响应消息',
    example: 'ok',
  })
  message: string;

  @ApiProperty({
    description: '响应数据',
  })
  data: T;
}

/**
 * 分页元数据 DTO
 */
export class PaginationMetaDto {
  @ApiProperty({
    description: '总记录数',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: '当前页码',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: '每页数量',
    example: 20,
  })
  pageSize: number;

  @ApiProperty({
    description: '总页数',
    example: 5,
  })
  totalPages: number;
}

/**
 * 分页响应数据 DTO
 */
export class PaginatedDataDto<T> {
  @ApiProperty({
    description: '数据列表',
    isArray: true,
  })
  list: T[];

  @ApiProperty({
    description: '分页信息',
    type: PaginationMetaDto,
  })
  pagination: PaginationMetaDto;
}

/**
 * 分页 API 响应 DTO
 */
export class PaginatedResponseDto<T> extends ApiResponseDto<PaginatedDataDto<T>> {
  data: PaginatedDataDto<T>;
}
