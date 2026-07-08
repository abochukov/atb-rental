import { Body, Controller, Get, Post } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  getAll() {
    return this.bookingsService.list();
  }

  @Post()
  create(@Body() payload: CreateBookingDto) {
    return this.bookingsService.create(payload);
  }
}
