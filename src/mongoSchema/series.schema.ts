import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Season, SeasonSchema } from "./season.schema";
import { Document, Model } from "mongoose";

@Schema()
export class Serie extends Document {
    @Prop({ required: true })
    background: string;
    @Prop({ required: true })
    overlay: string;
    @Prop({ required: true })
    tmdbID: number;
    @Prop({ required: true })
    title: string;
    @Prop()
    subtitle?: string;
    @Prop({ required: true })
    description: string;
    @Prop({ required: true, default: [] })
    genero: string[];
    @Prop({ required: true })
    faixa: string;
    @Prop({ type: [SeasonSchema], default: [] })
    season: Season[]
    @Prop({ required: true, default: 1 })
    index: number;
    @Prop()
    news?: string

}
export const SerieSchema = SchemaFactory.createForClass(Serie)

SerieSchema.pre<Serie>("save", async function (next) {
    const Model = this.constructor as Model<Serie>;
    const lastSerie = await Model.findOne().sort({ index: -1 });
    this.index = lastSerie ? lastSerie.index + 1 : 1;
    next();
});