import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Movie } from 'src/mongoSchema/movie.schema';

@Injectable()
export class MapService {
    constructor(@InjectModel(Movie.name) private movieModel: Model<Movie>) { }

    async findAll(): Promise<{ id: number }[]> {
        const movies = this.movieModel.find().exec()
        return (await movies).map(m => ({ id: m.tmdbId }))
    }
}
