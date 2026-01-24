import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, delay } from 'rxjs/operators';
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

  public getUserPostedBookings(): Observable<bookingCard[]> {
    const token = sessionStorage.getItem('access_token') || sessionStorage.getItem('user') || localStorage.getItem('user');
    const userData = JSON.parse(sessionStorage.getItem('userData') || '{}');
    const customerId = userData.id || userData.customerId || userData.userId || userData.sub;
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Customer-ID': customerId ? customerId.toString() : ''
    });
    
    // Get only bookings created by this customer (posted bookings)
    let url = 'https://hotelbooking.stepprojects.ge/api/Booking';
    if (customerId) {
      url += `?customerId=${customerId}`;
    }
    
    console.log('Getting user posted bookings for customer:', customerId);
    console.log('Posted bookings API URL:', url);
    
    return this.http.get<bookingCard[]>(url, { headers });
  }

  public createBooking(bookingData: any): Observable<any> {
    const token = sessionStorage.getItem('access_token') || sessionStorage.getItem('user') || localStorage.getItem('user');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.post(
      'https://hotelbooking.stepprojects.ge/api/Booking',
      bookingData,
      { 
        headers,
        responseType: 'text' as 'json'
      }
    );
  }

  public deleteBooking(bookingId: number): Observable<any> {
    const token = sessionStorage.getItem('access_token') || sessionStorage.getItem('user') || localStorage.getItem('user');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    
    return this.http.delete(
      `https://hotelbooking.stepprojects.ge/api/Booking/${bookingId}`,
      { headers }
    );
  }

  public signUp(userData: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    
    const existingUsers = JSON.parse(sessionStorage.getItem('registeredUsers') || '[]');
    const emailExists = existingUsers.some((user: any) => user.email === userData.email);
    
    if (emailExists) {
      return of({
        success: false,
        message: 'Email is already registered. Please use a different email or login.',
        error: 'EMAIL_EXISTS'
      }).pipe(
        delay(500) 
      );
    }
    

    return this.http.post(
      'https://everrest.educata.dev/auth/register',
      userData,
      { 
        headers,
        withCredentials: false
      }
    ).pipe(
      catchError((error: any) => {
        console.warn('Direct API call failed, using mock registration:', error);
        return this.mockSignUp(userData);
      })
    );
  }

  private mockSignUp(userData: any): Observable<any> {
    const existingUsers = JSON.parse(sessionStorage.getItem('registeredUsers') || '[]');
    

    const emailExists = existingUsers.some((user: any) => user.email === userData.email);
    
    if (emailExists) {
      return of({
        success: false,
        message: 'Email is already registered. Please use a different email or login.',
        error: 'EMAIL_EXISTS'
      }).pipe(
        delay(500)
      );
    }
    
    const newUser = {
      id: Math.floor(Math.random() * 1000),
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      avatar: userData.avatar || null,
      registeredAt: new Date().toISOString()
    };
    
    existingUsers.push(newUser);
    sessionStorage.setItem('registeredUsers', JSON.stringify(existingUsers));
    
    return of({
      success: true,
      message: 'User registered successfully (mock)',
      user: newUser
    }).pipe(
      delay(1000)
    );
  }

  public signIn(credentials: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    

    return this.http.post(
      'https://everrest.educata.dev/auth/login',
      credentials,
      { 
        headers,
        withCredentials: false
      }
    ).pipe(
      catchError((error: any) => {
        console.warn('Direct API login failed, using mock login:', error);

        return this.mockSignIn(credentials);
      })
    );
  }

  private mockSignIn(credentials: any): Observable<any> {

    const emailParts = credentials.email.split('@');
    const firstName = emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1);
    const lastName = emailParts[1]?.split('.')[0]?.charAt(0).toUpperCase() + (emailParts[1]?.split('.')[0]?.slice(1) || 'User');
    

    return of({
      success: true,
      message: 'Login successful (mock)',
      access_token: 'mock-jwt-token-' + Math.random().toString(36).substring(7),
      user: {
        id: Math.floor(Math.random() * 1000),
        email: credentials.email,
        firstName: firstName,
        lastName: lastName
      }
    }).pipe(
      delay(1000) 
    );
  }
}
