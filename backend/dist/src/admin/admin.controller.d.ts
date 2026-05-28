import type { Request } from 'express';
import { AuthUser } from '../common/auth-user';
import { QueryDashboardDto } from './dto/query-dashboard.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { AdminService } from './admin.service';
type AuthedRequest = Request & {
    user: AuthUser;
};
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getDashboard(query: QueryDashboardDto): Promise<{
        summary: {
            totalPocs: any;
            totalDevelopers: any;
            totalUsers: any;
            pendingApprovals: number;
            activeDemos: number;
            averageRating: number;
            unreadNotifications: any;
        };
        recentActivity: any;
        pendingApprovals: {
            id: string;
            title: string;
            slug: string;
            summary: string;
            description: string;
            demoUrl: string | null;
            documentation: string | null;
            technologies: string[];
            status: string;
            views: number;
            downloads: number;
            activeDemoCount: number;
            ratingAverage: number;
            ratingCount: number;
            developerId: string;
            categoryId: string | null;
            reviewerId: string | null;
            reviewNotes: string | null;
            rejectedReason: string | null;
            submittedAt: Date | null;
            reviewedAt: Date | null;
            publishedAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            developer: {
                id: string;
                name: string;
                email: string;
                team?: string | null;
                avatarUrl?: string | null;
            } | undefined;
            category: {
                id: string;
                name: string;
                color?: string | null;
            } | null;
        }[];
        categoryCounts: {
            id: any;
            name: any;
            color: any;
            total: any;
        }[];
        techDistribution: {
            name: string;
            total: number;
        }[];
        userGrowth: {
            label: string;
            value: number;
        }[];
    }>;
    getAnalytics(): Promise<{
        uploadTrends: {
            label: string;
            value: number;
        }[];
        userGrowth: {
            label: string;
            value: number;
        }[];
        mostViewedPocs: any;
        highestRatedPocs: any;
        mostActiveDevelopers: {
            id: any;
            name: any;
            activePocs: any;
            totalPocs: any;
        }[];
        categoryDistribution: {
            id: any;
            name: any;
            total: any;
            color: any;
        }[];
        ratingsDistribution: {
            rating: number;
            count: number;
        }[];
        inProgressPocs: any;
        techDistribution: {
            name: string;
            total: number;
        }[];
    }>;
    getNotifications(): Promise<{
        items: any;
        unreadCount: any;
    }>;
    markNotificationRead(id: string): Promise<any>;
    getActivityLogs(): Promise<any>;
    getSettings(): Promise<any>;
    updateSettings(dto: UpdateSettingsDto, req: AuthedRequest): Promise<any>;
}
export {};
