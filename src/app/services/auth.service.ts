import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  
  // Signals for reactive state management
  public isLoggedIn = signal<boolean>(false);
  public currentUser = signal<any>(null);
  public userToken = signal<string | null>(null);

  constructor() {
    // Check authentication state on service initialization
    this.checkAuthState();
  }

  private checkAuthState() {
    const token = sessionStorage.getItem('user');
    const userData = sessionStorage.getItem('userData');
    
    if (token && userData) {
      this.isLoggedIn.set(true);
      this.currentUser.set(JSON.parse(userData));
      this.userToken.set(token);
      console.log('User Token:', token);
    }
  }

  login(token: string, userData: any) {
    sessionStorage.setItem('user', token);
    sessionStorage.setItem('userData', JSON.stringify(userData));
    
    this.isLoggedIn.set(true);
    this.currentUser.set(userData);
    this.userToken.set(token);
    
    console.log('User logged in:', userData);
    console.log('User Token:', token);
  }

  logout() {
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('userData');
    
    this.isLoggedIn.set(false);
    this.currentUser.set(null);
    this.userToken.set(null);
    
    this.router.navigate(['/']);
  }

  getToken(): string | null {
    return this.userToken();
  }

  getUser(): any | null {
    return this.currentUser();
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn();
  }
}
