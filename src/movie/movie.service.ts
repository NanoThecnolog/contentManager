import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Movie } from 'src/mongoSchema/movie.schema';

@Injectable()
export class MovieService {
    constructor(@InjectModel(Movie.name) private movieModel: Model<Movie>) { }

    async create(data: any): Promise<Movie> {
        return this.movieModel.create(data)
    }
    async findAll(): Promise<Movie[]> {
        return this.movieModel.find().exec()
    }
    async findOne(tmdbId: number): Promise<Movie | null> {
        return this.movieModel.findOne({ tmdbId }).exec()
    }
    async findByName(name: string): Promise<Movie[]> {
        return this.movieModel.find({ title: name }).exec()
    }
    async update(tmdbId: number, data: any): Promise<Movie | null> {
        return this.movieModel.findOneAndUpdate({ tmdbId }, data, { new: true }).exec()
    }
    async delete(tmdbId: number): Promise<Movie | null> {
        return this.movieModel.findOneAndDelete({ tmdbId }).exec()
    }
}
