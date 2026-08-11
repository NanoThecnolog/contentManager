import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Serie } from 'src/mongoSchema/series.schema';

type TmdbSerie = Record<string, unknown> & { id: number };

interface TmdbError {
  id: number;
  code: 'TMDB_HTTP_ERROR' | 'TMDB_REQUEST_ERROR';
  message: string;
  status: number | null;
  retryable: boolean;
}

type TmdbResult =
  | { success: true; id: number; data: TmdbSerie }
  | { success: false; error: TmdbError };

interface RequestMetrics {
  tmdbRequests: number;
  retries: number;
  rateLimited: number;
  totalLatencyMs: number;
}

export interface SerieTmdbResponse {
  success: boolean;
  status: 'complete' | 'partial';
  data: TmdbSerie[];
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

const cache = new Map<number, TmdbSerie>();
const inFlightRequests = new Map<number, Promise<TmdbResult>>();
const removedSerieFields = [
  'adult',
  'created_by',
  'episode_run_time',
  'homepage',
  'languages',
  'last_air_date',
  'last_episode_to_air',
  'networks',
  'next_episode_to_air',
  'number_of_episodes',
  'number_of_seasons',
  'origin_country',
  'original_language',
  'production_companies',
  'production_countries',
  'spoken_languages',
  'type',
] as const;

@Injectable()
export class SerieTmdbService {
  private readonly concurrency = 16;
  private readonly maxAttempts = 3;
  private readonly retryInterval = 2_000;

  constructor(
    @InjectModel(Serie.name) private readonly serieModel: Model<Serie>,
    private readonly configService: ConfigService,
  ) {}

  async findAll(): Promise<SerieTmdbResponse> {
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
      const series = await this.serieModel
        .find()
        .select({ tmdbID: 1, _id: 0 })
        .lean()
        .exec();

      catalogIds = Array.from(
        new Set(series.map((serie) => serie.tmdbID).filter(Number.isFinite)),
      );
    } catch {
      throw new ServiceUnavailableException({
        code: 'CATALOG_UNAVAILABLE',
        message: 'Não foi possível consultar os IDs de séries no catálogo.',
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

    const cachedResults = new Map<number, TmdbSerie>();
    const missingIds: number[] = [];

    for (const id of catalogIds) {
      const cachedSerie = cache.get(id);
      if (cachedSerie) cachedResults.set(id, cachedSerie);
      else missingIds.push(id);
    }

    const requestMetrics: RequestMetrics = {
      tmdbRequests: 0,
      retries: 0,
      rateLimited: 0,
      totalLatencyMs: 0,
    };
    const fetchedResults = await this.runWithConcurrency(missingIds, (id) =>
      this.fetchSerie(id, token, requestMetrics),
    );
    const errors: TmdbError[] = [];

    for (const result of fetchedResults) {
      if (result.success) cachedResults.set(result.id, result.data);
      else errors.push(result.error);
    }

    const data = catalogIds.flatMap((id) => {
      const serie = cachedResults.get(id);
      return serie ? [serie] : [];
    });
    const response: SerieTmdbResponse = {
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

    console.log('[TMDB series] Métricas finais:', response.metrics);
    return response;
  }

  private async fetchSerie(
    id: number,
    token: string,
    metrics: RequestMetrics,
  ): Promise<TmdbResult> {
    const cachedSerie = cache.get(id);
    if (cachedSerie) return { success: true, id, data: cachedSerie };

    const pendingRequest = inFlightRequests.get(id);
    if (pendingRequest) return pendingRequest;

    const request = this.requestSerie(id, token, metrics);
    inFlightRequests.set(id, request);

    try {
      return await request;
    } finally {
      if (inFlightRequests.get(id) === request) inFlightRequests.delete(id);
    }
  }

  private async requestSerie(
    id: number,
    token: string,
    metrics: RequestMetrics,
    attempt = 1,
  ): Promise<TmdbResult> {
    const startedAt = Date.now();
    metrics.tmdbRequests += 1;

    try {
      const url = new URL(`https://api.themoviedb.org/3/tv/${id}`);
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
          return this.requestSerie(id, token, metrics, attempt + 1);
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

      const serie = this.removeUnusedFields(
        (await response.json()) as TmdbSerie,
      );
      cache.set(id, serie);
      return { success: true, id, data: serie };
    } catch (error) {
      metrics.totalLatencyMs += Date.now() - startedAt;

      if (attempt < this.maxAttempts) {
        metrics.retries += 1;
        await this.sleep(this.retryInterval * attempt);
        return this.requestSerie(id, token, metrics, attempt + 1);
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

  private removeUnusedFields(serie: TmdbSerie): TmdbSerie {
    const sanitizedSerie = { ...serie };
    for (const field of removedSerieFields) delete sanitizedSerie[field];
    return sanitizedSerie;
  }
}
