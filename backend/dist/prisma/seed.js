"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const mongodb_1 = require("mongodb");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
const password_policy_1 = require("../src/common/password-policy");
const DATABASE_URL = process.env.DATABASE_URL ?? 'mongodb://127.0.0.1:27017/poc';
const users = [
    {
        id: 'seed-user-admin',
        name: 'Admin User',
        email: 'admin@gmail.com',
        password: '12345678@admin',
        role: 'ADMIN',
        status: 'ACTIVE',
        team: 'Operations',
    },
    {
        id: 'seed-user-developer',
        name: 'Developer User',
        email: 'developer@gmail.com',
        role: 'DEVELOPER',
        password: '12345678@developer',
        status: 'ACTIVE',
        team: 'Engineering',
    },
    {
        id: 'seed-user-user',
        name: 'Standard User',
        email: 'user@gmail.com',
        role: 'USER',
        password: '12345678@user',
        status: 'ACTIVE',
        team: 'Business',
    },
];
const categories = [
    {
        _id: 'seed-category-ai-ml',
        name: 'AI & Machine Learning',
        description: 'Applied ML, assistants, prediction systems, and analytics.',
        color: '#4f46e5',
    },
    {
        _id: 'seed-category-cybersecurity',
        name: 'Cybersecurity',
        description: 'Identity, threat detection, and secure systems.',
        color: '#7c3aed',
    },
    {
        _id: 'seed-category-cloud',
        name: 'Cloud',
        description: 'Cloud-native tooling and infrastructure automation.',
        color: '#0ea5e9',
    },
];
async function main() {
    const client = new mongodb_1.MongoClient(DATABASE_URL);
    await client.connect();
    const dbName = DATABASE_URL.split('/').pop()?.split('?')[0] ?? 'poc';
    const db = client.db(dbName);
    const rounds = Math.max(Number(process.env.BCRYPT_ROUNDS ?? password_policy_1.MIN_BCRYPT_ROUNDS), password_policy_1.MIN_BCRYPT_ROUNDS);
    const userCol = db.collection('User');
    const categoryCol = db.collection('Category');
    const pocCol = db.collection('POC');
    const feedbackCol = db.collection('Feedback');
    const activityCol = db.collection('ActivityLog');
    const notificationCol = db.collection('AdminNotification');
    const settingsCol = db.collection('PlatformSetting');
    for (const user of users) {
        const password = await bcrypt.hash(user.password, rounds);
        await userCol.updateOne({ email: user.email }, {
            $set: {
                name: user.name,
                password,
                role: user.role,
                status: user.status,
                team: user.team,
                lastActiveAt: new Date(),
                updatedAt: new Date(),
            },
            $setOnInsert: {
                _id: user.id,
                createdAt: new Date(),
            },
        }, { upsert: true });
    }
    for (const category of categories) {
        await categoryCol.updateOne({ name: category.name }, {
            $set: {
                description: category.description,
                color: category.color,
                updatedAt: new Date(),
            },
            $setOnInsert: {
                _id: category._id,
                createdAt: new Date(),
            },
        }, { upsert: true });
    }
    const developer = await userCol.findOne({ email: 'developer@gmail.com' });
    const regularUser = await userCol.findOne({ email: 'user@gmail.com' });
    const admin = await userCol.findOne({ email: 'admin@gmail.com' });
    const aiCategory = await categoryCol.findOne({ name: 'AI & Machine Learning' });
    const securityCategory = await categoryCol.findOne({ name: 'Cybersecurity' });
    const pocs = [
        {
            _id: 'seed-poc-ai-chatbot',
            title: 'AI Chatbot POC',
            slug: 'ai-chatbot-poc',
            summary: 'Conversational assistant for customer workflows.',
            description: 'A production-oriented chatbot with escalation rules and knowledge routing.',
            demoUrl: 'https://example.com/demo/ai-chatbot',
            documentation: 'Includes architecture, guardrails, and rollout notes.',
            technologies: ['Python', 'React', 'TensorFlow'],
            status: 'PENDING_REVIEW',
            views: 12402,
            downloads: 832,
            activeDemoCount: 0,
            ratingAverage: 4.8,
            ratingCount: 128,
            developerId: developer?._id,
            categoryId: aiCategory?._id,
            createdAt: new Date('2026-04-12T09:00:00Z'),
            submittedAt: new Date('2026-05-12T09:00:00Z'),
            updatedAt: new Date(),
        },
        {
            _id: 'seed-poc-securefin-edge-node',
            title: 'SecureFin Edge Node',
            slug: 'securefin-edge-node',
            summary: 'Edge security control plane for remote financial sites.',
            description: 'Security-first edge orchestration with remote policy enforcement.',
            demoUrl: 'https://example.com/demo/securefin',
            documentation: 'Compliance notes, deployment guide, and API schema.',
            technologies: ['Rust', 'TypeScript', 'Docker'],
            status: 'PUBLISHED',
            views: 15440,
            downloads: 940,
            activeDemoCount: 0,
            ratingAverage: 4.9,
            ratingCount: 186,
            developerId: developer?._id,
            categoryId: securityCategory?._id,
            reviewerId: admin?._id,
            reviewNotes: 'Approved after penetration test review.',
            publishedAt: new Date('2026-05-05T11:00:00Z'),
            reviewedAt: new Date('2026-05-05T11:00:00Z'),
            createdAt: new Date('2026-03-09T10:00:00Z'),
            submittedAt: new Date('2026-05-04T10:00:00Z'),
            updatedAt: new Date(),
        },
        {
            _id: 'seed-poc-quantum-mesh-protocol',
            title: 'Quantum Mesh Protocol',
            slug: 'quantum-mesh-protocol',
            summary: 'Distributed edge messaging with observability hooks.',
            description: 'Experimental event mesh for low-latency IoT systems.',
            demoUrl: 'https://example.com/demo/quantum-mesh',
            documentation: 'Setup steps and topology validation checklist.',
            technologies: ['Go', 'Kubernetes', 'Prometheus'],
            status: 'DRAFT',
            views: 2200,
            downloads: 310,
            activeDemoCount: 0,
            ratingAverage: 4.2,
            ratingCount: 42,
            developerId: developer?._id,
            categoryId: aiCategory?._id,
            createdAt: new Date('2026-05-01T08:30:00Z'),
            submittedAt: new Date('2026-05-14T08:30:00Z'),
            updatedAt: new Date(),
        },
    ];
    for (const poc of pocs) {
        const { _id, createdAt, ...pocUpdate } = poc;
        await pocCol.updateOne({ slug: poc.slug }, {
            $set: {
                ...pocUpdate,
                updatedAt: new Date(),
            },
            $setOnInsert: {
                _id: poc._id,
                createdAt,
            },
        }, { upsert: true });
    }
    const chatbot = await pocCol.findOne({ slug: 'ai-chatbot-poc' });
    const securefin = await pocCol.findOne({ slug: 'securefin-edge-node' });
    const feedback = [
        {
            _id: 'seed-feedback-ai-chatbot-sarah',
            pocId: chatbot?._id,
            userId: regularUser?._id,
            rating: 4,
            comment: 'Strong UI and clear business value.',
            status: 'VISIBLE',
            createdAt: new Date('2026-05-13T07:15:00Z'),
            updatedAt: new Date(),
        },
        {
            _id: 'seed-feedback-securefin-sarah',
            pocId: securefin?._id,
            userId: regularUser?._id,
            rating: 5,
            comment: 'Excellent operational depth and clean onboarding flow.',
            status: 'VISIBLE',
            createdAt: new Date('2026-05-10T08:15:00Z'),
            updatedAt: new Date(),
        },
    ];
    for (const item of feedback) {
        const { _id, ...feedbackUpdate } = item;
        await feedbackCol.updateOne({ _id }, { $set: feedbackUpdate }, { upsert: true });
    }
    const activity = [
        {
            _id: 'seed-activity-poc-submitted-chatbot',
            action: 'POC_SUBMITTED',
            entityType: 'POC',
            entityId: chatbot?._id,
            performedById: developer?._id,
            performedByEmail: 'developer@gmail.com',
            metadata: { title: 'AI Chatbot POC' },
            createdAt: new Date('2026-05-12T09:05:00Z'),
        },
        {
            _id: 'seed-activity-poc-approved-securefin',
            action: 'POC_APPROVED',
            entityType: 'POC',
            entityId: securefin?._id,
            performedById: admin?._id,
            performedByEmail: 'admin@gmail.com',
            metadata: { title: 'SecureFin Edge Node' },
            createdAt: new Date('2026-05-05T11:10:00Z'),
        },
        {
            _id: 'seed-activity-user-created-elena',
            action: 'USER_CREATED',
            entityType: 'User',
            entityId: developer?._id,
            performedById: admin?._id,
            performedByEmail: 'admin@gmail.com',
            metadata: { email: 'developer@gmail.com' },
            createdAt: new Date('2026-05-01T10:30:00Z'),
        },
    ];
    for (const item of activity) {
        const { _id, ...activityUpdate } = item;
        await activityCol.updateOne({ _id }, { $set: activityUpdate }, { upsert: true });
    }
    const notifications = [
        {
            _id: 'seed-notification-poc-submitted-chatbot',
            type: 'POC_SUBMITTED',
            title: 'New POC submitted',
            message: 'AI Chatbot POC is waiting for review.',
            entityType: 'POC',
            entityId: chatbot?._id,
            read: false,
            createdAt: new Date('2026-05-12T09:10:00Z'),
        },
        {
            _id: 'seed-notification-feedback-securefin',
            type: 'FEEDBACK_RECEIVED',
            title: 'New feedback received',
            message: 'A new 5-star review was added for SecureFin Edge Node.',
            entityType: 'Feedback',
            entityId: feedback[1]._id,
            read: false,
            createdAt: new Date('2026-05-10T08:20:00Z'),
        },
    ];
    for (const item of notifications) {
        const { _id, ...notificationUpdate } = item;
        await notificationCol.updateOne({ _id }, { $set: notificationUpdate }, { upsert: true });
    }
    const settings = [
        { key: 'logoText', value: 'POC Admin' },
        { key: 'theme', value: 'Corporate Indigo' },
        { key: 'storageProvider', value: 'Local Storage' },
        { key: 'emailSender', value: 'admin@poc.local' },
        { key: 'demoApprovalRequired', value: true },
        { key: 'fileUploadLimitMb', value: 50 },
    ];
    for (const item of settings) {
        await settingsCol.updateOne({ key: item.key }, {
            $set: {
                value: item.value,
                updatedById: admin?._id,
                updatedAt: new Date(),
            },
            $setOnInsert: {
                _id: crypto.randomUUID(),
                createdAt: new Date(),
            },
        }, { upsert: true });
    }
    await client.close();
    console.log('Seed completed successfully.');
}
main().catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map