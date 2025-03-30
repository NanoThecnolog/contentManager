import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { MovieService } from './movie.service';
import { Movie } from 'src/mongoSchema/movie.schema';

@Controller('movie')
export class MovieController {
    constructor(private readonly movieService: MovieService) { }

    @Post()
    create(@Body() data: any): Promise<Movie> {
        return this.movieService.create(data)
    }
    @Get('/all')
    findAll(): Promise<Movie[]> {
        return this.movieService.findAll()
    }
    @Get(':id')
    findOne(@Param('id') id: number): Promise<Movie | null> {
        return this.movieService.findOne(id)
    }
    @Put(':id')
    update(@Param('id') id: number, @Body() data: any): Promise<Movie | null> {
        return this.movieService.update(id, data)
    }
    @Delete(':id')
    delete(@Param('id') id: number): Promise<Movie | null> {
        return this.movieService.delete(id)
    }
}
