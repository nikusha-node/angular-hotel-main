import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Service } from '../../services/service';
import { pipe, takeUntil, tap, catchError, of, finalize, Subject, } from 'rxjs';
import { roomCard, RoomFilter } from '../../models/model.interface';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-rooms',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './rooms.html',
  styleUrl: './rooms.scss',
})
export class Rooms implements OnInit, OnDestroy {
  public otaxi = inject(Service);
  public route = inject(ActivatedRoute);
  public router = inject(Router);
  public toDoData: roomCard[] | undefined;
  public hasError: boolean = false;
  public destroy$ = new Subject();
  public filterForm: FormGroup;
  public roomTypes = ['All', 'Single Room', 'Double Room', 'Deluxe Room'];
  public selectedRoomTypes: string[] = [];
  public showAlert = false;
  public alertMessage = '';
  public selectedHotelId: number | null = null;

  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      checkIn: [''],
      checkOut: [''],
      adults: [1],
      roomType: ['All'],
      minPrice: [0],
      maxPrice: [1000]
    });
  }

  ngOnInit() {
    // Check for hotelId parameter
    this.route.queryParams.subscribe(params => {
      if (params['hotelId']) {
        this.selectedHotelId = Number(params['hotelId']);
        console.log('Filtering rooms for hotel ID:', this.selectedHotelId);
      }
    });

    this.loadRooms();
  }

  private loadRooms() {
    this.otaxi
      .roomsAll()
      .pipe(
        takeUntil(this.destroy$),
        tap((data) => {
          let rooms = data as unknown as roomCard[];
          
          // Filter by hotel ID if specified
          if (this.selectedHotelId) {
            rooms = rooms.filter(room => room.hotelId === this.selectedHotelId);
          }
          
          this.toDoData = rooms;
        }),
        catchError(() => {
          this.hasError = true;
          return of('error');
        }),
        finalize(() => {
          console.log('final');
        })
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next;
    this.destroy$.complete();
  }

  applyFilter(): void {
    console.log('=== APPLY FILTER CLICKED ===');
    
    const roomTypeMap: { [key: string]: number } = {
      'All': 0,
      'Single Room': 1,
      'Double Room': 2,
      'Deluxe Room': 3
    };

    const checkInValue = this.filterForm.get('checkIn')?.value;
    const checkOutValue = this.filterForm.get('checkOut')?.value;
    const adultsValue = this.filterForm.get('adults')?.value;
    const roomTypeValue = this.filterForm.get('roomType')?.value;
    const minPriceValue = this.filterForm.get('minPrice')?.value;
    const maxPriceValue = this.filterForm.get('maxPrice')?.value;

    // Validate date range
    if (checkInValue && checkOutValue) {
      const checkInDate = new Date(checkInValue);
      const checkOutDate = new Date(checkOutValue);
      
      if (checkOutDate <= checkInDate) {
        this.showDateError('Check-out date must be after check-in date. Please select correct dates.');
        return;
      }
    }

    console.log('Filter values:', {
      checkInValue,
      checkOutValue,
      adultsValue,
      roomTypeValue,
      minPriceValue,
      maxPriceValue
    });

    // If no dates, use all rooms with client-side filtering
    if (!checkInValue && !checkOutValue) {
      console.log('NO DATES - Using GetAll API with client-side filtering');
      
      this.otaxi.roomsAll()
        .pipe(
          takeUntil(this.destroy$),
          tap((allRooms) => {
            let filteredRooms = allRooms;
            
            // Apply hotel filter first if specified
            if (this.selectedHotelId) {
              filteredRooms = filteredRooms.filter(room => room.hotelId === this.selectedHotelId);
            }
            
            // Then apply other criteria
            filteredRooms = this.filterRoomsByCriteria(filteredRooms, {
              roomTypeId: roomTypeMap[roomTypeValue || 'All'] || 0,
              priceFrom: minPriceValue || 0,
              priceTo: maxPriceValue || 1000,
              maximumGuests: adultsValue || 0
            });
            
            this.toDoData = filteredRooms;
            console.log('Filtered rooms:', filteredRooms);
          }),
          catchError((error) => {
            console.error('GetAll error:', error);
            this.hasError = true;
            return of([]);
          })
        )
        .subscribe();
      return;
    }

    // If dates are provided, use availability API
    console.log('DATES PROVIDED - Using availability check');
    const fromDate = new Date(checkInValue).toISOString();
    const toDate = new Date(checkOutValue).toISOString();
    
    this.otaxi.getAvailableRooms(fromDate, toDate)
      .pipe(
        takeUntil(this.destroy$),
        tap((availableRooms) => {
          let filteredRooms = availableRooms;
          
          // Apply hotel filter first if specified
          if (this.selectedHotelId) {
            filteredRooms = filteredRooms.filter(room => room.hotelId === this.selectedHotelId);
          }
          
          // Then apply other criteria
          filteredRooms = this.filterRoomsByCriteria(filteredRooms, {
            roomTypeId: roomTypeMap[roomTypeValue || 'All'] || 0,
            priceFrom: minPriceValue || 0,
            priceTo: maxPriceValue || 1000,
            maximumGuests: adultsValue || 0
          });
          
          this.toDoData = filteredRooms;
        }),
        catchError((error) => {
          console.error('Availability error:', error);
          this.hasError = true;
          return of([]);
        })
      )
      .subscribe();
  }

  resetFilter(): void {
    this.filterForm.reset({
      checkIn: '',
      checkOut: '',
      adults: 1,
      roomType: 'All',
      minPrice: 0,
      maxPrice: 1000
    });
    
    // Reload all rooms with hotel filter if applicable
    this.loadRooms();
  }

  selectRoomType(type: string): void {
    this.filterForm.get('roomType')?.setValue(type);
  }

  updateMinPrice(event: any): void {
    const value = Number(event.target.value);
    const maxPrice = this.filterForm.get('maxPrice')?.value;
    
    if (value <= maxPrice) {
      this.filterForm.get('minPrice')?.setValue(value);
    } else {
      this.filterForm.get('minPrice')?.setValue(maxPrice - 1);
    }
  }

  updateMaxPrice(event: any): void {
    const value = Number(event.target.value);
    const minPrice = this.filterForm.get('minPrice')?.value;
    
    if (value >= minPrice) {
      this.filterForm.get('maxPrice')?.setValue(value);
    } else {
      this.filterForm.get('maxPrice')?.setValue(minPrice + 1);
    }
  }

  syncMinSlider(): void {
    const minPrice = this.filterForm.get('minPrice')?.value;
    const maxPrice = this.filterForm.get('maxPrice')?.value;
    
    if (minPrice >= maxPrice) {
      this.filterForm.get('minPrice')?.setValue(maxPrice - 1);
    }
  }

  syncMaxSlider(): void {
    const minPrice = this.filterForm.get('minPrice')?.value;
    const maxPrice = this.filterForm.get('maxPrice')?.value;
    
    if (maxPrice <= minPrice) {
      this.filterForm.get('maxPrice')?.setValue(minPrice + 1);
    }
  }

  onCheckInChange(): void {
    const checkInValue = this.filterForm.get('checkIn')?.value;
    const checkOutValue = this.filterForm.get('checkOut')?.value;
    
    if (checkInValue && checkOutValue) {
      const checkInDate = new Date(checkInValue);
      const checkOutDate = new Date(checkOutValue);
      
      // If check-out is before or same as check-in, set check-out to check-in + 1 day
      if (checkOutDate <= checkInDate) {
        const nextDay = new Date(checkInDate);
        nextDay.setDate(nextDay.getDate() + 1);
        const formattedDate = nextDay.toISOString().split('T')[0];
        this.filterForm.get('checkOut')?.setValue(formattedDate);
      }
    }
  }

  showDateError(message: string): void {
    this.alertMessage = message;
    this.showAlert = true;
    
    // Auto-hide alert after 3 seconds
    setTimeout(() => {
      this.showAlert = false;
      this.alertMessage = '';
    }, 3000);
  }

  closeAlert(): void {
    this.showAlert = false;
    this.alertMessage = '';
  }

  filterRoomsByCriteria(rooms: roomCard[], criteria: any): roomCard[] {
    console.log('Filtering rooms by criteria:', criteria);
    
    const filteredRooms = rooms.filter(room => {
      // Room type filter
      if (criteria.roomTypeId !== 0 && room.roomTypeId !== criteria.roomTypeId) {
        return false;
      }
      
      // Price filter
      if (room.pricePerNight < criteria.priceFrom || room.pricePerNight > criteria.priceTo) {
        return false;
      }
      
      // Guests filter
      if (room.maximumGuests < criteria.maximumGuests) {
        return false;
      }
      
      return true;
    });
    
    console.log('Rooms after filtering:', filteredRooms);
    return filteredRooms;
  }

  navigateToBooking(roomId: number): void {
    this.router.navigate(['/room-booking', roomId]);
  }
}