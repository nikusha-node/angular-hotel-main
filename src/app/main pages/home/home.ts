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



  // დასამატებელია HTML-ში
  // goToHotels() {
  //   this.router.navigate(['/hotels']);
  // }

    faqs = [
    {
      question: '####################',
      answer: '##############',
      open: true
    },
    {
      question: '#########################',
      answer: '############',
      open: false
    },
    {
      question: '######################',
      answer: '###########################',
      open: false
    },
    {
      question: '########################',
      answer: '#######################',
      open: false
    }
  ];

  toggle(index: number) {
    this.faqs[index].open = !this.faqs[index].open;
  }


}




