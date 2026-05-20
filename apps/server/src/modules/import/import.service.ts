import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as XLSX from 'xlsx';
import { parse as csvParse } from 'csv-parse/sync';
import { ImportEntityType, ImportSummary } from './types';
import { memberImportStrategy } from './strategies/member-import.strategy';
import { serviceImportStrategy } from './strategies/service-import.strategy';

const strategies = {
  members: memberImportStrategy,
  services: serviceImportStrategy,
};

const MEMBER_HEADERS = ['姓名', '手机号', '性别', '生日', '会员等级', '备注'];
const SERVICE_HEADERS = [
  '服务名称',
  '分类名称',
  '价格(分)',
  '时长(分钟)',
  '排序',
];

@Injectable()
export class ImportService {
  constructor(private prisma: PrismaService) {}

  private parseFile(buffer: Buffer): Record<string, unknown>[] {
    const isExcel =
      buffer[0] === 0x50 &&
      buffer[1] === 0x4b &&
      buffer[2] === 0x03 &&
      buffer[3] === 0x04;

    if (isExcel) {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      return XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
        defval: '',
      });
    }

    const csvString = buffer.toString('utf-8');
    return csvParse(csvString, {
      columns: true,
      skip_empty_lines: true,
      bom: true,
    }) as Record<string, unknown>[];
  }

  async importMembers(
    shopId: string,
    file: Express.Multer.File,
    operatorId: string,
  ): Promise<ImportSummary> {
    return this.executeImport(shopId, file, operatorId, 'members');
  }

  async importServices(
    shopId: string,
    file: Express.Multer.File,
    operatorId: string,
  ): Promise<ImportSummary> {
    return this.executeImport(shopId, file, operatorId, 'services');
  }

  private async executeImport(
    shopId: string,
    file: Express.Multer.File,
    operatorId: string,
    type: ImportEntityType,
  ): Promise<ImportSummary> {
    const rows = this.parseFile(file.buffer);
    if (rows.length === 0) {
      throw new BadRequestException('文件内容为空');
    }

    const strategy = strategies[type];
    const results = await Promise.all(
      rows.map((row, index) =>
        strategy.validate(row, index + 2, shopId, this.prisma),
      ),
    );

    const validRows = results
      .filter((r) => r.success)
      .map((r) => rows[r.row - 2]);
    const errors = results
      .filter((r) => !r.success)
      .map((r) => ({ row: r.row, reason: r.error! }));

    let succeeded = 0;
    if (validRows.length > 0) {
      succeeded = await strategy.persist(
        validRows,
        shopId,
        operatorId,
        this.prisma,
      );
    }

    return {
      total: rows.length,
      succeeded,
      failed: errors.length,
      errors,
    };
  }

  async preview(
    shopId: string,
    file: Express.Multer.File,
    type: ImportEntityType,
  ) {
    const rows = this.parseFile(file.buffer);
    const columns =
      rows.length > 0 ? Object.keys(rows[0]) : strategies[type].requiredColumns;

    return {
      rows: rows.slice(0, 10),
      total: rows.length,
      columns,
    };
  }

  async generateTemplate(type: ImportEntityType): Promise<Buffer> {
    const headers = type === 'members' ? MEMBER_HEADERS : SERVICE_HEADERS;
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);

    const colWidths = headers.map((h) => ({ wch: Math.max(h.length * 2, 12) }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '导入模板');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}
