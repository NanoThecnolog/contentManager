import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { MovieService } from './movie.service';
import { Movie } from 'src/mongoSchema/movie.schema';
import { DriveMovie } from 'src/@types/DriveMovies';
import { MovieTmdbResponse, MovieTmdbService } from './movie-tmdb.service';

@Controller('movie')
export class MovieController {
  constructor(
    private readonly movieService: MovieService,
    private readonly movieTmdbService: MovieTmdbService,
  ) {}

  @Post()
  create(@Body() data: any): Promise<Movie> {
    return this.movieService.create(data);
  }
  @Get()
  findAll(): Promise<Movie[]> {
    return this.movieService.findCatalog();
  }
  @Get('/tmdb')
  findAllTmdb(): Promise<MovieTmdbResponse> {
    return this.movieTmdbService.findAll();
  }
  @Get('/tmdbid/:id')
  findOne(@Param('id') id: number): Promise<Movie | null> {
    return this.movieService.findOne(id);
  }
  @Get('/title/:name')
  findByName(@Param('name') name: string): Promise<Movie[]> {
    return this.movieService.findByName(name);
  }
  @Put(':id')
  update(@Param('id') id: number, @Body() data: any): Promise<Movie | null> {
    return this.movieService.update(id, data);
  }
  @Delete(':id')
  delete(@Param('id') id: number): Promise<Movie | null> {
    return this.movieService.delete(id);
  }

  @Get('verify')
  verifyMovieLinks(): Promise<{ count: number; result: DriveMovie[] }> {
    return this.movieService.verifyMovieLinks();
  }
}
