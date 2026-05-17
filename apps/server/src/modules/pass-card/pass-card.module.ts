import { Module } from '@nestjs/common';
import { PassCardController } from './pass-card.controller';
import { PassCardService } from './pass-card.service';

@Module({
  controllers: [PassCardController],
  providers: [PassCardService],
  exports: [PassCardService],
})
export class PassCardModule {}