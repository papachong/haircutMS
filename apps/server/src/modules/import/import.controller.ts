import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  Res,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ImportService } from './import.service';
import { CurrentShop } from '../../common/decorators/current-shop.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ImportEntityType } from './types';

@ApiTags('数据导入')
@ApiBearerAuth()
@Controller('api/v1/import')
export class ImportController {
  constructor(private importService: ImportService) {}

  @Post('members')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  async importMembers(
    @CurrentShop() shopId: string,
    @CurrentUser('staffId') operatorId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('请上传文件');
    }
    return this.importService.importMembers(shopId, file, operatorId);
  }

  @Post('services')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  async importServices(
    @CurrentShop() shopId: string,
    @CurrentUser('staffId') operatorId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('请上传文件');
    }
    return this.importService.importServices(shopId, file, operatorId);
  }

  @Post('preview')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  async preview(
    @CurrentShop() shopId: string,
    @Query('type') type: ImportEntityType,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) {
      throw new BadRequestException('请上传文件');
    }
    if (type !== 'members' && type !== 'services') {
      throw new BadRequestException('type 必须为 members 或 services');
    }
    return this.importService.preview(shopId, file, type);
  }

  @Get('template/:type')
  async downloadTemplate(
    @Param('type') type: ImportEntityType,
    @Res() res: Response,
  ) {
    if (type !== 'members' && type !== 'services') {
      throw new BadRequestException('type 必须为 members 或 services');
    }

    const buffer = await this.importService.generateTemplate(type);
    const fileName =
      type === 'members'
        ? '会员导入模板.xlsx'
        : '服务导入模板.xlsx';

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(fileName)}"`,
    );
    res.setHeader('Content-Length', buffer.length);
    res.status(HttpStatus.OK).send(buffer);
  }
}
