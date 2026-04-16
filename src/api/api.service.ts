import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Api, ApiDocument } from './api.schema';

@Injectable()
export class ApiService {
  constructor(@InjectModel(Api.name) private apiModel: Model<ApiDocument>) {}

  async create(createApiDto: { url: string; name: string; interval?: number }): Promise<ApiDocument> {
    const createdApi = new this.apiModel(createApiDto);
    return createdApi.save();
  }

  async findAll(): Promise<ApiDocument[]> {
    return this.apiModel.find().exec();
  }

  async findOne(id: string): Promise<ApiDocument | null> {
    return this.apiModel.findById(id).exec();
  }

  async remove(id: string): Promise<ApiDocument | null> {
    return this.apiModel.findByIdAndDelete(id).exec();
  }
}
