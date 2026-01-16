import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Service } from '../../services/service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './signin.html',
  styleUrl: './signin.scss',
})
export class Signin {
  public service = inject(Service);
  public router = inject(Router);
  public authService = inject(AuthService);
  
  public loginFormInfo: FormGroup = new FormGroup({
    email: new FormControl(), 
    password: new FormControl()
  });

  public isLoading = false;
  public showAlert = false;
  public alertMessage = '';
  public isSuccess = false;

  login() {
    if (this.loginFormInfo.invalid) {
      this.showAlert = true;
      this.alertMessage = 'Please fill in all required fields correctly.';
      this.isSuccess = false;
      return;
    }

    this.isLoading = true;
    this.showAlert = false;

    this.service.signIn(this.loginFormInfo.value).subscribe({
      next: (data: any) => {
        console.log('Login successful:', data);
        this.isLoading = false;
        this.isSuccess = true;
        this.showAlert = true;
        this.alertMessage = 'Login successful! Redirecting to home...';
        
        // Use auth service to manage authentication state
        if (data.access_token) {
          this.authService.login(data.access_token, data.user);
        }
        
        // Redirect to home page after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 2000);
      },
      error: (error: any) => {
        console.error('Login error:', error);
        this.isLoading = false;
        this.isSuccess = false;
        this.showAlert = true;
        
        // Handle different types of errors
        if (error.status === 0) {
          this.alertMessage = 'Network error: Unable to connect to login service. Please check your internet connection and try again.';
        } else if (error.status === 401) {
          this.alertMessage = 'Login failed: Invalid email or password. Please try again.';
        } else if (error.status === 400) {
          this.alertMessage = 'Login failed: Invalid information provided. Please check your credentials.';
        } else if (error.status >= 500) {
          this.alertMessage = 'Server error: Login service is temporarily unavailable. Please try again later.';
        } else {
          this.alertMessage = 'Login failed: An unexpected error occurred. Please try again.';
        }
      }
    });
  }
}
