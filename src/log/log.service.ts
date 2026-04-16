import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Log, LogDocument } from './log.schema';

@Injectable()
export class LogService {
  constructor(@InjectModel(Log.name) private logModel: Model<LogDocument>) {}

  async create(createLogDto: {
    apiId: string;
    status: string;
    responseTime: number;
    statusCode?: number;
    errorMessage?: string;
  }): Promise<Log> {
    const createdLog = new this.logModel({
      ...createLogDto,
      timestamp: new Date(),
    });
    return createdLog.save();
  }

  async findAll(): Promise<Log[]> {
    return this.logModel.find().populate('apiId', 'name url').sort({ timestamp: -1 }).exec();
  }

  async findByApiId(apiId: string): Promise<Log[]> {
    return this.logModel.find({ apiId }).sort({ timestamp: -1 }).exec();
  }

  async getLatestStatus(apiId: string): Promise<Log | null> {
    return this.logModel.findOne({ apiId }).sort({ timestamp: -1 }).exec();
  }
}
