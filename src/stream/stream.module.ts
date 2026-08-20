import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Movie, MovieSchema } from 'src/mongoSchema/movie.schema';
import { Serie, SerieSchema } from 'src/mongoSchema/series.schema';
import { StreamController } from './stream.controller';
import { StreamService } from './stream.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Movie.name, schema: MovieSchema },
      { name: Serie.name, schema: SerieSchema },
    ]),
  ],
  controllers: [StreamController],
  providers: [StreamService],
})
export class StreamModule {}