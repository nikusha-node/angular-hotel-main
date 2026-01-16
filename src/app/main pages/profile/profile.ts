import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  public authService = inject(AuthService);
  public userData: any = null;
  public token: string | null = null;

  constructor() {
    // Get user data from auth service
    this.userData = this.authService.getUser();
    this.token = this.authService.getToken();
    
    if (this.token) {
      console.log('User Token:', this.token);
    }
  }

  logout() {
    this.authService.logout();
  }

  hasAvatar(): boolean {
    return !!(this.userData?.avatar && this.userData.avatar.trim() !== '');
  }

  getAvatarUrl(): string {
    return this.userData?.avatar || '';
  }

  getUserInitials(): string {
    if (!this.userData) return '';
    const firstName = this.userData.firstName || '';
    const lastName = this.userData.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
}
