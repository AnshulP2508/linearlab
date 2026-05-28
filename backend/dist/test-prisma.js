"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() { const user = await prisma.user.findUnique({ where: { email: "admin@gmail.com" } }); console.log("USER:", user); }
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=test-prisma.js.map