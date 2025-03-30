import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Season, SeasonSchema } from "./season.schema";
import { Document } from "mongoose";

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

}
export const SerieSchema = SchemaFactory.createForClass(Serie)