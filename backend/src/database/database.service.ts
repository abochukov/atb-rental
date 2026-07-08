import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Pool, QueryResult, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly pool: Pool;
  private readonly schema: string;

  constructor() {
    this.schema = this.readSchema();
    this.pool = new Pool({
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      user: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
      database: process.env.DB_NAME ?? 'fleet',
    });

    this.pool.on('connect', (client) => {
      void client.query(`SET search_path TO ${this.quoteIdent(this.schema)}, public`);
    });

    this.logger.log(`PostgreSQL pool initialized for database ${process.env.DB_NAME ?? 'fleet'} and schema ${this.schema}`);
  }

  async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params: unknown[] = [],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params);
  }

  getSchema(): string {
    return this.schema;
  }

  quoteIdent(identifier: string): string {
    return `"${identifier.replace(/"/g, '""')}"`;
  }

  private readSchema(): string {
    const raw = process.env.DB_SCHEMA ?? 'public';
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(raw)) {
      throw new Error(`Invalid DB_SCHEMA value: ${raw}`);
    }

    return raw;
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
