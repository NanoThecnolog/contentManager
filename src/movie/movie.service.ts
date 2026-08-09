import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DriveMovie } from 'src/@types/DriveMovies';
import { Movie } from 'src/mongoSchema/movie.schema';
import { ConfigService } from '@nestjs/config';

const escapeRegex = (value: string) => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class MovieService {
    constructor(
        @InjectModel(Movie.name) private movieModel: Model<Movie>,
        private readonly configService: ConfigService,
    ) { }

    async create(data: Partial<Movie>): Promise<Movie> {
        return this.movieModel.create(data)
    }
    async findAll(): Promise<Movie[]> {
        return this.movieModel.find().exec()
    }
    async findCatalog(): Promise<Movie[]> {
        const catalogFilter =
            this.configService.get<string>('NODE_ENV') === 'production'
                ? { src: { $not: /\/\/drive\.google\.com/ } }
                : {}

        return this.movieModel.find(catalogFilter).exec()
    }
    async findOne(tmdbId: number): Promise<Movie | null> {
        return this.movieModel.findOne({ tmdbId }).exec()
    }
    async findByName(name: string): Promise<Movie[]> {
        return this.movieModel.find({
            title: {
                $regex: `${escapeRegex(name)}$`,
                $options: 'i'
            }
        }).exec();
    }
    async update(tmdbId: number, data: Partial<Movie>): Promise<Movie | null> {
        return this.movieModel.findOneAndUpdate({ tmdbId }, data, { new: true, runValidators: true }).exec()
    }
    async delete(tmdbId: number): Promise<Movie | null> {
        return this.movieModel.findOneAndDelete({ tmdbId }).exec()
    }

    async verifyMovieLinks(): Promise<{ count: number, result: DriveMovie[] }> {
        const driveDomain = "drive.google.com"
        const movies = await this.findAll()

        let driveMovies: DriveMovie[] = []

        for (const movie of movies) {
            if (!movie.src.includes(driveDomain)) continue

            driveMovies.push({
                title: movie.title ?? "",
                subtitle: movie.subtitle ?? "",
                src: movie.src ?? "",
                tmdbId: movie.tmdbId ?? 0
            })
        }

        return { count: driveMovies.length, result: driveMovies }
    }
}
