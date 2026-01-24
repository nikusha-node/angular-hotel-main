import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Service } from '../../services/service';
import { AuthService } from '../../services/auth.service';
import { roomCard } from '../../models/model.interface';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, catchError, of, tap } from 'rxjs';

@Component({
  selector: 'app-room-booking',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './room-booking.html',
  styleUrl: './room-booking.scss'
})
export class RoomBooking implements OnInit, OnDestroy {
  private service = inject(Service);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  public router = inject(Router);
  private fb = inject(FormBuilder);
  
  public room: roomCard | null = null;
  public bookingForm: FormGroup;
  public availableDates: Date[] = [];
  public bookedDates: string[] = [];
  public isLoading = true;
  public hasError = false;
  public showAlert = false;
  public alertMessage = '';
  public totalDays = 0;
  public totalPrice = 0;
  public currentImageIndex = 0;
  public activeTab = 'overview';
  public otherRooms: roomCard[] = [];
  public currentUser: any = null;
  
  // Calendar properties
  public calendarDays: { date: Date; day: number; isBooked: boolean; isPast: boolean; isSelected: boolean; inRange: boolean }[] = [];
  public currentMonth: Date = new Date();
  public weekDays: string[] = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  
  private destroy$ = new Subject<void>();

  constructor() {
    this.bookingForm = this.fb.group({
      checkIn: [''],
      checkOut: [''],
      adults: [1],
      children: [0],
      customerName: [''],
      customerPhone: [''],
      customerEmail: ['']
    });
  }

  ngOnInit(): void {
    const roomId = this.route.snapshot.paramMap.get('id');
    if (roomId) {
      this.loadRoomDetails(Number(roomId));
    } else {
      this.hasError = true;
      this.isLoading = false;
    }

    // Watch form changes to calculate price
    this.bookingForm.valueChanges.subscribe(() => {
      this.calculatePrice();
      this.updateCalendarSelection();
    });

    this.loadCurrentUser();
    this.generateCalendar();
  }

  private loadCurrentUser(): void {
    if (this.authService.isAuthenticated()) {
      this.authService.getUser()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (user) => {
            console.log('Current user loaded in booking:', user);
            this.currentUser = user;
            if (user) {
              // Pre-fill form if empty
              if (!this.bookingForm.get('customerName')?.value) {
                this.bookingForm.patchValue({
                  customerName: `${user.firstName} ${user.lastName}`,
                  customerEmail: user.email,
                  customerPhone: user.phone
                });
              }
              // Ensure session storage is in sync
              sessionStorage.setItem('userData', JSON.stringify(user));
            }
          },
          error: (err) => console.error('Error loading current user:', err)
        });
    }
  }

  private loadRoomDetails(roomId: number): void {
    this.service.getRoomById(roomId)
      .pipe(
        takeUntil(this.destroy$),
        tap((room) => {
          this.room = room;
          if (this.room) {
            this.loadBookedDates(roomId);
            this.loadOtherRooms(roomId);
            this.bookingForm.get('adults')?.setValue(1);
            this.bookingForm.get('children')?.setValue(0);
          } else {
            this.hasError = true;
          }
          this.isLoading = false;
        }),
        catchError(() => {
          this.hasError = true;
          this.isLoading = false;
          return of(null);
        })
      )
      .subscribe();
  }

  private loadBookedDates(roomId: number): void {
    if (this.room && this.room.bookedDates) {
      this.bookedDates = this.room.bookedDates.map(bd => {
        // Handle both string and Date objects if API returns differently
        const d = new Date(bd.date);
        return d.toISOString().split('T')[0];
      });
      this.generateCalendar();
    }
  }

  private loadOtherRooms(currentRoomId: number): void {
    console.log('Loading other rooms, excluding room ID:', currentRoomId);
    this.service.roomsAll()
      .pipe(
        takeUntil(this.destroy$),
        tap((rooms) => {
          console.log('All rooms from API:', rooms);
          // Filter out the current room and limit to 3 other rooms
          this.otherRooms = rooms
            .filter(room => room.id !== currentRoomId)
            .slice(0, 3);
          console.log('Filtered other rooms:', this.otherRooms);
        }),
        catchError(() => {
          console.error('Error loading other rooms');
          return of([]);
        })
      )
      .subscribe();
  }

  // Calendar Methods
  generateCalendar(): void {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday
    
    this.calendarDays = [];
    
    // Previous month's empty slots
    for (let i = 0; i < startingDayOfWeek; i++) {
      this.calendarDays.push({ 
        date: new Date(year, month, -startingDayOfWeek + i + 1),
        day: 0, 
        isBooked: false, 
        isPast: true, 
        isSelected: false,
        inRange: false 
      });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const checkIn = this.bookingForm.get('checkIn')?.value ? new Date(this.bookingForm.get('checkIn')?.value) : null;
    const checkOut = this.bookingForm.get('checkOut')?.value ? new Date(this.bookingForm.get('checkOut')?.value) : null;
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      date.setHours(0, 0, 0, 0);
      
      const dateStr = date.toISOString().split('T')[0];
      const isBooked = this.bookedDates.includes(dateStr);
      const isPast = date < today;
      
      let isSelected = false;
      let inRange = false;
      
      if (checkIn && date.getTime() === checkIn.getTime()) isSelected = true;
      if (checkOut && date.getTime() === checkOut.getTime()) isSelected = true;
      
      if (checkIn && checkOut && date > checkIn && date < checkOut) inRange = true;
      
      this.calendarDays.push({
        date,
        day: i,
        isBooked,
        isPast,
        isSelected,
        inRange
      });
    }
  }
  
  prevMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.generateCalendar();
  }
  
  nextMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.generateCalendar();
  }
  
  updateCalendarSelection(): void {
    this.generateCalendar();
  }
  
  getMonthName(): string {
    return this.currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  debugClick(roomId: number): void {
    console.log('Mouse down on room:', roomId);
  }

  navigateToRoom(roomId: number): void {
    console.log('Navigating to room:', roomId);
    console.log('Other rooms available:', this.otherRooms);
    
    // Try a simple navigation first to test
    try {
      this.router.navigate(['/rooms']).then(
        success => console.log('Navigation to rooms successful:', success),
        error => console.error('Navigation error:', error)
      );
      
      // If that works, try the actual room navigation
      setTimeout(() => {
        this.router.navigate(['/room-booking', roomId]).then(
          success => console.log('Navigation to room successful:', success),
          error => console.error('Room navigation error:', error)
        );
      }, 100);
    } catch (error) {
      console.error('Router navigation failed:', error);
    }
  }

  onDateChange(): void {
    const checkIn = this.bookingForm.get('checkIn')?.value;
    const checkOut = this.bookingForm.get('checkOut')?.value;
    
    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      
      if (checkOutDate <= checkInDate) {
        this.showAlert = true;
        this.alertMessage = 'Check-out date must be after check-in date';
        setTimeout(() => this.closeAlert(), 3000);
        return;
      }
      
      this.calculatePrice();
    }
  }

  private calculatePrice(): void {
    if (!this.room) return;
    
    const checkIn = this.bookingForm.get('checkIn')?.value;
    const checkOut = this.bookingForm.get('checkOut')?.value;
    
    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
      this.totalDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
      this.totalPrice = this.totalDays * this.room.pricePerNight;
    } else {
      this.totalDays = 0;
      this.totalPrice = 0;
    }
  }

  isDateBooked(date: Date): boolean {
    const dateStr = date.toISOString().split('T')[0];
    return this.bookedDates.includes(dateStr);
  }

  isDateSelectable(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today && !this.isDateBooked(date);
  }

  getGuestsCount(): number {
    const adults = this.bookingForm.get('adults')?.value || 0;
    const children = this.bookingForm.get('children')?.value || 0;
    return adults + children;
  }

  canBook(): boolean {
    if (!this.room) return false;
    
    const checkIn = this.bookingForm.get('checkIn')?.value;
    const checkOut = this.bookingForm.get('checkOut')?.value;
    const adults = this.bookingForm.get('adults')?.value || 0;
    const customerName = this.bookingForm.get('customerName')?.value?.trim();
    const customerPhone = this.bookingForm.get('customerPhone')?.value?.trim();
    const customerEmail = this.bookingForm.get('customerEmail')?.value?.trim();
    
    const totalGuests = this.getGuestsCount();
    
    return checkIn && 
           checkOut && 
           totalGuests > 0 && 
           totalGuests <= this.room.maximumGuests &&
           customerName && 
           customerPhone && 
           customerEmail &&
           this.totalPrice > 0;
  }

  submitBooking(): void {
    if (!this.canBook() || !this.room) return;

    let customerId = '';
    
    // Try to get ID from current user object first
    if (this.currentUser) {
      // Check multiple common ID fields including _id for MongoDB
      customerId = this.currentUser.id || 
                   this.currentUser._id || 
                   this.currentUser.userId || 
                   this.currentUser.customerId || 
                   this.currentUser.sub;
                   
      console.log('Resolved customerId from currentUser:', customerId, this.currentUser);
    }
    
    // Fallback to session storage if not found in currentUser
    if (!customerId) {
      const userDataStr = sessionStorage.getItem('userData');
      if (userDataStr) {
        try {
          const userData = JSON.parse(userDataStr);
          console.log('Fallback to sessionStorage userData:', userData);
          customerId = userData.id || 
                       userData._id || 
                       userData.customerId || 
                       userData.userId || 
                       userData.sub;
        } catch (e) {
          console.error('Error parsing user data from session storage', e);
        }
      }
    }
    
    if (!customerId) {
      console.error('No customerId found. CurrentUser:', this.currentUser);
      this.showAlert = true;
      this.alertMessage = 'Please login to book a room.';
      setTimeout(() => this.closeAlert(), 3000);
      return; 
    }
    
    const bookingData = {
      roomID: this.room.id,
      checkInDate: this.bookingForm.get('checkIn')?.value,
      checkOutDate: this.bookingForm.get('checkOut')?.value,
      totalPrice: this.totalPrice,
      customerName: this.bookingForm.get('customerName')?.value,
      customerPhone: this.bookingForm.get('customerPhone')?.value,
      customerEmail: this.bookingForm.get('customerEmail')?.value,
      customerId: String(customerId),
      adults: this.bookingForm.get('adults')?.value,
      children: this.bookingForm.get('children')?.value,
      isConfirmed: true
    };
    
    this.isLoading = true;
    
    this.service.createBooking(bookingData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          console.log('Booking submitted:', res);
          this.isLoading = false;
          this.showAlert = true;
          this.alertMessage = 'Booking successful! Redirecting to your bookings...';
          
          setTimeout(() => {
            this.router.navigate(['/bookedrooms']);
          }, 2000);
        },
        error: (err) => {
          console.error('Booking error:', err);
          this.isLoading = false;
          this.showAlert = true;
          this.alertMessage = 'Booking failed. Please try again.';
          setTimeout(() => this.closeAlert(), 3000);
        }
      });
  }

  closeAlert(): void {
    this.showAlert = false;
    this.alertMessage = '';
  }

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  previousImage(): void {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
    }
  }

  nextImage(): void {
    if (this.room && this.room.images && this.currentImageIndex < this.room.images.length - 1) {
      this.currentImageIndex++;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
