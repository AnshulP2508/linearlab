import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AdminAuditService } from '../common/admin-audit.service';
import { NotificationTypes } from '../common/admin-domain';
import { AuthUser } from '../common/auth-user';
import { MongoDatabaseService } from '../mongo/mongo-database.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

type CategoryDocument = {
  _id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type PocDocument = {
  _id: string;
  categoryId?: string | null;
};

@Injectable()
export class CategoriesService {
  constructor(
    private readonly mongo: MongoDatabaseService,
    private readonly auditService: AdminAuditService,
  ) {}

  async findAll() {
    const [categories, pocs] = await Promise.all([
      (await this.categoryCollection()).find().sort({ name: 1 }).toArray(),
      (await this.pocCollection())
        .find({}, { projection: { categoryId: 1 } })
        .toArray(),
    ]);

    const usageCounts = new Map<string, number>();
    for (const poc of pocs) {
      if (!poc.categoryId) continue;
      usageCounts.set(
        poc.categoryId,
        (usageCounts.get(poc.categoryId) ?? 0) + 1,
      );
    }

    return categories.map((category) => ({
      id: category._id,
      name: category.name,
      description: category.description ?? null,
      color: category.color ?? null,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      usageCount: usageCounts.get(category._id) ?? 0,
    }));
  }

  async create(dto: CreateCategoryDto, actor: AuthUser) {
    const collection = await this.categoryCollection();
    const now = new Date();
    const category: CategoryDocument = {
      _id: randomUUID(),
      name: dto.name.trim(),
      description: dto.description ?? null,
      color: dto.color ?? null,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await collection.insertOne(category);
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('Category name already exists');
      }
      throw error;
    }

    await this.auditService.record({
      actor,
      action: 'CATEGORY_CREATED',
      entityType: 'Category',
      entityId: category._id,
      metadata: { name: category.name },
      notification: {
        type: NotificationTypes.CATEGORY_UPDATED,
        title: 'Category created',
        message: `${category.name} is now available for POCs.`,
      },
    });

    return {
      id: category._id,
      name: category.name,
      description: category.description,
      color: category.color,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  async update(id: string, dto: UpdateCategoryDto, actor: AuthUser) {
    const collection = await this.categoryCollection();
    const existing = await collection.findOne({ _id: id });
    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    const updatePayload: Partial<CategoryDocument> = {
      updatedAt: new Date(),
    };
    if (dto.name !== undefined) updatePayload.name = dto.name.trim();
    if (dto.description !== undefined) {
      updatePayload.description = dto.description;
    }
    if (dto.color !== undefined) updatePayload.color = dto.color;

    if (updatePayload.name && updatePayload.name !== existing.name) {
      const duplicate = await collection.findOne({
        name: updatePayload.name,
        _id: { $ne: id } as never,
      });
      if (duplicate) {
        throw new ConflictException('Category name already exists');
      }
    }

    await collection.updateOne({ _id: id }, { $set: updatePayload });
    const updated = await collection.findOne({ _id: id });
    if (!updated) {
      throw new NotFoundException('Category not found');
    }

    await this.auditService.record({
      actor,
      action: 'CATEGORY_UPDATED',
      entityType: 'Category',
      entityId: updated._id,
      metadata: {
        before: {
          name: existing.name,
          description: existing.description ?? null,
          color: existing.color ?? null,
        },
        after: {
          name: updated.name,
          description: updated.description ?? null,
          color: updated.color ?? null,
        },
      },
      notification: {
        type: NotificationTypes.CATEGORY_UPDATED,
        title: 'Category updated',
        message: `${updated.name} category settings were changed.`,
      },
    });

    return {
      id: updated._id,
      name: updated.name,
      description: updated.description ?? null,
      color: updated.color ?? null,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async remove(id: string, actor: AuthUser) {
    const categoryCollection = await this.categoryCollection();
    const pocCollection = await this.pocCollection();
    const existing = await categoryCollection.findOne({ _id: id });
    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    await categoryCollection.deleteOne({ _id: id });
    await pocCollection.updateMany(
      { categoryId: id },
      { $set: { categoryId: null } },
    );

    await this.auditService.record({
      actor,
      action: 'CATEGORY_DELETED',
      entityType: 'Category',
      entityId: id,
      metadata: { name: existing.name },
      notification: {
        type: NotificationTypes.CATEGORY_UPDATED,
        title: 'Category removed',
        message: `${existing.name} was deleted.`,
      },
    });

    return { ok: true };
  }

  private isDuplicateKeyError(error: unknown) {
    return (
      !!error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 11000
    );
  }

  private async categoryCollection() {
    const db = await this.mongo.getDb();
    return db.collection<CategoryDocument>('Category');
  }

  private async pocCollection() {
    const db = await this.mongo.getDb();
    return db.collection<PocDocument>('POC');
  }
}
