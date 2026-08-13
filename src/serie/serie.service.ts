import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DriveEpisodes, DriveSeries } from 'src/@types/DriveSeries';
import { hiddenSeriesTmdbIds } from 'src/config/hidden-series.config';
import { Serie } from 'src/mongoSchema/series.schema';

export interface LatestEpisode {
  tmdbID: number;
  seasonNumber: number;
  episodeNumber: number;
  language: string;
  addedAt: Date;
}

@Injectable()
export class SerieService {
  constructor(@InjectModel(Serie.name) private serieModel: Model<Serie>) {}

  async create(data: any): Promise<Serie> {
    return this.serieModel.create(this.addCreatedAtToNewEpisodes(data));
  }

  async findAll(): Promise<Serie[]> {
    const series = await this.serieModel.find().exec();

    return series.filter((serie) => !hiddenSeriesTmdbIds.has(serie.tmdbID));
  }

  async findOne(tmdbID: number): Promise<Serie | null> {
    return this.serieModel.findOne({ tmdbID }).exec();
  }
  async findLatestEpisodes(limit = 12): Promise<LatestEpisode[]> {
    const safeLimit = Math.min(Math.max(limit, 1), 30);

    return this.serieModel
      .aggregate<LatestEpisode>([
        {
          $match: {
            news: { $in: ['season', 'episode', 'news'] },
          },
        },
        { $unwind: '$season' },
        { $unwind: '$season.episodes' },
        {
          $set: {
            episodeAddedAt: {
              $ifNull: [
                '$season.episodes.createdAt',
                {
                  $convert: {
                    input: '$season.episodes._id',
                    to: 'date',
                    onError: null,
                    onNull: null,
                  },
                },
              ],
            },
          },
        },
        { $match: { episodeAddedAt: { $ne: null } } },
        { $sort: { episodeAddedAt: -1 } },
        { $limit: safeLimit },
        {
          $project: {
            _id: 0,
            tmdbID: 1,
            seasonNumber: '$season.s',
            episodeNumber: '$season.episodes.ep',
            language: '$season.lang',
            addedAt: '$episodeAddedAt',
          },
        },
      ])
      .exec();
  }
  async findByName(name: string): Promise<Serie[]> {
    return this.serieModel.find({ title: name }).exec();
  }

  async update(tmdbID: number, data: any): Promise<Serie | null> {
    const currentSerie = await this.findOne(tmdbID);
    const preparedData = this.addCreatedAtToNewEpisodes(data, currentSerie);

    return this.serieModel
      .findOneAndUpdate({ tmdbID }, preparedData, { new: true })
      .exec();
  }

  async addSeason(tmdbID: number, newSeason: any): Promise<Serie | null> {
    const preparedSeason = {
      ...newSeason,
      episodes: (newSeason.episodes ?? []).map((episode: any) => ({
        ...episode,
        createdAt: episode.createdAt ?? new Date(),
      })),
    };

    return this.serieModel
      .findOneAndUpdate(
        { tmdbID },
        { $push: { season: preparedSeason } },
        { new: true },
      )
      .exec();
  }

  async addEpisode(
    tmdbID: number,
    seasonNumber: number,
    newEpisode: any,
  ): Promise<Serie | null> {
    return this.serieModel
      .findOneAndUpdate(
        { tmdbID, 'season.s': seasonNumber },
        {
          $push: {
            'season.$.episodes': {
              ...newEpisode,
              createdAt: newEpisode.createdAt ?? new Date(),
            },
          },
        },
        { new: true },
      )
      .exec();
  }

  async delete(tmdbID: number): Promise<Serie | null> {
    return this.serieModel.findOneAndDelete({ tmdbID }).exec();
  }

  private addCreatedAtToNewEpisodes(
    data: any,
    currentSerie?: Serie | null,
  ): any {
    const existingSeasons = new Map(
      currentSerie?.season.map((season) => [season.s, season]) ?? [],
    );

    return {
      ...data,
      season: (data.season ?? []).map((season: any) => {
        const existingSeason = existingSeasons.get(season.s);
        const existingEpisodes = new Map(
          existingSeason?.episodes.map((episode) => [episode.ep, episode]) ??
            [],
        );
        const episodeCountIncreased =
          (season.episodes?.length ?? 0) >
          (existingSeason?.episodes.length ?? 0);
        const claimedEpisodeIds = new Set(
          (season.episodes ?? []).flatMap((episode: any) => {
            const existingEpisode = existingEpisodes.get(episode.ep);

            return existingEpisode ? [String(existingEpisode._id)] : [];
          }),
        );

        return {
          ...season,
          episodes: (season.episodes ?? []).map((episode: any) => {
            const existingEpisode = existingEpisodes.get(episode.ep);

            if (existingEpisode) {
              return {
                ...episode,
                _id: existingEpisode._id,
                createdAt: existingEpisode.createdAt,
              };
            }

            if (!episodeCountIncreased) {
              const replacedEpisode = existingSeason?.episodes.find(
                (currentEpisode) =>
                  !claimedEpisodeIds.has(String(currentEpisode._id)),
              );

              if (replacedEpisode) {
                claimedEpisodeIds.add(String(replacedEpisode._id));

                return {
                  ...episode,
                  _id: replacedEpisode._id,
                  createdAt: replacedEpisode.createdAt,
                };
              }
            }

            return {
              ...episode,
              ...(episodeCountIncreased
                ? { createdAt: episode.createdAt ?? new Date() }
                : {}),
            };
          }),
        };
      }),
    };
  }

  async verifyEpisodes() {
    const series = await this.serieModel.find().exec();

    const driveDomain = 'drive.google.com';

    const driveSeries = series
      .map((serie) => {
        const episodes = serie.season.flatMap((season): DriveEpisodes[] => {
          return season.episodes
            .filter((episode) => episode.src?.includes(driveDomain))
            .map(
              (episode): DriveEpisodes => ({
                season: season.s,
                episode: episode.ep,
                src: episode.src,
              }),
            );
        });
        if (!episodes.length) return null;

        return {
          title: serie.title,
          subtitle: serie.subtitle ?? '',
          tmdbId: serie.tmdbID,
          episodes,
          count: episodes.length,
        };
      })
      .filter((serie): serie is DriveSeries => serie !== null);

    return { count: driveSeries.length, result: driveSeries };
  }
}
