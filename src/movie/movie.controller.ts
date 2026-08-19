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
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Filmes')
@ApiSecurity('api-key')
@Controller('movie')
export class MovieController {
  constructor(
    private readonly movieService: MovieService,
    private readonly movieTmdbService: MovieTmdbService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Adicionar filme ao catálogo' })
  @ApiResponse({ status: 201, description: 'Filme adicionado ao catálogo.' })
  create(@Body() data: any): Promise<Movie> {
    return this.movieService.create(data);
  }
  @Get()
  @ApiOperation({ summary: 'Listar filmes cadastrados' })
  findAll(): Promise<Movie[]> {
    return this.movieService.findCatalog();
  }
  @Get('/tmdb')
  @ApiOperation({
    summary: 'Carregar catálogo de filmes enriquecido pelo TMDB',
    description:
      'Busca apenas IDs ausentes do cache, consulta o TMDB em português brasileiro e devolve dados e métricas do processamento.',
  })
  findAllTmdb(): Promise<MovieTmdbResponse> {
    return this.movieTmdbService.findAll();
  }
  @Get('/tmdbid/:id')
  @ApiOperation({ summary: 'Buscar filme pelo identificador do TMDB' })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador no TMDB.' })
  findOne(@Param('id') id: number): Promise<Movie | null> {
    return this.movieService.findOne(id);
  }
  @Get('/title/:name')
  @ApiOperation({ summary: 'Buscar filmes pelo título' })
  @ApiParam({ name: 'name', description: 'Título ou parte do título.' })
  findByName(@Param('name') name: string): Promise<Movie[]> {
    return this.movieService.findByName(name);
  }
  @Get('/mp4')
  @ApiOperation({ summary: 'Listar filmes com arquivos em MP4' })
  findByMp4Src(): Promise<Movie[]> {
    return this.movieService.findByMp4Src();
  }
  @Put(':id')
  @ApiOperation({ summary: 'Atualizar filme do catálogo' })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador no TMDB.' })
  update(
    @Param('id') id: number,
    @Body() data: any,
  ): Promise<Movie | null> {
    return this.movieService.update(id, data);
  }
  @Delete(':id')
  @ApiOperation({ summary: 'Remover filme do catálogo' })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador no TMDB.' })
  delete(@Param('id') id: number): Promise<Movie | null> {
    return this.movieService.delete(id);
  }

  @Get('verify')
  @ApiOperation({ summary: 'Verificar disponibilidade dos arquivos de filmes' })
  verifyMovieLinks(): Promise<{ count: number; result: DriveMovie[] }> {
    return this.movieService.verifyMovieLinks();
  }
}
