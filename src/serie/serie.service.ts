import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Serie } from 'src/mongoSchema/series.schema';

@Injectable()
export class SerieService {
    constructor(@InjectModel(Serie.name) private serieModel: Model<Serie>) { }

    async create(data: any): Promise<Serie> {
        return this.serieModel.create(data)
    }

    async findAll(): Promise<Serie[]> {
        return this.serieModel.find().exec()
    }

    async findOne(tmdbID: number): Promise<Serie | null> {
        return this.serieModel.findOne({ tmdbID }).exec()
    }

    async update(tmdbID: number, data: any): Promise<Serie | null> {
        return this.serieModel.findOneAndUpdate({ tmdbID }, data, { new: true }).exec()
    }

    async delete(tmdbID: number): Promise<Serie | null> {
        return this.serieModel.findOneAndDelete({ tmdbID }).exec();
    }
}
