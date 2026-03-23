import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { LeaveService } from '../services/leave.service';
import { Auth } from '../services/auth';
import { HttpClient } from '@angular/common/http';
import { LogoComponent } from '../components/logo/logo.component';
import { CalendarComponent } from './calendar.component';

/**
 * LeaveRequestFormComponent
 * 
 * Handles employee leave request submissions. Provides a form interface
 * for employees to submit different types of leave requests which are
 * then sent to the backend API for processing.
 * Supports optional document uploads (medical certificates, etc.)
 * Uses authenticated user ID instead of hardcoded values.
 * 
 * @component
 * @standalone
 */
@Component({
  selector: 'app-leave-request-form',
  standalone: true,
  imports: [CommonModule, FormsModule, LogoComponent, CalendarComponent],
  templateUrl: './leave-request-form.html',
  styleUrl: './leave-request-form.css'
})
export class LeaveRequestFormComponent implements OnInit {
  /**
   * Data model for leave request form
   * Uses LeaveTypeID instead of LeaveType string
   */
  leaveData = {
    employeeID: 0,
    leaveTypeID: 1, // Default to Annual (ID 1)
    startDate: '',
    endDate: '',
    reason: ''
  };

  /**
   * Available leave types
   */
  leaveTypes = [
    { id: 1, name: 'Annual' },
    { id: 2, name: 'Sick' },
    { id: 3, name: 'Family' },
    { id: 4, name: 'Unpaid' },
    { id: 5, name: 'Maternity' },
    { id: 6, name: 'Paternity' }
  ];

  /**
   * User's name for display purposes
   */
  userName: string = '';

  /**
   * Selected file for upload (medical certificate, etc.)
   */
  selectedFile: File | null = null;

  /**
   * Loading state for form submission
   */
  isLoading = false;

  /**
   * API URL - use HTTP
   */
  private apiUrl = 'http://localhost:5298/api';

  constructor(
    private leaveService: LeaveService,
    private authService: Auth,
    private http: HttpClient,
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
      console.error('[LeaveRequest] No authenticated employee ID found');
      this.router.navigate(['/login']);
      return;
    }

    this.leaveData.employeeID = employeeId;
    this.userName = this.authService.currentUser?.name || 'Employee';
  }

  /**
   * Handles date selection from calendar
   */
  onCalendarDateSelected(date: Date): void {
    console.log('Selected date from calendar:', date);
    const dateStr = date.toISOString().split('T')[0];
    
    if (!this.leaveData.startDate) {
      // No start date set - set as start date
      this.leaveData.startDate = dateStr;
      console.log('Set start date:', dateStr);
    } else if (!this.leaveData.endDate) {
      // Start date set but no end date - set as end date if valid
      if (date >= new Date(this.leaveData.startDate)) {
        this.leaveData.endDate = dateStr;
        console.log('Set end date:', dateStr);
      } else {
        alert('End date must be after start date');
      }
    } else {
      // Both dates set - ask which to replace
      const choice = confirm('Both dates are set. Click OK to replace START date, Cancel to replace END date');
      if (choice) {
        this.leaveData.startDate = dateStr;
        this.leaveData.endDate = '';
        console.log('Replaced start date with:', dateStr);
      } else {
        if (date >= new Date(this.leaveData.startDate)) {
          this.leaveData.endDate = dateStr;
          console.log('Replaced end date with:', dateStr);
        } else {
          alert('End date must be after start date');
        }
      }
    }
  }

  /**
   * Calculate the number of days between start and end date
   */
  calculateDuration(): number {
    if (this.leaveData.startDate && this.leaveData.endDate) {
      const start = new Date(this.leaveData.startDate);
      const end = new Date(this.leaveData.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }
    return 0;
  }

  /**
   * Get the selected leave type name
   */
  getSelectedLeaveType(): string {
    const leaveType = this.leaveTypes.find(t => t.id === this.leaveData.leaveTypeID);
    return leaveType ? leaveType.name : '';
  }

  /**
   * Handles file selection from input
   */
  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0] || null;
  }

  /**
   * Handles form submission with multipart/form-data for file upload
   */
  onSubmit(): void {
    // Validate dates
    if (!this.leaveData.startDate || !this.leaveData.endDate) {
      alert('Please select both start and end dates');
      return;
    }

    if (new Date(this.leaveData.startDate) > new Date(this.leaveData.endDate)) {
      alert('End date must be after start date');
      return;
    }

    this.isLoading = true;
    
    // Create FormData for file upload if needed
    if (this.selectedFile) {
      this.submitWithFile();
    } else {
      this.submitWithoutFile();
    }
  }

  /**
   * Submit without file upload (JSON)
   */
  private submitWithoutFile(): void {
    const jsonData = {
      employeeID: this.leaveData.employeeID,
      leaveTypeID: this.leaveData.leaveTypeID,
      startDate: this.leaveData.startDate,
      endDate: this.leaveData.endDate,
      reason: this.leaveData.reason
    };

    console.log('Submitting leave request:', jsonData);

    this.http.post(`${this.apiUrl}/LeaveRequests/test-json`, jsonData).subscribe({
      next: (response: any) => {
        console.log('✅ Submission successful:', response);
        alert('Leave request submitted successfully!');
        this.isLoading = false;
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('❌ Submission failed:', error);
        this.handleError(error);
      }
    });
  }

  /**
   * Submit with file upload (FormData)
   */
  private submitWithFile(): void {
    const formData = new FormData();
    formData.append('employeeID', this.leaveData.employeeID.toString());
    formData.append('leaveTypeID', this.leaveData.leaveTypeID.toString());
    formData.append('startDate', this.leaveData.startDate);
    formData.append('endDate', this.leaveData.endDate);
    formData.append('reason', this.leaveData.reason);
    formData.append('document', this.selectedFile!, this.selectedFile!.name);

    console.log('Submitting leave request with file:', this.selectedFile!.name);

    this.http.post(`${this.apiUrl}/LeaveRequests`, formData).subscribe({
      next: (response: any) => {
        console.log('✅ Submission successful:', response);
        alert('Leave request submitted successfully!');
        this.isLoading = false;
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('❌ Submission failed:', error);
        this.handleError(error);
      }
    });
  }

  /**
   * Handle submission errors
   */
  private handleError(error: any): void {
    this.isLoading = false;
    
    if (error.status === 400) {
      // Validation error
      if (error.error?.message) {
        alert(error.error.message);
      } else if (error.error?.errors) {
        // Handle model state errors
        const errors = Object.values(error.error.errors).flat();
        alert(errors.join('\n'));
      } else {
        alert('Please check your input and try again.');
      }
    } else if (error.status === 401) {
      alert('Your session has expired. Please login again.');
      this.router.navigate(['/login']);
    } else if (error.status === 403) {
      alert('You do not have permission to submit leave requests.');
    } else if (error.status === 0) {
      alert('Cannot connect to server. Please check if the backend is running.');
    } else {
      alert('An error occurred. Please try again.');
    }
  }

  /**
   * Navigates back to dashboard
   */
  cancel(): void {
    this.router.navigate(['/']);
  }
}