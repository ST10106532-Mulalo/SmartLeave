import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../services/auth';
import { OvertimeService, Overtime } from '../services/overtime.service';
import { LogoComponent } from '../components/logo/logo.component';

@Component({
  selector: 'app-overtime',
  standalone: true,
  imports: [CommonModule, FormsModule, LogoComponent],
  templateUrl: './overtime.html',
  styleUrls: ['./overtime.css']
})
export class OvertimeComponent implements OnInit {
  overtimeList: Overtime[] = [];
  myApplications: any[] = [];
  loading = true;
  showApplyModal = false;
  selectedOvertime: Overtime | null = null;
  applicationReason = '';

  constructor(
    private overtimeService: OvertimeService,
    private auth: Auth,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    const employeeId = this.auth.employeeId;
    if (!employeeId) {
      this.router.navigate(['/login']);
      return;
    }

    // First get employee's department
    this.overtimeService.getEmployeeDepartment(employeeId).subscribe({
      next: (employee) => {
        if (employee.departmentID) {
          // Load overtime for employee's department
          this.overtimeService.getOpenOvertimeByDepartment(employee.departmentID).subscribe({
            next: (data) => {
              this.overtimeList = data;
              this.loading = false;
            },
            error: (err) => {
              console.error('Failed to load overtime', err);
              this.loading = false;
            }
          });
        } else {
          this.overtimeList = [];
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Failed to get employee department', err);
        this.loading = false;
      }
    });

    // Load employee's applications
    this.overtimeService.getEmployeeApplications(employeeId).subscribe({
      next: (data) => {
        this.myApplications = data;
      },
      error: (err) => console.error('Failed to load applications', err)
    });
  }

  applyForOvertime(overtime: Overtime): void {
    this.selectedOvertime = overtime;
    this.applicationReason = '';
    this.showApplyModal = true;
  }

  submitApplication(): void {
    const employeeId = this.auth.employeeId;
    if (!employeeId || !this.selectedOvertime) return;

    this.overtimeService.applyForOvertime(
      this.selectedOvertime.overtimeID, 
      employeeId, 
      this.applicationReason
    ).subscribe({
      next: () => {
        this.showApplyModal = false;
        this.loadData();
        alert('Application submitted successfully!');
      },
      error: (err) => {
        console.error('Failed to apply', err);
        alert(err.error?.message || 'Failed to submit application');
      }
    });
  }

  closeModal(): void {
    this.showApplyModal = false;
    this.selectedOvertime = null;
    this.applicationReason = '';
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'Pending': return 'status-pending';
      case 'Approved': return 'status-approved';
      case 'Rejected': return 'status-rejected';
      default: return '';
    }
  }
}