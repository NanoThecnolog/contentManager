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

@Controller('serie')
export class SerieController {
  constructor(
    private readonly serieService: SerieService,
    private readonly serieTmdbService: SerieTmdbService,
  ) {}

  @Post()
  create(@Body() data: any): Promise<Serie> {
    return this.serieService.create(data);
  }
  @Get()
  findAll(): Promise<Serie[]> {
    return this.serieService.findAll();
  }
  @Get('/latest-episodes')
  findLatestEpisodes(@Query('limit') limit?: string): Promise<LatestEpisode[]> {
    return this.serieService.findLatestEpisodes(Number(limit) || 12);
  }
  @Get('/tmdb')
  findAllTmdb(): Promise<SerieTmdbResponse> {
    return this.serieTmdbService.findAll();
  }
  @Get('/tmdbid/:id')
  findOneByTMDBId(@Param('id') id: number): Promise<Serie | null> {
    return this.serieService.findOne(id);
  }
  @Get('/title/:name')
  findByName(@Param('name') name: string): Promise<Serie[]> {
    return this.serieService.findByName(name);
  }
  @Put(':id')
  update(@Param('id') id: number, @Body() data: any): Promise<Serie | null> {
    return this.serieService.update(id, data);
  }
  @Post(':id/season')
  addSeason(@Param('id') id: number, @Body() data: any): Promise<Serie | null> {
    return this.serieService.addSeason(id, data);
  }
  @Post(':id/season/:season/episode')
  addEpisode(
    @Param('id') id: number,
    @Param('season') season: number,
    @Body() data: any,
  ): Promise<Serie | null> {
    return this.serieService.addEpisode(id, season, data);
  }
  @Delete(':id')
  delete(@Param('id') id: number): Promise<Serie | null> {
    return this.serieService.delete(id);
  }

  @Get('verify')
  verifyEpisodeLinks() {
    return this.serieService.verifyEpisodes();
  }
}
