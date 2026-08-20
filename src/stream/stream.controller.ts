import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { SignedUrl, StreamService } from './stream.service';

@ApiTags('Streaming')
@ApiSecurity('api-key')
@Controller('stream')
export class StreamController {
  constructor(private readonly streamService: StreamService) {}

  @Get('/movie/:id')
  @ApiOperation({ summary: 'Gerar URL assinada para filme' })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador no TMDB.' })
  @ApiResponse({ status: 200, description: 'URL assinada gerada.' })
  @ApiResponse({ status: 404, description: 'Filme não encontrado.' })
  signMovie(@Param('id', ParseIntPipe) id: number): Promise<SignedUrl> {
    return this.streamService.signMovie(id);
  }

  @Get('/serie/:tmdbId/:season/:episode')
  @ApiOperation({ summary: 'Gerar URL assinada para episódio' })
  @ApiParam({ name: 'tmdbId', type: Number, description: 'Identificador da série no TMDB.' })
  @ApiParam({ name: 'season', type: Number, description: 'Número da temporada.' })
  @ApiParam({ name: 'episode', type: Number, description: 'Número do episódio.' })
  @ApiResponse({ status: 200, description: 'URL assinada gerada.' })
  @ApiResponse({ status: 404, description: 'Série, temporada ou episódio não encontrado.' })
  signEpisode(
    @Param('tmdbId', ParseIntPipe) tmdbId: number,
    @Param('season', ParseIntPipe) season: number,
    @Param('episode', ParseIntPipe) episode: number,
  ): Promise<SignedUrl> {
    return this.streamService.signEpisode(tmdbId, season, episode);
  }

  @Get('/trailer/:id')
  @ApiOperation({ summary: 'Gerar URL assinada para trailer' })
  @ApiParam({ name: 'id', type: Number, description: 'Identificador do conteúdo no TMDB.' })
  @ApiResponse({ status: 200, description: 'URL assinada gerada.' })
  @ApiResponse({ status: 404, description: 'Trailer não encontrado.' })
  signTrailer(@Param('id', ParseIntPipe) id: number): Promise<SignedUrl> {
    return this.streamService.signTrailer(id);
  }
}