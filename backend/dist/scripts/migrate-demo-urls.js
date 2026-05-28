"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const mongodb_1 = require("mongodb");
(0, dotenv_1.config)({ path: '.env' });
async function main() {
    const databaseUrl = process.env.DATABASE_URL ?? 'mongodb://127.0.0.1:27017/poc_management';
    const dbName = databaseUrl.split('/').pop()?.split('?')[0] ?? 'poc_management';
    const client = new mongodb_1.MongoClient(databaseUrl);
    await client.connect();
    try {
        const db = client.db(dbName);
        const collection = db.collection('POC');
        const pocs = await collection
            .find({
            developerWorkspace: { $exists: true, $ne: null },
        }, {
            projection: {
                _id: 1,
                'developerWorkspace.demoUrls': 1,
                'developerWorkspace.explanationVideo': 1,
            },
        })
            .toArray();
        let updatedCount = 0;
        for (const poc of pocs) {
            const demoUrls = poc.developerWorkspace
                ?.demoUrls ?? {};
            const explanationVideo = poc.developerWorkspace?.explanationVideo ?? null;
            const nextDemoUrls = {};
            if (typeof demoUrls.liveDemoUrl === 'string' && demoUrls.liveDemoUrl.trim()) {
                nextDemoUrls.liveDemoUrl = demoUrls.liveDemoUrl.trim();
            }
            if (typeof demoUrls.githubRepositoryUrl === 'string' &&
                demoUrls.githubRepositoryUrl.trim()) {
                nextDemoUrls.githubRepositoryUrl = demoUrls.githubRepositoryUrl.trim();
            }
            if (typeof demoUrls.videoLinkUrl === 'string' && demoUrls.videoLinkUrl.trim()) {
                nextDemoUrls.videoLinkUrl = demoUrls.videoLinkUrl.trim();
            }
            else if (explanationVideo?.type === 'url' &&
                typeof explanationVideo.value === 'string' &&
                explanationVideo.value.trim()) {
                nextDemoUrls.videoLinkUrl = explanationVideo.value.trim();
            }
            const result = await collection.updateOne({ _id: poc._id }, {
                $set: {
                    'developerWorkspace.demoUrls': nextDemoUrls,
                },
            });
            if (result.modifiedCount > 0) {
                updatedCount += 1;
            }
        }
        console.log(`Updated ${updatedCount} POC document(s).`);
    }
    finally {
        await client.close();
    }
}
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
//# sourceMappingURL=migrate-demo-urls.js.map