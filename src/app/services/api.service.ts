import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface Vehicle {
  id: number;
  brand: string;
  model: string;
  category: string | null;
  transmission: string | null;
  fuelType: string | null;
  priceDay: string | null;
  currency: string | null;
}

export interface Location {
  id: number;
  name: string;
  city: string;
}

export interface CreateBookingRequest {
  vehicleId: number;
  pickupLocationId: number;
  returnLocationId: number;
  pickupAt: string;
  returnAt: string;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone: string;
  guestDriverLicenseNo?: string;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly apiUrl = 'http://localhost:3000/api';

  constructor(private readonly http: HttpClient) {}

  getHealth() {
    return this.http.get<{ status: string; service: string }>(`${this.apiUrl}/health`);
  }

  getVehicles() {
    return this.http.get<Vehicle[]>(`${this.apiUrl}/vehicles`);
  }

  getLocations() {
    return this.http.get<Location[]>(`${this.apiUrl}/locations`);
  }

  createBooking(payload: CreateBookingRequest) {
    return this.http.post<{ id: number; status: string }>(`${this.apiUrl}/bookings`, payload);
  }

  getVehicleWithRates(vehicleId: number) {
    
  }
}
