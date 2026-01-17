import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule, RouterLink } from '@angular/router';
import { AuthService, UserProfile } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterModule, CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit, OnDestroy {
  isScrolled = false;
  isMenuOpen = false;
  currentUser: UserProfile | null = null;
  private userSubscription?: Subscription;
  
  constructor(public authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.loadUserData();
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  loadUserData(): void {
    if (this.authService.isAuthenticated()) {
      this.userSubscription = this.authService.getUser().subscribe({
        next: (user) => {
          this.currentUser = user;
        },
        error: (error) => {
          console.error('Error loading user:', error);
          this.currentUser = null;
        }
      });
    } else {
      this.currentUser = null;
    }
  }

  @HostListener('window:scroll', []) 
  onWindowScroll(): void {
    this.isScrolled = window.scrollY > 0;
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    
    if (this.isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  closeMenu(): void {
    this.isMenuOpen = false;
    document.body.style.overflow = '';
  }

  logout(): void {
    this.authService.logout();
    this.currentUser = null;
    this.router.navigate(['/login']);
    this.closeMenu();
  }

  goToHome(): void {
    this.router.navigate(['/']);
    this.closeMenu();
  }

  getUserInitials(): string {
    if (!this.currentUser) return '';
    return `${this.currentUser.firstName?.charAt(0) || ''}${this.currentUser.lastName?.charAt(0) || ''}`.toUpperCase();
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }
}