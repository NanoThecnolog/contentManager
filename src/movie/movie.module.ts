import { Module } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { Movie, MovieSchema } from 'src/mongoSchema/movie.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { MovieTmdbService } from './movie-tmdb.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Movie.name, schema: MovieSchema }]),
  ],
  providers: [MovieService, MovieTmdbService],
  controllers: [MovieController],
})
export class MovieModule {}
