import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ApiDocument = Api & Document;

@Schema({ timestamps: true })
export class Api {
  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: 1 })
  interval: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const ApiSchema = SchemaFactory.createForClass(Api);
