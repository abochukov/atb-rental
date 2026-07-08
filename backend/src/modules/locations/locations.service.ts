import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class LocationsService {
  constructor(private readonly db: DatabaseService) {}

  async list() {
    const schema = this.db.quoteIdent(this.db.getSchema());
    const { rows } = await this.db.query(
      `
        SELECT id, name, city
        FROM ${schema}.locations
        WHERE is_active = TRUE
        ORDER BY id;
      `,
    );

    return rows;
  }
}
