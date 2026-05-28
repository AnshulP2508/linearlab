import { config as loadEnv } from 'dotenv';
import { MongoClient } from 'mongodb';

loadEnv({ path: '.env' });

async function main() {
  const databaseUrl =
    process.env.DATABASE_URL ?? 'mongodb://127.0.0.1:27017/poc_management';
  const dbName = databaseUrl.split('/').pop()?.split('?')[0] ?? 'poc_management';
  const client = new MongoClient(databaseUrl);

  await client.connect();

  try {
    const db = client.db(dbName);
    const collection = db.collection('POC');

    const pocs = await collection
      .find(
        {
          developerWorkspace: { $exists: true, $ne: null },
        },
        {
          projection: {
            _id: 1,
            'developerWorkspace.demoUrls': 1,
            'developerWorkspace.explanationVideo': 1,
          },
        },
      )
      .toArray();

    let updatedCount = 0;

    for (const poc of pocs) {
      const demoUrls =
        (poc.developerWorkspace as { demoUrls?: Record<string, unknown> | null } | null)
          ?.demoUrls ?? {};
      const explanationVideo =
        (
          poc.developerWorkspace as {
            explanationVideo?: { type?: string; value?: string | null } | null;
          } | null
        )?.explanationVideo ?? null;

      const nextDemoUrls: Record<string, unknown> = {};

      if (typeof demoUrls.liveDemoUrl === 'string' && demoUrls.liveDemoUrl.trim()) {
        nextDemoUrls.liveDemoUrl = demoUrls.liveDemoUrl.trim();
      }

      if (
        typeof demoUrls.githubRepositoryUrl === 'string' &&
        demoUrls.githubRepositoryUrl.trim()
      ) {
        nextDemoUrls.githubRepositoryUrl = demoUrls.githubRepositoryUrl.trim();
      }

      if (typeof demoUrls.videoLinkUrl === 'string' && demoUrls.videoLinkUrl.trim()) {
        nextDemoUrls.videoLinkUrl = demoUrls.videoLinkUrl.trim();
      } else if (
        explanationVideo?.type === 'url' &&
        typeof explanationVideo.value === 'string' &&
        explanationVideo.value.trim()
      ) {
        nextDemoUrls.videoLinkUrl = explanationVideo.value.trim();
      }

      const result = await collection.updateOne(
        { _id: poc._id },
        {
          $set: {
            'developerWorkspace.demoUrls': nextDemoUrls,
          },
        },
      );

      if (result.modifiedCount > 0) {
        updatedCount += 1;
      }
    }

    console.log(`Updated ${updatedCount} POC document(s).`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
