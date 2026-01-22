import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Service } from '../../services/service';
import { pipe, takeUntil, tap, catchError, of, finalize, Subject, map } from 'rxjs';
import { roomCard } from '../../models/model.interface';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit, OnDestroy {
  public service = inject(Service);
  public roomsData: roomCard[] | undefined;
  public hasError: boolean = false;
  public destroy$ = new Subject();

  ngOnInit() {
    this.service
      .roomsAll()
      .pipe(
        takeUntil(this.destroy$),
         map((data: unknown) => {
          const rooms = data as unknown as roomCard[];
          return rooms
            .sort((a, b) => b.bookedDates.length - a.bookedDates.length)
            .slice(0, 6);
        }),
        tap((sortedRooms) => {
          this.roomsData = sortedRooms;
        }),
        catchError(() => {
          this.hasError = true;
          return of('error');
        }),
        finalize(() => {
          console.log('Rooms data loaded');
        })
      )
      .subscribe();
  }

  constructor(private router: Router) {
  }

  navigateToBooking(roomId: number): void {
    this.router.navigate(['/room-booking', roomId]);
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

    faqs = [
    {
      question: 'Is Wi-Fi and parking included with my stay?',
      answer: 'Yes. We offer complimentary high-speed Wi-Fi throughout the property, ensuring seamless connectivity at all times. Private on-site parking is also available to guests at no additional cost for the duration of their stay.',
      open: true
    },
    {
      question: 'What is your reservation cancellation policy?',
      answer: 'We understand that plans may change. Most reservations may be cancelled or modified up to 24 hours prior to arrival without penalty. Certain promotional or special rates may have different terms, which will be clearly outlined at the time of booking.',
      open: false
    },
    {
      question: 'Is breakfast or dining included with my stay?',
      answer: 'Select room rates include a complimentary gourmet breakfast, thoughtfully prepared using fresh, high-quality ingredients. Guests may also enjoy access to our on-site dining venues, offering an elegant selection of local and international cuisine. Dining inclusions vary by reservation and are clearly indicated at the time of booking.',
      open: false
    },
    {
      question: 'Do you offer in-room dining or room service?',
      answer: 'Yes. We provide premium in-room dining service, allowing guests to enjoy exquisite meals and beverages in the privacy of their room. Our room service menu is available daily during designated hours, delivering restaurant-quality cuisine with impeccable service.',
      open: false
    }
  ];

  toggle(index: number) {
    this.faqs[index].open = !this.faqs[index].open;
  }


}




