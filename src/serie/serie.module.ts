import { Module } from '@nestjs/common';
import { SerieService } from './serie.service';
import { SerieController } from './serie.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Serie, SerieSchema } from 'src/mongoSchema/series.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Serie.name, schema: SerieSchema }]),
  ],
  providers: [SerieService],
  controllers: [SerieController]
})
export class SerieModule { }