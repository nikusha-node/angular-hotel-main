// email-verify.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';


@Component({
  selector: 'app-email-verify',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './email-verify.html',
  styleUrl: './email-verify.scss',
})
export class EmailVerify implements OnInit {
  isVerifying = true;
  isSuccess = false;
  errorMessage = '';
  email = '';
  otp = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {

    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      this.otp = params['otp'] || params['token'] || params['code'] || '';
      
      if (this.email && this.otp) {
        this.verifyEmail();
      } else {
        this.isVerifying = false;
        this.errorMessage = 'Invalid verification link. Required parameters are missing.';
      }
    });
  }

  verifyEmail(): void {
    this.authService.verifyEmail(this.email, this.otp).subscribe({
      next: (response) => {
        this.isVerifying = false;
        this.isSuccess = true;
        
        setTimeout(() => {
          this.router.navigate(['/signin']);
        }, 3000);
      },
      error: (error) => {
        this.isVerifying = false;
        this.isSuccess = false;
        this.errorMessage = error;
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/signin']);
  }

  goToSignup(): void {
    this.router.navigate(['/signup']);
  }
}