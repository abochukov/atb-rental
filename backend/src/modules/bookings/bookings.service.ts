import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(private readonly db: DatabaseService) {}

  async list() {
    const schema = this.db.quoteIdent(this.db.getSchema());
    const { rows } = await this.db.query(
      `
        SELECT id, vehicle_id AS "vehicleId", pickup_at AS "pickupAt", return_at AS "returnAt", status, final_price AS "finalPrice", currency
        FROM ${schema}.bookings
        ORDER BY created_at DESC
        LIMIT 100;
      `,
    );

    return rows;
  }

  async create(payload: CreateBookingDto) {
    const schema = this.db.quoteIdent(this.db.getSchema());

    const query = `
      INSERT INTO ${schema}.bookings (
        vehicle_id,
        pickup_location_id,
        return_location_id,
        pickup_at,
        return_at,
        status,
        guest_first_name,
        guest_last_name,
        guest_email,
        guest_phone,
        guest_driver_license_no,
        notes,
        base_price,
        discount_amount,
        final_price,
        currency
      ) VALUES (
        $1, $2, $3, $4::timestamptz, $5::timestamptz, 'pending',
        $6, $7, $8, $9, $10, $11,
        0, 0, 0, 'EUR'
      )
      RETURNING id, status;
    `;

    const params = [
      payload.vehicleId,
      payload.pickupLocationId,
      payload.returnLocationId,
      payload.pickupAt,
      payload.returnAt,
      payload.guestFirstName,
      payload.guestLastName,
      payload.guestEmail,
      payload.guestPhone,
      payload.guestDriverLicenseNo ?? null,
      payload.notes ?? null,
    ];

    const { rows } = await this.db.query(query, params);
    return rows[0];
  }
}
