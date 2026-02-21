/** Generate a stable bulk operation id for correlating per-entity audit entries. */
export function generateBulkOperationId(): string {
  return `bulk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

export type BulkResult<T = string> = {
  bulkOperationId: string;
  succeeded: T[];
  failed: { id: string; code: string; message: string }[];
};

export type BulkPreviewItem = {
  id: string;
  currentState: string;
  intendedAction: string;
  error?: string;
};

export type BulkPreviewResult = {
  valid: BulkPreviewItem[];
  invalid: BulkPreviewItem[];
  summary: string;
};
