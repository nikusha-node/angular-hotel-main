import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { hotelCard, roomCard, RoomFilter, bookingCard } from '../models/model.interface';

@Injectable({
  providedIn: 'root',
})
export class Service {
  public http = inject(HttpClient)

  public roomsAll(): Observable<roomCard[]> {
    return this.http.get<roomCard[]>(
      "https://hotelbooking.stepprojects.ge/api/Rooms/GetAll"
    )
  }

  public getRoomById(id: number): Observable<roomCard> {
    return this.http.get<roomCard>(
      `https://hotelbooking.stepprojects.ge/api/Rooms/GetRoom/${id}`
    )
  }

  public getFilteredRooms(filter: RoomFilter): Observable<roomCard[]> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    return this.http.post<roomCard[]>(
      "https://hotelbooking.stepprojects.ge/api/Rooms/GetFiltered",
      filter,
      { headers }
    )
  }

  public getAvailableRooms(from: string, to: string): Observable<roomCard[]> {
    return this.http.get<roomCard[]>(
      `https://hotelbooking.stepprojects.ge/api/Rooms/GetAvailableRooms?from=${from}&to=${to}`
    )
  }

    public hotelsAll(): Observable<hotelCard[]> {
    return this.http.get<hotelCard[]>(
      `https://hotelbooking.stepprojects.ge/api/Hotels/GetAll`
    )
  }

   public getCities(): Observable<string[]> {
    return this.http.get<string[]>(
      'https://hotelbooking.stepprojects.ge/api/Hotels/GetCities'
    );
  }

   public getAllBookings(customerId?: string): Observable<bookingCard[]> {
    let url = 'https://hotelbooking.stepprojects.ge/api/Booking';
    if (customerId) {
      url += `?customerId=${customerId}`;
    }
    return this.http.get<bookingCard[]>(url);
  }
}
