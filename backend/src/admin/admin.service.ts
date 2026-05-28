import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminAuditService } from '../common/admin-audit.service';
import { AuthUser } from '../common/auth-user';
import { NotificationTypes } from '../common/admin-domain';
import { PocsService } from '../pocs/pocs.service';
import {
  DashboardRange,
  QueryDashboardDto,
} from './dto/query-dashboard.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
    private readonly pocsService: PocsService,
  ) { }

  async getDashboard(query: QueryDashboardDto) {
    const prisma = this.prisma as any;
    const range = query.range ?? 'month';
    const [
      totalPocs,
      totalDevelopers,
      totalUsers,
      activeDemos,
      avgRating,
      recentActivity,
      categories,
      monthlyUsers,
      unreadNotifications,
      pendingApprovalPage,
    ] = await Promise.all([
      prisma.pOC.count(),
      prisma.user.count({ where: { role: 'DEVELOPER' } }),
      prisma.user.count(),
      prisma.pOC.aggregate({ _sum: { activeDemoCount: true } }),
      prisma.pOC.aggregate({ _avg: { ratingAverage: true } }),
      prisma.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 6 }),
      prisma.category.findMany({ include: { _count: { select: { pocs: true } } } }),
      prisma.user.findMany({ orderBy: { createdAt: 'asc' }, select: { createdAt: true } }),
      prisma.adminNotification.count({ where: { read: false } }),
      this.pocsService.findPendingApprovals({ page: 1, pageSize: 100 }),
    ]);

    const categoryCounts = (categories as any[]).map((category) => ({
      id: category.id,
      name: category.name,
      color: category.color,
      total: category._count.pocs,
    }));

    return {
      summary: {
        totalPocs,
        totalDevelopers,
        totalUsers,
        pendingApprovals: pendingApprovalPage.total,
        activeDemos: Number(activeDemos?._sum?.activeDemoCount ?? 0),
        averageRating: Number(Number(avgRating?._avg?.ratingAverage ?? 0).toFixed(1)),
        unreadNotifications,
      },
      recentActivity,
      pendingApprovals: pendingApprovalPage.items,
      categoryCounts,
      techDistribution: await this.buildTechnologyDistribution(),
      userGrowth: this.buildTimeSeries(
        (monthlyUsers as any[]).map((entry) => entry.createdAt),
        range,
      ),
    };
  }

  async getAnalytics() {
    const prisma = this.prisma as any;
    const [
      uploadTrendsSeed,
      usersSeed,
      mostViewed,
      highestRated,
      developers,
      categoryDistribution,
      ratings,
      inProgress,
    ] = await Promise.all([
      prisma.pOC.findMany({ select: { createdAt: true }, orderBy: { createdAt: 'asc' } }),
      prisma.user.findMany({ select: { createdAt: true }, orderBy: { createdAt: 'asc' } }),
      prisma.pOC.findMany({
        orderBy: [{ views: 'desc' }, { ratingAverage: 'desc' }],
        take: 5,
        include: { developer: { select: { name: true } } },
      }),
      prisma.pOC.findMany({
        where: { ratingCount: { gt: 0 } },
        orderBy: [{ ratingAverage: 'desc' }, { ratingCount: 'desc' }],
        take: 5,
        include: { developer: { select: { name: true } } },
      }),
      prisma.user.findMany({
        where: { role: 'DEVELOPER' },
        select: {
          id: true,
          name: true,
          pocs: { select: { id: true, status: true } },
        },
      }),
      prisma.category.findMany({ include: { _count: { select: { pocs: true } } } }),
      prisma.feedback.findMany({ select: { rating: true } }),
      prisma.pOC.findMany({
        where: { status: { in: ['DRAFT', 'PENDING_REVIEW'] } },
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: { developer: { select: { name: true } } },
      }),
    ]);

    const mostActiveDevelopers = (developers as any[])
      .map((developer) => ({
        id: developer.id,
        name: developer.name,
        activePocs: developer.pocs.filter((poc: any) => poc.status === 'PUBLISHED').length,
        totalPocs: developer.pocs.length,
      }))
      .sort((a, b) => b.totalPocs - a.totalPocs)
      .slice(0, 5);

    return {
      uploadTrends: this.buildTimeSeries(
        (uploadTrendsSeed as any[]).map((entry) => entry.createdAt),
        'month',
      ),
      userGrowth: this.buildTimeSeries(
        (usersSeed as any[]).map((entry) => entry.createdAt),
        'month',
      ),
      mostViewedPocs: mostViewed,
      highestRatedPocs: highestRated,
      mostActiveDevelopers,
      categoryDistribution: (categoryDistribution as any[]).map((category) => ({
        id: category.id,
        name: category.name,
        total: category._count.pocs,
        color: category.color,
      })),
      ratingsDistribution: this.buildRatingsDistribution((ratings as any[]).map((entry) => entry.rating)),
      inProgressPocs: inProgress,
      techDistribution: await this.buildTechnologyDistribution(),
    };
  }

  async getNotifications() {
    const prisma = this.prisma as any;
    const items = await prisma.adminNotification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      items,
      unreadCount: items.filter((item: any) => !item.read).length,
    };
  }

  async markNotificationRead(id: string) {
    const prisma = this.prisma as any;
    return prisma.adminNotification.update({
      where: { id },
      data: { read: true },
    });
  }

  async getActivityLogs() {
    const prisma = this.prisma as any;
    return prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getSettings() {
    const prisma = this.prisma as any;
    const settings = await prisma.platformSetting.findMany({
      orderBy: { key: 'asc' },
    });

    const defaults: Record<string, unknown> = {
      logoText: 'POC Admin',
      theme: 'Corporate Indigo',
      storageProvider: 'Local Storage',
      emailSender: 'admin@poc.local',
      demoApprovalRequired: true,
      fileUploadLimitMb: 50,
    };

    return (settings as any[]).reduce((acc: Record<string, unknown>, item) => {
      acc[item.key] = item.value;
      return acc;
    }, { ...defaults });
  }

  async updateSettings(dto: UpdateSettingsDto, actor: AuthUser) {
    const prisma = this.prisma as any;
    const entries = Object.entries(dto).filter(([, value]) => value !== undefined);

    await Promise.all(
      entries.map(([key, value]) =>
        prisma.platformSetting.upsert({
          where: { key },
          update: { value, updatedById: actor.userId },
          create: { key, value, updatedById: actor.userId },
        }),
      ),
    );

    await this.auditService.record({
      actor,
      action: 'SETTINGS_UPDATED',
      entityType: 'PlatformSetting',
      entityId: 'platform',
      metadata: dto as Record<string, unknown>,
      notification: {
        type: NotificationTypes.SETTINGS_UPDATED,
        title: 'Platform settings updated',
        message: 'Administrative platform settings were changed.',
      },
    });

    return this.getSettings();
  }

  private buildTimeSeries(dates: Date[], range: DashboardRange) {
    const now = new Date();
    const counts = new Map<string, number>();

    const config = this.getTimeSeriesConfig(now, range);

    for (const bucket of config.buckets) {
      counts.set(bucket.key, 0);
    }

    for (const date of dates) {
      const key = config.keyForDate(date);
      if (counts.has(key)) {
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }

    return config.buckets.map((bucket) => ({
      label: bucket.label,
      value: counts.get(bucket.key) ?? 0,
    }));
  }

  private getTimeSeriesConfig(now: Date, range: DashboardRange) {
    if (range === 'day') {
      const buckets = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(now);
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - (6 - index));
        return {
          key: this.formatDateKey(date),
          label: date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
        };
      });

      return {
        buckets,
        keyForDate: (date: Date) => {
          const normalized = new Date(date);
          normalized.setHours(0, 0, 0, 0);
          return this.formatDateKey(normalized);
        },
      };
    }

    if (range === 'week') {
      const currentWeekStart = this.startOfWeek(now);
      const monthWeekCounts = new Map<string, number>();
      const buckets = Array.from({ length: 8 }, (_, index) => {
        const date = new Date(currentWeekStart);
        date.setDate(date.getDate() - (7 * (7 - index)));
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        const weekNumber = (monthWeekCounts.get(monthKey) ?? 0) + 1;
        monthWeekCounts.set(monthKey, weekNumber);
        return {
          key: this.formatDateKey(date),
          label: `${date
            .toLocaleString('en-US', { month: 'short' })
            .toUpperCase()} W${weekNumber}`,
        };
      });

      return {
        buckets,
        keyForDate: (date: Date) => this.formatDateKey(this.startOfWeek(date)),
      };
    }

    if (range === 'year') {
      const buckets = Array.from({ length: 5 }, (_, index) => {
        const year = now.getFullYear() - (4 - index);
        return {
          key: `${year}`,
          label: `${year}`,
        };
      });

      return {
        buckets,
        keyForDate: (date: Date) => `${date.getFullYear()}`,
      };
    }

    const buckets = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: date.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
      };
    });

    return {
      buckets,
      keyForDate: (date: Date) => `${date.getFullYear()}-${date.getMonth()}`,
    };
  }

  private formatDateKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private startOfWeek(date: Date) {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    const day = normalized.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    normalized.setDate(normalized.getDate() + diff);
    return normalized;
  }

  private getWeekOfMonth(date: Date) {
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const firstWeekStart = this.startOfWeek(firstDayOfMonth);
    const diffMs = this.startOfWeek(date).getTime() - firstWeekStart.getTime();
    return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;
  }

  private buildRatingsDistribution(ratings: number[]) {
    return [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: ratings.filter((value) => value === rating).length,
    }));
  }

  private async buildTechnologyDistribution() {
    const prisma = this.prisma as any;
    const pocs = await prisma.pOC.findMany({
      select: { technologies: true },
    });

    const counts = new Map<string, { name: string; total: number }>();
    for (const poc of pocs as Array<{ technologies?: string[] }>) {
      for (const tech of poc.technologies ?? []) {
        const name = tech.trim();
        if (!name) continue;

        const key = name.toLowerCase();
        const current = counts.get(key);
        counts.set(key, {
          name: current?.name ?? name,
          total: (current?.total ?? 0) + 1,
        });
      }
    }

    return [...counts.values()]
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }
}
