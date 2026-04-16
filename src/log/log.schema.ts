import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LogDocument = Log & Document;

@Schema({ timestamps: true })
export class Log {
  @Prop({ type: Types.ObjectId, ref: 'Api', required: true })
  apiId: Types.ObjectId;

  @Prop({ required: true, enum: ['success', 'fail'] })
  status: string;

  @Prop({ required: true })
  responseTime: number;

  @Prop()
  statusCode: number;

  @Prop()
  errorMessage: string;

  @Prop()
  timestamp: Date;
}

export const LogSchema = SchemaFactory.createForClass(Log);
