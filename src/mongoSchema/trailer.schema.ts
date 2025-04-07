import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

export type VideoDocument = Video & Document;

@Schema()
export class Video {
    @Prop({ required: true })
    id: string;

    @Prop({ required: true })
    path: string;
}

export const VideoSchema = SchemaFactory.createForClass(Video)