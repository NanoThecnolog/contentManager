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
    @Get('/all')
    findAll(): Promise<Serie[]> {
        return this.serieService.findAll()
    }
    @Get(':id')
    findOne(@Param('id') id: number): Promise<Serie | null> {
        return this.serieService.findOne(id)
    }
    @Put(':id')
    update(@Param('id') id: number, @Body() data: any): Promise<Serie | null> {
        return this.serieService.update(id, data)
    }
    @Delete(':id')
    delete(@Param('id') id: number): Promise<Serie | null> {
        return this.serieService.delete(id)
    }
}
