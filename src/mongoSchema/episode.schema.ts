import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Episode extends Document {
    @Prop({ required: true })
    ep: number;

    @Prop({ required: true })
    src: string;

    @Prop({ required: true })
    duration: string;
}

export const EpisodeSchema = SchemaFactory.createForClass(Episode);
