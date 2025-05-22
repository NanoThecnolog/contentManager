import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Episode, EpisodeSchema } from './episode.schema';

@Schema()
export class Season extends Document {
    @Prop({ required: true })
    s: number;

    @Prop({ required: true })
    lang: string;

    @Prop({ type: [EpisodeSchema], default: [] })
    episodes: Episode[];
}

export const SeasonSchema = SchemaFactory.createForClass(Season);