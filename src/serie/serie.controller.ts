import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { SerieService } from './serie.service';
import { Serie } from 'src/mongoSchema/series.schema';

@Controller('serie')
export class SerieController {
    constructor(private readonly serieService: SerieService) { }

    @Post()
    create(@Body() data: any): Promise<Serie> {
        return this.serieService.create(data)
    }
    @Get()
    findAll(): Promise<Serie[]> {
        return this.serieService.findAll()
    }
    @Get('/tmdbid/:id')
    findOneByTMDBId(@Param('id') id: number): Promise<Serie | null> {
        return this.serieService.findOne(id)
    }
    @Get('/title/:name')
    findByName(@Param('name') name: string): Promise<Serie[]> {
        return this.serieService.findByName(name)
    }
    @Put(':id')
    update(@Param('id') id: number, @Body() data: any): Promise<Serie | null> {
        return this.serieService.update(id, data)
    }
    @Post(':id/season')
    addSeason(@Param('id') id: number, @Body() data: any): Promise<Serie | null> {
        return this.serieService.addSeason(id, data)
    }
    @Post(':id/season/:season/episode')
    addEpisode(@Param('id') id: number, @Param('season') season: number, @Body() data: any): Promise<Serie | null> {
        return this.serieService.addEpisode(id, (season - 1), data)
    }
    @Delete(':id')
    delete(@Param('id') id: number): Promise<Serie | null> {
        return this.serieService.delete(id)
    }
}
