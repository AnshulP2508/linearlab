import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Db } from 'mongodb';
export declare class MongoDatabaseService implements OnModuleDestroy {
    private readonly config;
    private mongoClient;
    private database;
    constructor(config: ConfigService);
    getDb(): Promise<Db>;
    onModuleDestroy(): Promise<void>;
}
