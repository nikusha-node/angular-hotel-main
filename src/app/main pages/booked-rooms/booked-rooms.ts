import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Service } from '../../services/service';
import { AuthService } from '../../services/auth.service';
import { bookingCard } from '../../models/model.interface';

@Component({
  selector: 'app-booked-rooms',
  imports: [CommonModule],
  templateUrl: './booked-rooms.html',
  styleUrl: './booked-rooms.scss',
})
export class BookedRooms implements OnInit {
  public service = inject(Service);
  public authService = inject(AuthService);
  public router = inject(Router);
  
  public bookings: bookingCard[] = [];
  public isLoading = false;
  public hasError = false;
  public errorMessage = '';

  constructor() {
    // Router is already injected above, no need to reassign
  }

  ngOnInit() {
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.errorMessage = 'Please login or register to access your booked rooms.';
      this.hasError = true;
      return;
    }

    this.loadBookings();
  }

  loadBookings() {
    this.isLoading = true;
    this.hasError = false;

    // Use the new method to get only user's posted bookings
    this.service.getUserPostedBookings().subscribe({
      next: (data: bookingCard[]) => {
        this.bookings = data;
        this.isLoading = false;
        console.log('User posted bookings loaded:', data);
        console.log('Number of bookings:', data.length);
      },
      error: (error: any) => {
        console.error('Error loading bookings:', error);
        this.isLoading = false;
        this.hasError = true;
        
        if (error.status === 401) {
          this.errorMessage = 'Your session has expired. Please login again.';
          // Redirect to login after 3 seconds
          setTimeout(() => {
            this.authService.logout();
          }, 3000);
        } else if (error.status === 403) {
          this.errorMessage = 'You do not have permission to view bookings.';
        } else if (error.status === 0) {
          this.errorMessage = 'Network error: Unable to connect to booking service. Please check your internet connection.';
        } else {
          this.errorMessage = 'Failed to load your bookings. Please try again later.';
        }
      }
    });
  }

  deleteBooking(bookingId: number) {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    this.service.deleteBooking(bookingId).subscribe({
      next: () => {
        console.log('Booking deleted successfully');
        // Reload bookings after deletion
        this.loadBookings();
      },
      error: (error: any) => {
        console.error('Error deleting booking:', error);
        alert('Failed to cancel booking. Please try again.');
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToRegister() {
    this.router.navigate(['/signup']);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}