import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LeaveService } from '../services/leave.service';
import { Auth } from '../services/auth';
import { LogoComponent } from '../components/logo/logo.component'; // ADDED: Cyberpunk logo component

/**
 * LateArrivalFormComponent
 * 
 * Handles employee late arrival notifications. Provides a form interface
 * for employees to report when they are running late, including expected
 * arrival time, reason, and optional photo evidence.
 * Uses authenticated user ID instead of hardcoded values.
 * 
 * @component
 * @standalone
 */
@Component({
  selector: 'app-late-arrival-form',
  standalone: true,
  imports: [CommonModule, FormsModule, LogoComponent], // ADDED: LogoComponent to imports
  templateUrl: './late-arrival-form.html',
  styleUrl: './late-arrival-form.css'
})
export class LateArrivalFormComponent implements OnInit {
  today = new Date().toISOString().split('T')[0];

  lateData = {
    employeeID: 0,
    date: this.today,
    expectedArrival: '',
    reason: ''
  };

  userName: string = '';
  selectedFile: File | null = null;
  isLoading = false;

  constructor(
    private leaveService: LeaveService,
    private authService: Auth,
    private router: Router
  ) { }

  /**
   * Lifecycle hook that verifies authentication and sets user data
   */
  ngOnInit(): void {
    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/login']);
      return;
    }

    const employeeId = this.authService.employeeId;
    if (!employeeId) {
      console.error('[LateArrival] No authenticated employee ID found');
      this.router.navigate(['/login']);
      return;
    }

    this.lateData.employeeID = employeeId;
    this.userName = this.authService.currentUser?.name || 'Employee';
  }

  /**
   * Handles file selection for optional photo evidence
   */
  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0] || null;
  }

  /**
   * Handles form submission with optional photo upload
   */
  onSubmit(): void {
    this.isLoading = true;

    const formData = new FormData();
    formData.append('employeeID', this.lateData.employeeID.toString());
    formData.append('date', this.lateData.date);
    formData.append('expectedArrival', this.lateData.expectedArrival);
    formData.append('reason', this.lateData.reason);

    if (this.selectedFile) {
      formData.append('photo', this.selectedFile);
    }

    this.leaveService.reportLate(formData).subscribe({
      next: (response) => {
        console.log('[LateArrival] Submission successful:', response);
        alert('Late arrival reported successfully!');
        this.isLoading = false;
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('[LateArrival] Submission failed:', error);
        this.isLoading = false;
        alert('Error reporting late arrival. Please try again.');
      }
    });
  }

  /**
   * Navigates back to dashboard
   */
  cancel(): void {
    this.router.navigate(['/']);
  }
}