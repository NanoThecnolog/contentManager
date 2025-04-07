import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Serie, SerieSchema } from './mongoSchema/series.schema';
import { SerieModule } from './serie/serie.module';
import { MovieModule } from './movie/movie.module';
import { TrailerService } from './trailer/trailer.service';
import { TrailerController } from './trailer/trailer.controller';
import { TrailerModule } from './trailer/trailer.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/filmes_series'),
    SerieModule,
    MovieModule,
    TrailerModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
