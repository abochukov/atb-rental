import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class VehiclesService {
  constructor(private readonly db: DatabaseService) {}

  async list() {
    const schema = this.db.quoteIdent(this.db.getSchema());
    const query = `
      SELECT
        v.id,
        v.brand,
        v.model,
        v.category,
        v.transmission,
        v.fuel_type AS "fuelType",
        vr.price_day::text AS "priceDay",
        vr.currency
      FROM ${schema}.vehicles v
      LEFT JOIN LATERAL (
        SELECT r.price_day, r.currency
        FROM ${schema}.vehicle_rates r
        WHERE r.vehicle_id = v.id
          AND r.valid_from <= now()
          AND (r.valid_to IS NULL OR r.valid_to > now())
        ORDER BY r.valid_from DESC
        LIMIT 1
      ) vr ON TRUE
      WHERE v.status = 'active'
      ORDER BY v.id;
    `;

    const { rows } = await this.db.query(query);
    return rows;
  }
}
