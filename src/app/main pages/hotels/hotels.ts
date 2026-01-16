import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Service } from '../../services/service';
import { hotelCard } from '../../models/model.interface';
import { catchError, finalize, of, Subject, takeUntil, tap, forkJoin } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-hotels',
  imports: [],
  templateUrl: './hotels.html',
  styleUrl: './hotels.scss',
})
export class Hotels implements OnInit, OnDestroy {
  private service = inject(Service);
  private router = inject(Router);
  public allHotels: hotelCard[] = [];
  public filteredHotels: hotelCard[] = [];
  public cities: string[] = [];
  public activeCity: string = 'All';
  public hasError = false;
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    forkJoin({
      hotels: this.service.hotelsAll(),
      cities: this.service.getCities(),
    })
      .pipe(
        takeUntil(this.destroy$),
        tap(({ hotels, cities }) => {
          this.allHotels = hotels as hotelCard[];
          this.filteredHotels = hotels as hotelCard[];
          this.cities = cities;
        }),
        catchError(() => {
          this.hasError = true;
          return of(null);
        })
      )
      .subscribe();
  }

  filterByCity(city: string): void {
    this.activeCity = city;

    if (city === 'All') {
      this.filteredHotels = this.allHotels;
      return;
    }

    this.filteredHotels = this.allHotels.filter(
      (hotel) => hotel.city === city
    );
  }

  viewRooms(hotelId: number): void {
    this.router.navigate(['/rooms'], { queryParams: { hotelId: hotelId } });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


}
