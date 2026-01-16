import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Service } from '../../services/service';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './signup.html',
  styleUrl: './signup.scss',
})
export class Signup {
  public service = inject(Service);
  public router = inject(Router);
  public authService = inject(AuthService);
  
  public formInfo: FormGroup = new FormGroup({
    firstName: new FormControl(), 
    lastName: new FormControl(), 
    age: new FormControl(), 
    email: new FormControl(), 
    password: new FormControl(), 
    address: new FormControl(), 
    phone: new FormControl(), 
    zipcode: new FormControl(), 
    avatar: new FormControl(), 
    gender: new FormControl(), 
  });

  public isLoading = false;
  public showAlert = false;
  public alertMessage = '';
  public isSuccess = false;

  register() {
    if (this.formInfo.invalid) {
      this.showAlert = true;
      this.alertMessage = 'Please fill in all required fields correctly.';
      this.isSuccess = false;
      return;
    }

    this.isLoading = true;
    this.showAlert = false;

    this.service.signUp(this.formInfo.value).subscribe({
      next: (data: any) => {
        console.log('Registration response:', data);
        this.isLoading = false;
        
        if (data.success === false && data.error === 'EMAIL_EXISTS') {
          // Handle email already exists error
          this.isSuccess = false;
          this.showAlert = true;
          this.alertMessage = data.message || 'Email is already registered. Please use a different email or login.';
        } else {
          // Handle successful registration
          this.isSuccess = true;
          this.showAlert = true;
          this.alertMessage = 'Registration successful! Redirecting to home page...';
          
          // Use auth service to manage authentication state
          if (data.access_token) {
            this.authService.login(data.access_token, data.user);
          } else if (data.user) {
            // For mock registration, create a mock token
            const mockToken = 'mock-token-' + Math.random().toString(36).substring(7);
            this.authService.login(mockToken, data.user);
          }
          
          // Redirect to home page after 2 seconds
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 2000);
        }
      },
      error: (error: any) => {
        console.error('Registration error:', error);
        this.isLoading = false;
        this.isSuccess = false;
        this.showAlert = true;
        
        // Handle different types of errors
        if (error.status === 0) {
          this.alertMessage = 'Network error: Unable to connect to registration service. Please check your internet connection and try again.';
        } else if (error.status === 400) {
          this.alertMessage = 'Registration failed: Invalid information provided. Please check your details and try again.';
        } else if (error.status === 409) {
          this.alertMessage = 'Registration failed: Email already exists. Please use a different email or login.';
        } else if (error.status >= 500) {
          this.alertMessage = 'Server error: Registration service is temporarily unavailable. Please try again later.';
        } else {
          this.alertMessage = 'Registration failed: An unexpected error occurred. Please try again.';
        }
      }
    });
  }
}
