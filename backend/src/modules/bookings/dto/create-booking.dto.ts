import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateBookingDto {
  @IsInt()
  @Min(1)
  vehicleId!: number;

  @IsInt()
  @Min(1)
  pickupLocationId!: number;

  @IsInt()
  @Min(1)
  returnLocationId!: number;

  @IsString()
  @IsNotEmpty()
  pickupAt!: string;

  @IsString()
  @IsNotEmpty()
  returnAt!: string;

  @IsString()
  @IsNotEmpty()
  guestFirstName!: string;

  @IsString()
  @IsNotEmpty()
  guestLastName!: string;

  @IsEmail()
  guestEmail!: string;

  @IsString()
  @IsNotEmpty()
  guestPhone!: string;

  @IsOptional()
  @IsString()
  guestDriverLicenseNo?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
