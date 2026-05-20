import apiClient from './client';

export type ApprovalTargetType =
  | 'driver'
  | 'company'
  | 'vehicle'
  | 'document'
  | 'order'
  | 'storage_provider'
  | 'storage_migration';

export type ApprovalAction =
  | 'approve'
  | 'reject'
  | 'suspend'
  | 'resume'
  | 'bootstrap_seed'
  | 'create'
  | 'update'
  | 'delete'
  | 'activate'
  | 'pause';

export interface AuditDecision {
  id: string;
  targetType: ApprovalTargetType;
  targetId: string;
  action: ApprovalAction;
  reviewerId: string | null;
  reviewer?: {
    id: string;
    email?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    name?: string | null;
  } | null;
  reason: string | null;
  decidedAt: string;
}

export interface AuditDecisionListEnvelope {
  items: AuditDecision[];
  total: number;
}

export interface AuditDecisionsQuery {
  targetType?: ApprovalTargetType;
  targetId?: string;
  reviewerId?: string;
  action?: ApprovalAction;
  limit?: number;
  offset?: number;
}

/**
 * H7 — read-only audit-ledger client. The backend strictly rejects
 * mutating writes via ARCH-7 (REVOKE UPDATE/DELETE at the DB role
 * level); this client exposes list + per-target only.
 */
export const auditLogApi = {
  list: async (
    params?: AuditDecisionsQuery,
  ): Promise<AuditDecisionListEnvelope> => {
    const response = await apiClient.get<AuditDecisionListEnvelope>(
      '/approval-decisions',
      { params },
    );
    return response.data;
  },

  findByTarget: async (
    targetType: ApprovalTargetType,
    targetId: string,
  ): Promise<AuditDecision[]> => {
    const response = await apiClient.get<AuditDecision[]>(
      `/approval-decisions/${targetType}/${targetId}`,
    );
    return response.data;
  },
};

/**
 * H7 — render an array of audit rows as a CSV string. Headers match
 * the UI columns; commas + quotes inside values are escaped per RFC
 * 4180. Reviewer is rendered as the most-readable identifier we have
 * (name → email → id).
 */
export function auditDecisionsToCsv(rows: AuditDecision[]): string {
  const escape = (v: string): string => {
    if (/["\n,]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
    return v;
  };
  const header = [
    'decided_at',
    'target_type',
    'target_id',
    'action',
    'reviewer',
    'reason',
  ].join(',');
  const lines = rows.map((r) => {
    const reviewer =
      r.reviewer?.name ||
      [r.reviewer?.first_name, r.reviewer?.last_name].filter(Boolean).join(' ') ||
      r.reviewer?.email ||
      r.reviewerId ||
      'system';
    return [
      r.decidedAt,
      r.targetType,
      r.targetId,
      r.action,
      reviewer,
      r.reason ?? '',
    ]
      .map((cell) => escape(String(cell)))
      .join(',');
  });
  return [header, ...lines].join('\n');
}
