<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## MongoDB and Prisma

Prisma’s MongoDB connector expects a **replica set** (even for local development). A standalone `mongod` without `--replSet` will fail writes and seeding with **P2031**.

**Option A — Docker (recommended for local)**

Requires [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/) installed and **Docker Desktop running**. After installation, open a **new** PowerShell window so `docker` is on your `PATH`.

If you see `docker : The term 'docker' is not recognized`, install Docker Desktop or use **Option B** / **Option C** below.

```bash
docker compose up -d
docker compose exec mongodb mongosh --eval 'rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "127.0.0.1:27017" }] })'
```

On Windows PowerShell, use double quotes for `--eval`:

```powershell
docker compose exec mongodb mongosh --eval "rs.initiate({ _id: 'rs0', members: [{ _id: 0, host: '127.0.0.1:27017' }] })"
```

Set `DATABASE_URL` in `.env` (see `.env.example`), then:

```bash
npx prisma db push
npm run prisma:seed
```

**Option B — MongoDB Atlas (no Docker, no local install)**

Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas), create a database user, allow your IP (or `0.0.0.0/0` for quick tests), get the **connection string**, and set it as `DATABASE_URL` in `.env`. Atlas already runs a replica set, so Prisma works without Docker.

**Option C — Local MongoDB on Windows (no Docker)**

1. Install [MongoDB Community Server](https://www.mongodb.com/try/download/community) if needed.
2. Edit your `mongod.cfg` (often under `C:\Program Files\MongoDB\Server\<version>\bin\mongod.cfg` or see the Windows service “Path to executable”) and ensure it includes:

   ```yaml
   replication:
     replSetName: rs0
   ```

3. Restart the **MongoDB** Windows service (or restart `mongod` if you start it manually).
4. Open **mongosh** and run once:

   ```javascript
   rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "127.0.0.1:27017" }] })
   ```

5. Wait until `rs.status()` shows `"myState" : 1` (PRIMARY), then use the same `DATABASE_URL` as in `.env.example` (`replicaSet=rs0&directConnection=true`).

Use the **same host** in `rs.initiate` and in your URL (here `127.0.0.1`). If initiation fails, try `localhost:27017` in both places instead.

### Troubleshooting

**`replicaSet name "rs0" does not match actual name <none>` / server selection timeout**

Your `DATABASE_URL` declares `replicaSet=rs0`, but the server on `127.0.0.1:27017` is a **standalone** MongoDB (not a replica set). Prisma cannot use that mismatch.

Do one of the following:

1. **Use Docker Compose** (see Option A) after installing **Docker Desktop** and opening a new terminal.
2. **Use Atlas** (Option B) and paste its URL into `.env`.
3. **Configure local Windows MongoDB** as a replica set (Option C), or run `mongod` with `--replSet rs0` and run `rs.initiate(...)` once from `mongosh`.

Do **not** remove `replicaSet=rs0` from the URL while still using standalone MongoDB: Prisma will connect but **writes / seed** will fail with **P2031** until a replica set is available.

**Login returns 401 but Nest started successfully**

Usually the **User** collection is empty because **`npm run prisma:seed` never completed** (often **P2031** without a replica set). Open `http://localhost:4000/health` — if `userCount` is `0`, fix MongoDB (Atlas or local replica set per options above), then run `npx prisma db push` and `npm run prisma:seed` again.

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
