import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { MapService } from './map.service';

@ApiTags('Mapeamento do catálogo')
@ApiSecurity('api-key')
@Controller('map')
export class MapController {
  constructor(private readonly mapService: MapService) {}

  @Get()
  @ApiOperation({ summary: 'Listar identificadores dos filmes do catálogo' })
  async getMovieIDs(): Promise<{ id: number }[]> {
    return this.mapService.findAll();
  }
}
