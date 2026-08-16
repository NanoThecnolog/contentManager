import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { LatestEpisode, SerieService } from './serie.service';
import { Serie } from 'src/mongoSchema/series.schema';
import { SerieTmdbResponse, SerieTmdbService } from './serie-tmdb.service';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Séries')
@ApiSecurity('api-key')
@Controller('serie')
export class SerieController {
  constructor(
    private readonly serieService: SerieService,
    private readonly serieTmdbService: SerieTmdbService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Adicionar série ao catálogo' })
  create(@Body() data: any): Promise<Serie> {
    return this.serieService.create(data);
  }
  @Get()
  @ApiOperation({ summary: 'Listar séries cadastradas' })
  findAll(): Promise<Serie[]> {
    return this.serieService.findAll();
  }
  @Get('/latest-episodes')
  @ApiOperation({ summary: 'Listar os episódios adicionados recentemente' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Quantidade máxima de episódios retornados.',
    example: 12,
  })
  findLatestEpisodes(@Query('limit') limit?: string): Promise<LatestEpisode[]> {
    return this.serieService.findLatestEpisodes(Number(limit) || 12);
  }
  @Get('/tmdb')
  @ApiOperation({
    summary: 'Carregar catálogo de séries enriquecido pelo TMDB',
    description:
      'Busca apenas IDs ausentes do cache, consulta o TMDB em português brasileiro e devolve dados e métricas do processamento.',
  })
  findAllTmdb(): Promise<SerieTmdbResponse> {
    return this.serieTmdbService.findAll();
  }
  @Get('/tmdbid/:id')
  @ApiOperation({ summary: 'Buscar série pelo identificador do TMDB' })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador no TMDB.' })
  findOneByTMDBId(@Param('id') id: number): Promise<Serie | null> {
    return this.serieService.findOne(id);
  }
  @Get('/title/:name')
  @ApiOperation({ summary: 'Buscar séries pelo título' })
  @ApiParam({ name: 'name', description: 'Título ou parte do título.' })
  findByName(@Param('name') name: string): Promise<Serie[]> {
    return this.serieService.findByName(name);
  }
  @Put(':id')
  @ApiOperation({ summary: 'Atualizar série do catálogo' })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador no TMDB.' })
  update(@Param('id') id: number, @Body() data: any): Promise<Serie | null> {
    return this.serieService.update(id, data);
  }
  @Post(':id/season')
  @ApiOperation({ summary: 'Adicionar temporada a uma série' })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador no TMDB.' })
  addSeason(@Param('id') id: number, @Body() data: any): Promise<Serie | null> {
    return this.serieService.addSeason(id, data);
  }
  @Post(':id/season/:season/episode')
  @ApiOperation({ summary: 'Adicionar episódio a uma temporada' })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador no TMDB.' })
  @ApiParam({
    name: 'season',
    type: Number,
    description: 'Número da temporada.',
  })
  addEpisode(
    @Param('id') id: number,
    @Param('season') season: number,
    @Body() data: any,
  ): Promise<Serie | null> {
    return this.serieService.addEpisode(id, season, data);
  }
  @Delete(':id')
  @ApiOperation({ summary: 'Remover série do catálogo' })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador no TMDB.' })
  delete(@Param('id') id: number): Promise<Serie | null> {
    return this.serieService.delete(id);
  }

  @Get('verify')
  @ApiOperation({ summary: 'Verificar disponibilidade dos episódios' })
  verifyEpisodeLinks() {
    return this.serieService.verifyEpisodes();
  }
}
