import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as B2 from 'backblaze-b2';
import { Movie } from 'src/mongoSchema/movie.schema';
import { Serie } from 'src/mongoSchema/series.schema';

export interface SignedUrl {
  url: string;
  expiresAt: string;
}

const AUTH_VALIDITY_MS = 23 * 60 * 60 * 1000;
const MIN_URL_TTL_SECONDS = 1;
const MAX_URL_TTL_SECONDS = 604800;

@Injectable()
export class StreamService {
  private readonly logger = new Logger(StreamService.name);
  private b2: B2;
  private authPromise: Promise<void> | null = null;
  private authExpiresAt = 0;
  private bucketId: string | null = null;

  constructor(
    @InjectModel(Movie.name) private movieModel: Model<Movie>,
    @InjectModel(Serie.name) private serieModel: Model<Serie>,
    private readonly configService: ConfigService,
  ) {
    const accountId = this.configService.get<string>('B2_ACCOUNT_ID');
    const applicationKeyId = this.configService.get<string>(
      'B2_APPLICATION_KEY_ID',
    );
    const applicationKey = this.configService.get<string>('B2_APPLICATION_KEY');

    if (!applicationKeyId || !applicationKey) {
      throw new Error('Variáveis de ambiente B2 não configuradas.');
    }

    this.b2 = new B2({
      accountId,
      applicationKeyId,
      applicationKey,
    });
  }

  private async authorize(): Promise<void> {
    if (this.authPromise && Date.now() < this.authExpiresAt) {
      return this.authPromise;
    }

    this.logger.log('Autorizando no Backblaze B2.');
    //this.authExpiresAt = Date.now() + AUTH_VALIDITY_MS;

    const promise = this.b2
      .authorize()
      .then(() => {
        this.authExpiresAt = Date.now() + AUTH_VALIDITY_MS;
        this.logger.log('Autorização B2 concluída.');
      })
      .catch((error) => {
        if (this.authPromise === promise) {
          this.authPromise = null;
          this.authExpiresAt = 0;
        }
        throw error;
      });

    this.authPromise = promise;
    return promise;
  }

  private isExpiredAuthError(error: unknown): boolean {
    const response = (error as { response?: { data?: { code?: string } } })
      ?.response;
    return response?.data?.code === 'expired_auth_token';
  }

  private async withReauthorization<T = any>(
    action: () => Promise<T>,
  ): Promise<T> {
    await this.authorize();
    const usedAuth = this.authPromise;

    try {
      return await action();
    } catch (error) {
      if (!this.isExpiredAuthError(error)) throw error;

      this.logger.warn(
        'Token de autorização B2 expirado. Renovando autorização.',
      );

      if (this.authPromise === usedAuth) {
        this.authPromise = null;
        this.authExpiresAt = 0;
      }

      await this.authorize();
      return action();
    }
  }

  private async getBucketId(): Promise<string> {
    if (this.bucketId) return this.bucketId;

    const bucketName = this.configService.get<string>('B2_BUCKET_NAME');
    if (!bucketName)
      throw new Error('Variável de ambiente B2_BUCKET_NAME não configurada.');

    const response = await this.withReauthorization(() =>
      this.b2.getBucket({ bucketName }),
    );
    this.bucketId = response.data.buckets[0]?.bucketId ?? null;

    if (!this.bucketId) {
      throw new NotFoundException(`Bucket B2 "${bucketName}" não encontrado.`);
    }

    return this.bucketId;
  }

  private extractB2Path(src: string): string {
    const match = src.match(/\/file\/[^/]+\/(.+)$/);
    if (!match) {
      throw new NotFoundException('Conteúdo sem URL assinável no Backblaze.');
    }
    return match[1];
  }

  private getPrefixFromPath(filePath: string): string {
    const lastSlash = filePath.lastIndexOf('/');
    return lastSlash >= 0 ? filePath.slice(0, lastSlash + 1) : '';
  }

  private async signPath(filePath: string): Promise<SignedUrl> {
    const bucketId = await this.getBucketId();
    const bucketName = this.configService.get<string>('B2_BUCKET_NAME') ?? '';
    const ttlSeconds = Math.min(
      Math.max(
        Number(this.configService.get<string>('B2_URL_TTL_SECONDS')) || 3600,
        MIN_URL_TTL_SECONDS,
      ),
      MAX_URL_TTL_SECONDS,
    );

    try {
      const response = await this.withReauthorization(() =>
        this.b2.getDownloadAuthorization({
          bucketId,
          fileNamePrefix: this.getPrefixFromPath(filePath),
          validDurationInSeconds: ttlSeconds,
        }),
      );

      const token = response.data.authorizationToken;
      const downloadUrl = this.b2.downloadUrl;
      const encodedPath = filePath.split('/').map(encodeURIComponent).join('/');

      return {
        url: `${downloadUrl}/file/${bucketName}/${encodedPath}?Authorization=${token}`,
        expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Falha ao assinar a URL do conteúdo: ${message}`,
        stack,
      );
      throw new ServiceUnavailableException(
        'Não foi possível assinar a URL do conteúdo.',
      );
    }
  }

  async signMovie(tmdbId: number): Promise<SignedUrl> {
    const movie = await this.movieModel.findOne({ tmdbId }).exec();
    if (!movie) throw new NotFoundException('Filme não encontrado.');

    return this.signPath(this.extractB2Path(movie.src));
  }

  async signEpisode(
    tmdbId: number,
    season: number,
    episode: number,
  ): Promise<SignedUrl> {
    const serie = await this.serieModel.findOne({ tmdbID: tmdbId }).exec();
    if (!serie) throw new NotFoundException('Série não encontrada.');

    const targetSeason = serie.season.find((s) => s.s === season);
    if (!targetSeason) throw new NotFoundException('Temporada não encontrada.');

    const targetEpisode = targetSeason.episodes.find((ep) => ep.ep === episode);
    if (!targetEpisode) throw new NotFoundException('Episódio não encontrado.');

    return this.signPath(this.extractB2Path(targetEpisode.src));
  }

  async signTrailer(id: number): Promise<SignedUrl> {
    const trailerPath = `videos/trailers/${id}/master.m3u8`;
    return this.signPath(trailerPath);
  }
}
