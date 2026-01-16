import { Component, HostListener } from '@angular/core';
import { RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  isScrolled = false;
  isMenuOpen = false;

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
}