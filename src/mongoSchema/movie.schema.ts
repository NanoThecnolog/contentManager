import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Model } from "mongoose";

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
    @Prop({ default: "" })
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
    @Prop({ required: true, default: 1 })
    index: number;
    @Prop()
    news?: string;
}
export const MovieSchema = SchemaFactory.createForClass(Movie);

MovieSchema.pre<Movie>("save", async function (next) {
    const Model = this.constructor as Model<Movie>;
    const lastMovie = await Model.findOne().sort({ index: -1 });
    this.index = lastMovie ? lastMovie.index + 1 : 1;
    next();
});