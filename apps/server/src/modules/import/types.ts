export type ImportEntityType = 'members' | 'services';

export interface ImportRowResult {
  row: number;
  success: boolean;
  error?: string;
}

export interface ImportSummary {
  total: number;
  succeeded: number;
  failed: number;
  errors: Array<{ row: number; reason: string }>;
}

export interface ImportStrategy {
  entityType: ImportEntityType;
  requiredColumns: string[];
  validate(
    row: Record<string, unknown>,
    rowNumber: number,
    shopId: string,
    prisma: any,
  ): Promise<ImportRowResult>;
  persist(
    validRows: Record<string, unknown>[],
    shopId: string,
    operatorId: string,
    prisma: any,
  ): Promise<number>;
}
