import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Db, MongoClient } from 'mongodb';

@Injectable()
export class MongoDatabaseService implements OnModuleDestroy {
  private mongoClient: MongoClient | null = null;
  private database: Db | null = null;

  constructor(private readonly config: ConfigService) {}

  async getDb(): Promise<Db> {
    if (this.database) {
      return this.database;
    }

    const databaseUrl = this.config.get<string>('DATABASE_URL');
    if (!databaseUrl) {
      throw new Error('DATABASE_URL missing');
    }
    this.mongoClient = new MongoClient(databaseUrl);
    await this.mongoClient.connect();
    const dbName =
      databaseUrl.split('/').pop()?.split('?')[0] ?? 'poc_management';
    this.database = this.mongoClient.db(dbName);
    return this.database;
  }

  async onModuleDestroy() {
    if (this.mongoClient) {
      await this.mongoClient.close();
    }
  }
}
