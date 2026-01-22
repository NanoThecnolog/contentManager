import { Module } from '@nestjs/common';
import { MapController } from './map.controller';
import { MapService } from './map.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Movie, MovieSchema } from 'src/mongoSchema/movie.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Movie.name, schema: MovieSchema }])
  ],
  controllers: [MapController],
  providers: [MapService]
})
export class MapModule { }
