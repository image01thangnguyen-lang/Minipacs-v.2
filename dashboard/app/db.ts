import { PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'async_hooks';

type ScopedReadWhere = {
  studyWhere: Record<string, unknown>;
  orderWhere: Record<string, unknown>;
};

export const scopeStorage = new AsyncLocalStorage<ScopedReadWhere>();

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const basePrisma = globalForPrisma.prisma || new PrismaClient();

export const prisma = basePrisma.$extends({
  query: {
    imagingStudy: {
      async $allOperations({ operation, args, query }) {
        const scope = scopeStorage.getStore();
        if (scope && ['findMany', 'findFirst', 'count', 'aggregate', 'groupBy'].includes(operation as string)) {
          const a = args as any;
          a.where = a.where ? { AND: [a.where, scope.studyWhere] } : scope.studyWhere;
        }
        return query(args);
      }
    },
    report: {
      async $allOperations({ operation, args, query }) {
        const scope = scopeStorage.getStore();
        if (scope && ['findMany', 'findFirst', 'count', 'aggregate', 'groupBy'].includes(operation as string)) {
          const a = args as any;
          const reportScope = { imagingStudy: { is: scope.studyWhere } };
          a.where = a.where ? { AND: [a.where, reportScope] } : reportScope;
        }
        return query(args);
      }
    },
    worklistOrder: {
      async $allOperations({ operation, args, query }) {
        const scope = scopeStorage.getStore();
        if (scope && ['findMany', 'findFirst', 'count', 'aggregate', 'groupBy'].includes(operation as string)) {
          const a = args as any;
          a.where = a.where ? { AND: [a.where, scope.orderWhere] } : scope.orderWhere;
        }
        return query(args);
      }
    }
  }
}) as unknown as PrismaClient;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = basePrisma;
