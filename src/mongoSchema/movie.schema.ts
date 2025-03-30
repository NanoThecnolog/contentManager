import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ collection: 'movies' })
export class Movie extends Document {
    @Prop({ required: true })
    background: string;
    @Prop({ required: true })
    overlay: string;
    @Prop({ required: true })
    tmdbId: number;
    @Prop({ required: true })
    title: string;
    @Prop({ required: true })
    subtitle: string;
    @Prop({ required: true })
    description: string;
    @Prop({ required: true })
    faixa: string;
    @Prop({ required: true })
    src: string;
    @Prop({ required: true })
    duration: string;
    @Prop({ required: true, default: [] })
    genero: string[];
}
export const MovieSchema = SchemaFactory.createForClass(Movie);