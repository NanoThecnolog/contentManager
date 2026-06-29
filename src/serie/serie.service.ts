import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DriveEpisodes, DriveSeries } from 'src/@types/DriveSeries';
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

    async addEpisode(tmdbID: number, seasonNumber: number, newEpisode: any): Promise<Serie | null> {
        return this.serieModel.findOneAndUpdate(
            { tmdbID, 'season.s': seasonNumber },
            { $push: { 'season.$.episodes': newEpisode } },
            { new: true }
        ).exec()
    }

    async delete(tmdbID: number): Promise<Serie | null> {
        return this.serieModel.findOneAndDelete({ tmdbID }).exec();
    }

    async verifyEpisodes() {
        const series = await this.findAll()

        const driveDomain = "drive.google.com"

        const driveSeries = series
            .map(serie => {
                const episodes = serie.season.flatMap((season): DriveEpisodes[] => {
                    return season.episodes
                        .filter((episode) => episode.src?.includes(driveDomain))
                        .map((episode): DriveEpisodes => ({
                            season: season.s,
                            episode: episode.ep,
                            src: episode.src
                        }))
                })
                if (!episodes.length) return null

                return {
                    title: serie.title,
                    subtitle: serie.subtitle ?? "",
                    tmdbId: serie.tmdbID,
                    episodes,
                    count: episodes.length
                }
            }).filter((serie): serie is DriveSeries => serie !== null)

        return { count: driveSeries.length, result: driveSeries }

    }
}
