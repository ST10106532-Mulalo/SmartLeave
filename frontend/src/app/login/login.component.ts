import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  credentials = {
    email: '',
    password: ''
  };

  isLoading = false;
  errorMessage = '';
  
  // UI properties
  emailFocused = false;
  passwordFocused = false;
  isDarkTheme = false;
  showPassword = false; // Add this for password visibility

  constructor(
    private authService: Auth,
    private router: Router
  ) {
    // Load theme preference
    const savedTheme = localStorage.getItem('theme');
    this.isDarkTheme = savedTheme === 'Dark';
    // Apply theme to body
    document.body.classList.toggle('dark-theme', this.isDarkTheme);
    
    // Clear any saved credentials from previous sessions
    this.clearSavedCredentials();
  }

  // Clear any autofilled credentials
  private clearSavedCredentials(): void {
    setTimeout(() => {
      this.credentials.email = '';
      this.credentials.password = '';
    }, 100);
  }

  onSubmit(): void {
    // Prevent double submission
    if (this.isLoading) return;
    
    // DEBUG: Log the credentials before sending
    console.log('🔍 Login attempt with credentials:', this.credentials);
    console.log('🔍 Email:', this.credentials.email);
    console.log('🔍 Password:', this.credentials.password);
    
    // Check if credentials are empty
    if (!this.credentials.email || !this.credentials.password) {
      console.error('❌ Credentials are empty!');
      this.errorMessage = 'Please enter both email and password';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        console.log('✅ Login successful', response);
        this.isLoading = false; // Make sure loading is turned off
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('❌ Login failed', error);
        console.error('❌ Status:', error.status);
        console.error('❌ Error details:', error.error);
        
        // Handle pending approval case
        if (error.error?.isPending) {
          this.errorMessage = 'Your account is pending approval. Please wait for an administrator to approve your registration.';
        } else {
          this.errorMessage = error.error?.message || 'Invalid email or password. Please try again.';
        }
        
        this.isLoading = false; // Always reset loading state
      }
    });
  }

  // Toggle password visibility
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // Theme toggle method
  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    localStorage.setItem('theme', this.isDarkTheme ? 'Dark' : 'Light');
    document.body.classList.toggle('dark-theme', this.isDarkTheme);
  }
}