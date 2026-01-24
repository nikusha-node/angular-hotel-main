import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap, switchMap, map } from 'rxjs/operators';

export interface SignUpRequest {
  firstName: string;
  lastName: string;
  age: number;
  email: string;
  password: string;
  phone: string;
  address: string;
  zipcode: string;
  avatar?: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
}

export interface VerifyEmailRequest {
  email: string;
}

export interface UserProfile {
  id: string;
  _id?: string;
  userId?: string;
  customerId?: string;
  sub?: string;
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  phone: string;
  address: string;
  zipcode: string;
  avatar?: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private readonly API_URL = 'https://api.everrest.educata.dev/auth';

  signUp(userData: SignUpRequest): Observable<any> {
    return this.http.post(`${this.API_URL}/sign_up`, userData).pipe(
      catchError(this.handleError)
    );
  }


verifyEmail(email: string, otp: string): Observable<any> {
  return this.http.post(`${this.API_URL}/verify-email`, { 
    email, 
    otp 
  }).pipe(
    catchError(this.handleError)
  );
}

  signIn(credentials: SignInRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/sign_in`, credentials).pipe(
      tap(response => {
        if (response.access_token) {
          this.setToken(response.access_token);
        }
      }),
      switchMap(response => {
        if (response.access_token) {
          return this.getUser().pipe(
            tap(user => sessionStorage.setItem('userData', JSON.stringify(user))),
            map(() => response)
          );
        }
        return of(response);
      }),
      catchError(this.handleError)
    );
  }

  getUser(): Observable<UserProfile> {
    const token = this.getToken();
    return this.http.get<UserProfile>(this.API_URL, {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(
      catchError(this.handleError)
    );
  }

  logout(): void {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('userData');
  }

  private setToken(token: string): void {
    sessionStorage.setItem('access_token', token);
  }

  getToken(): string | null {
    return sessionStorage.getItem('access_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred. Please try again.';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.status === 400) {
        errorMessage = error.error?.message || 'Invalid data provided.';
      } else if (error.status === 401) {
        errorMessage = 'Invalid email or password.';
      } else if (error.status === 409) {
        errorMessage = 'Email already exists.';
      } else if (error.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }
    }
    
    return throwError(() => errorMessage);
  }
}