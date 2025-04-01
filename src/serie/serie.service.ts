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
    async findByName(name: string): Promise<Serie[]> {
        return this.serieModel.find({ title: name }).exec()
    }

    async update(tmdbID: number, data: any): Promise<Serie | null> {
        return this.serieModel.findOneAndUpdate({ tmdbID }, data, { new: true }).exec()
    }

    async addSeason(tmdbID: number, newSeason: any): Promise<Serie | null> {
        return this.serieModel.findOneAndUpdate(
            { tmdbID },
            { $push: { season: newSeason } },
            { new: true }
        ).exec()
    }

    async addEpisode(tmdbID: number, seasonIndex: number, newEpisode: any): Promise<Serie | null> {
        return this.serieModel.findOneAndUpdate(
            { tmdbID, 'season._id': this.serieModel[seasonIndex]._id },
            { $push: { 'season.$.episodes': newEpisode } },
            { new: true }
        ).exec()
    }

    async delete(tmdbID: number): Promise<Serie | null> {
        return this.serieModel.findOneAndDelete({ tmdbID }).exec();
    }
}
