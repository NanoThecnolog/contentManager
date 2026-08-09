import { Module } from '@nestjs/common';
import { SerieService } from './serie.service';
import { SerieController } from './serie.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Serie, SerieSchema } from 'src/mongoSchema/series.schema';
import { SerieTmdbService } from './serie-tmdb.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Serie.name, schema: SerieSchema }]),
  ],
  providers: [SerieService, SerieTmdbService],
  controllers: [SerieController],
})
export class SerieModule {}
