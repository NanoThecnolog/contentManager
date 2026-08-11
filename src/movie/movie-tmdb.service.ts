import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Movie } from 'src/mongoSchema/movie.schema';

type TmdbMovie = Record<string, unknown> & { id: number };

interface TmdbError {
  id: number;
  code: 'TMDB_HTTP_ERROR' | 'TMDB_REQUEST_ERROR';
  message: string;
  status: number | null;
  retryable: boolean;
}

type TmdbResult =
  | { success: true; id: number; data: TmdbMovie }
  | { success: false; error: TmdbError };

interface RequestMetrics {
  tmdbRequests: number;
  retries: number;
  rateLimited: number;
  totalLatencyMs: number;
}

export interface MovieTmdbResponse {
  success: boolean;
  status: 'complete' | 'partial';
  data: TmdbMovie[];
  errors: TmdbError[];
  metrics: {
    catalogSize: number;
    cacheHits: number;
    cacheMisses: number;
    cacheSize: number;
    removedFromCache: number;
    durationMs: number;
    concurrency: number;
    tmdbRequests: number;
    retries: number;
    rateLimited: number;
    failures: number;
    averageLatencyMs: number;
  };
}

const cache = new Map<number, TmdbMovie>();
const inFlightRequests = new Map<number, Promise<TmdbResult>>();
const removedMovieFields = [
  'adult',
  'homepage',
  'imdb_id',
  'origin_country',
  'original_language',
  'production_companies',
  'production_countries',
  'spoken_languages',
  'status',
  'tagline',
  'video',
] as const;

@Injectable()
export class MovieTmdbService {
  private readonly concurrency = 16;
  private readonly maxAttempts = 3;
  private readonly retryInterval = 2_000;

  constructor(
    @InjectModel(Movie.name) private readonly movieModel: Model<Movie>,
    private readonly configService: ConfigService,
  ) {}

  async findAll(): Promise<MovieTmdbResponse> {
    const startedAt = Date.now();
    const token = this.configService.get<string>('TMDB_TOKEN')?.trim();

    if (!token) {
      throw new ServiceUnavailableException({
        code: 'TMDB_CONFIGURATION_ERROR',
        message: 'Token do TMDB não configurado no serviço de conteúdo.',
      });
    }

    let catalogIds: number[];

    try {
      const catalogFilter =
        this.configService.get<string>('NODE_ENV') === 'production'
          ? { src: { $not: /\/\/drive\.google\.com/ } }
          : {};
      const movies = await this.movieModel
        .find(catalogFilter)
        .select({ tmdbId: 1, _id: 0 })
        .lean()
        .exec();

      catalogIds = Array.from(
        new Set(movies.map((movie) => movie.tmdbId).filter(Number.isFinite)),
      );
    } catch {
      throw new ServiceUnavailableException({
        code: 'CATALOG_UNAVAILABLE',
        message: 'Não foi possível consultar os IDs de filmes no catálogo.',
      });
    }

    const catalogIdSet = new Set(catalogIds);
    let removedFromCache = 0;

    for (const cachedId of cache.keys()) {
      if (!catalogIdSet.has(cachedId)) {
        cache.delete(cachedId);
        removedFromCache += 1;
      }
    }

    const cachedResults = new Map<number, TmdbMovie>();
    const missingIds: number[] = [];

    for (const id of catalogIds) {
      const cachedMovie = cache.get(id);
      if (cachedMovie) cachedResults.set(id, cachedMovie);
      else missingIds.push(id);
    }

    const requestMetrics: RequestMetrics = {
      tmdbRequests: 0,
      retries: 0,
      rateLimited: 0,
      totalLatencyMs: 0,
    };
    const fetchedResults = await this.runWithConcurrency(missingIds, (id) =>
      this.fetchMovie(id, token, requestMetrics),
    );
    const errors: TmdbError[] = [];

    for (const result of fetchedResults) {
      if (result.success) cachedResults.set(result.id, result.data);
      else errors.push(result.error);
    }

    const data = catalogIds.flatMap((id) => {
      const movie = cachedResults.get(id);
      return movie ? [movie] : [];
    });
    const response: MovieTmdbResponse = {
      success: errors.length === 0,
      status: errors.length === 0 ? 'complete' : 'partial',
      data,
      errors,
      metrics: {
        catalogSize: catalogIds.length,
        cacheHits: catalogIds.length - missingIds.length,
        cacheMisses: missingIds.length,
        cacheSize: cache.size,
        removedFromCache,
        durationMs: Date.now() - startedAt,
        concurrency: this.concurrency,
        tmdbRequests: requestMetrics.tmdbRequests,
        retries: requestMetrics.retries,
        rateLimited: requestMetrics.rateLimited,
        failures: errors.length,
        averageLatencyMs: requestMetrics.tmdbRequests
          ? Math.round(
              requestMetrics.totalLatencyMs / requestMetrics.tmdbRequests,
            )
          : 0,
      },
    };

    console.log('[TMDB movies] Métricas finais:', response.metrics);
    return response;
  }

  private async fetchMovie(
    id: number,
    token: string,
    metrics: RequestMetrics,
  ): Promise<TmdbResult> {
    const cachedMovie = cache.get(id);
    if (cachedMovie) return { success: true, id, data: cachedMovie };

    const pendingRequest = inFlightRequests.get(id);
    if (pendingRequest) return pendingRequest;

    const request = this.requestMovie(id, token, metrics);
    inFlightRequests.set(id, request);

    try {
      return await request;
    } finally {
      if (inFlightRequests.get(id) === request) inFlightRequests.delete(id);
    }
  }

  private async requestMovie(
    id: number,
    token: string,
    metrics: RequestMetrics,
    attempt = 1,
  ): Promise<TmdbResult> {
    const startedAt = Date.now();
    metrics.tmdbRequests += 1;

    try {
      const url = new URL(`https://api.themoviedb.org/3/movie/${id}`);
      url.searchParams.set('language', 'pt-BR');

      const response = await fetch(url, {
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      metrics.totalLatencyMs += Date.now() - startedAt;
      if (response.status === 429) metrics.rateLimited += 1;

      if (!response.ok) {
        const retryable = response.status === 429 || response.status >= 500;
        if (retryable && attempt < this.maxAttempts) {
          metrics.retries += 1;
          await this.sleep(this.retryInterval * attempt);
          return this.requestMovie(id, token, metrics, attempt + 1);
        }

        return {
          success: false,
          error: {
            id,
            code: 'TMDB_HTTP_ERROR',
            message: `TMDB respondeu com status ${response.status}.`,
            status: response.status,
            retryable,
          },
        };
      }

      const movie = this.removeUnusedFields(
        (await response.json()) as TmdbMovie,
      );
      cache.set(id, movie);
      return { success: true, id, data: movie };
    } catch (error) {
      metrics.totalLatencyMs += Date.now() - startedAt;

      if (attempt < this.maxAttempts) {
        metrics.retries += 1;
        await this.sleep(this.retryInterval * attempt);
        return this.requestMovie(id, token, metrics, attempt + 1);
      }

      return {
        success: false,
        error: {
          id,
          code: 'TMDB_REQUEST_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Falha desconhecida ao consultar o TMDB.',
          status: null,
          retryable: true,
        },
      };
    }
  }

  private async runWithConcurrency<T>(
    items: number[],
    task: (id: number) => Promise<T>,
  ): Promise<T[]> {
    const results = new Array<T>(items.length);
    let nextIndex = 0;

    const worker = async () => {
      while (nextIndex < items.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        results[currentIndex] = await task(items[currentIndex]);
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(this.concurrency, items.length) }, () =>
        worker(),
      ),
    );
    return results;
  }

  private sleep(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  private removeUnusedFields(movie: TmdbMovie): TmdbMovie {
    const sanitizedMovie = { ...movie };
    for (const field of removedMovieFields) delete sanitizedMovie[field];
    return sanitizedMovie;
  }
}
