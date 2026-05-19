import { IsOptional, IsString } from 'class-validator';

export class MemberProfileParamsDto {
  @IsString()
  id: string;
}

export class ConsumptionChartQueryDto {
  @IsOptional()
  @IsString()
  months?: string;
}
