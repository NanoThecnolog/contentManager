import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Video, VideoSchema } from 'src/mongoSchema/trailer.schema';
import { TrailerController } from './trailer.controller';
import { TrailerService } from './trailer.service';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Video.name, schema: VideoSchema }])
    ],
    controllers: [TrailerController],
    providers: [TrailerService]
})
export class TrailerModule { }
