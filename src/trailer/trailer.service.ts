import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Video, VideoDocument } from 'src/mongoSchema/trailer.schema';

@Injectable()
export class TrailerService {
    constructor(
        @InjectModel(Video.name) private videoModel: Model<VideoDocument>,
    ) { }
    async saveVideo(id: number, path: string): Promise<Video> {
        const video = new this.videoModel({ id, path })
        return video.save()
    }
    async findById(id: number): Promise<Video | null> {
        return this.videoModel.findOne({ id }).exec()
    }
}
