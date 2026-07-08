import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiService, Location, Vehicle } from './services/api.service';

@Component({
  selector: 'app-root',
  imports: [TranslatePipe, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly activeLang = signal<'bg' | 'en'>('bg');
  protected readonly showSpinner = signal(true);
  protected readonly vehicles = signal<Vehicle[]>([]);
  protected readonly locations = signal<Location[]>([]);
  protected readonly bookingStatus = signal<string>('');

  protected readonly bookingForm = {
    vehicleId: 0,
    pickupLocationId: 0,
    returnLocationId: 0,
    pickupAt: '',
    returnAt: '',
    guestFirstName: '',
    guestLastName: '',
    guestEmail: '',
    guestPhone: '',
    guestDriverLicenseNo: '',
    notes: '',
  };

  constructor(
    private readonly translate: TranslateService,
    private readonly api: ApiService,
  ) {
    this.translate.addLangs(['bg', 'en']);
    this.translate.setFallbackLang('bg');
  }

  ngOnInit(): void {
    this.translate.use('bg');
    this.api.getVehicles().subscribe({
      next: (items) => {
        this.vehicles.set(items);
        if (items.length > 0) {
          this.bookingForm.vehicleId = items[0].id;
        }
      },
    });

    console.log(this.vehicles());

    this.api.getLocations().subscribe({
      next: (items) => {
        this.locations.set(items);
        if (items.length > 0) {
          this.bookingForm.pickupLocationId = items[0].id;
          this.bookingForm.returnLocationId = items[0].id;
        }
      },
    });

    setTimeout(() => this.showSpinner.set(false), 250);
  }

  protected switchLanguage(lang: 'bg' | 'en'): void {
    this.activeLang.set(lang);
    this.translate.use(lang);
  }

  protected submitBooking(): void {
    this.bookingStatus.set('Submitting booking...');

    this.api
      .createBooking({
        vehicleId: Number(this.bookingForm.vehicleId),
        pickupLocationId: Number(this.bookingForm.pickupLocationId),
        returnLocationId: Number(this.bookingForm.returnLocationId),
        pickupAt: this.bookingForm.pickupAt,
        returnAt: this.bookingForm.returnAt,
        guestFirstName: this.bookingForm.guestFirstName,
        guestLastName: this.bookingForm.guestLastName,
        guestEmail: this.bookingForm.guestEmail,
        guestPhone: this.bookingForm.guestPhone,
        guestDriverLicenseNo: this.bookingForm.guestDriverLicenseNo || undefined,
        notes: this.bookingForm.notes || undefined,
      })
      .subscribe({
        next: (result) => {
          this.bookingStatus.set(`Booking #${result.id} created with status ${result.status}.`);
        },
        error: (error: { message?: string }) => {
          this.bookingStatus.set(error?.message ?? 'Booking failed.');
        },
      });
  }
}
