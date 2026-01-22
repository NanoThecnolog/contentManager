import { Controller, Get } from '@nestjs/common';
import { MapService } from './map.service';

@Controller('map')
export class MapController {
    constructor(private readonly mapService: MapService) { }

    @Get()
    async getMovieIDs(): Promise<{ id: number }[]> {
        return this.mapService.findAll()
    }
}
