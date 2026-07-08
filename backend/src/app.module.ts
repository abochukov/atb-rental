import { Module } from '@nestjs/common';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { LocationsModule } from './modules/locations/locations.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    DatabaseModule,
    HealthModule,
    UsersModule,
    VehiclesModule,
    LocationsModule,
    BookingsModule,
  ],
})
export class AppModule {}
