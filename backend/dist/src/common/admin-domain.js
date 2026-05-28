"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationTypes = exports.FeedbackStatuses = exports.PocStatuses = exports.AccountStatuses = void 0;
exports.AccountStatuses = ['ACTIVE', 'DISABLED', 'SUSPENDED'];
exports.PocStatuses = [
    'DRAFT',
    'PENDING_REVIEW',
    'PUBLISHED',
    'REJECTED',
    'ARCHIVED',
];
exports.FeedbackStatuses = ['VISIBLE', 'HIDDEN', 'FLAGGED'];
exports.NotificationTypes = {
    POC_SUBMITTED: 'POC_SUBMITTED',
    POC_APPROVED: 'POC_APPROVED',
    POC_REJECTED: 'POC_REJECTED',
    USER_CREATED: 'USER_CREATED',
    USER_UPDATED: 'USER_UPDATED',
    USER_DELETED: 'USER_DELETED',
    FEEDBACK_RECEIVED: 'FEEDBACK_RECEIVED',
    FEEDBACK_MODERATED: 'FEEDBACK_MODERATED',
    CATEGORY_UPDATED: 'CATEGORY_UPDATED',
    SETTINGS_UPDATED: 'SETTINGS_UPDATED',
    SYSTEM_ACTIVITY: 'SYSTEM_ACTIVITY',
};
//# sourceMappingURL=admin-domain.js.map