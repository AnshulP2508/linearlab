"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoDatabaseService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongodb_1 = require("mongodb");
let MongoDatabaseService = class MongoDatabaseService {
    config;
    mongoClient = null;
    database = null;
    constructor(config) {
        this.config = config;
    }
    async getDb() {
        if (this.database) {
            return this.database;
        }
        const databaseUrl = this.config.get('DATABASE_URL');
        if (!databaseUrl) {
            throw new Error('DATABASE_URL missing');
        }
        this.mongoClient = new mongodb_1.MongoClient(databaseUrl);
        await this.mongoClient.connect();
        const dbName = databaseUrl.split('/').pop()?.split('?')[0] ?? 'poc_management';
        this.database = this.mongoClient.db(dbName);
        return this.database;
    }
    async onModuleDestroy() {
        if (this.mongoClient) {
            await this.mongoClient.close();
        }
    }
};
exports.MongoDatabaseService = MongoDatabaseService;
exports.MongoDatabaseService = MongoDatabaseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MongoDatabaseService);
//# sourceMappingURL=mongo-database.service.js.map