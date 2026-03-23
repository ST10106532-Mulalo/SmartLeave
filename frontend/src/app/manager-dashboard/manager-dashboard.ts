import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth } from '../services/auth';
import { LeaveService } from '../services/leave.service';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NotificationBellComponent } from '../notification-bell/notification-bell';
import { LogoComponent } from '../components/logo/logo.component';
import { OvertimeService } from '../services/overtime.service';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    NotificationBellComponent,
    LogoComponent
  ],
  templateUrl: './manager-dashboard.html',
  styleUrls: ['./manager-dashboard.css']
})
export class ManagerDashboardComponent implements OnInit {
  departmentEmployees: any[] = [];
  pendingRequests: any[] = [];
  pendingLateArrivals: any[] = [];
  pendingSupervisorRequests: any[] = [];
  
  myOvertimePosts: any[] = [];
  overtimeApplications: any[] = [];
  loadingOvertime = true;
  showOvertimeModal = false;
  showApplicationsModal = false;
  selectedOvertime: any = null;
  newOvertime = {
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    maxSlots: 1
  };
  
  loadingEmployees = true;
  loadingRequests = true;
  loadingLate = true;
  loadingSupervisors = true;
  
  teamOnLeaveToday = 0;
  lateThisWeek = 0;
  leaveBalanceUsed = 65;
  
  userName: string = '';
  departmentName: string = '';
  currentDate = new Date();
  isDarkTheme = false;
  selectedRequest: any = null;
  
  showEmployeeModal = false;
  selectedEmployee: any = null;

  constructor(
    private authService: Auth,
    private leaveService: LeaveService,
    private http: HttpClient,
    private router: Router,
    private overtimeService: OvertimeService
  ) {
    const savedTheme = localStorage.getItem('theme');
    this.isDarkTheme = savedTheme === 'Dark';
  }

  ngOnInit(): void {
    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.authService.canApprove) {
      this.router.navigate(['/']);
      return;
    }

    this.userName = this.authService.currentUser?.name || 'Manager';
    this.departmentName = this.authService.currentUser?.department || 'Department';
    this.loadDepartmentData();
    this.loadPendingSupervisorRequests();
    this.loadOvertimeData();
    this.calculateStats();
  }

  private loadOvertimeData(): void {
    const managerId = this.authService.employeeId;
    if (!managerId) return;

    this.overtimeService.getManagerOvertime(managerId).subscribe({
      next: (data) => {
        this.myOvertimePosts = data;
        this.loadingOvertime = false;
      },
      error: (err) => {
        console.error('Failed to load overtime posts', err);
        this.loadingOvertime = false;
      }
    });
  }

  openOvertimeModal(): void {
    this.newOvertime = {
      title: '',
      description: '',
      date: '',
      startTime: '',
      endTime: '',
      maxSlots: 1
    };
    this.showOvertimeModal = true;
  }

  closeOvertimeModal(): void {
    this.showOvertimeModal = false;
  }

  createOvertime(): void {
    const managerId = this.authService.employeeId;
    if (!managerId) return;

    const overtimeData = {
      managerID: managerId,
      title: this.newOvertime.title,
      description: this.newOvertime.description,
      date: this.newOvertime.date,
      startTime: this.newOvertime.startTime,
      endTime: this.newOvertime.endTime,
      maxSlots: this.newOvertime.maxSlots
    };

    this.overtimeService.createOvertime(overtimeData).subscribe({
      next: () => {
        this.closeOvertimeModal();
        this.loadOvertimeData();
        alert('Overtime posted successfully!');
      },
      error: (err) => {
        console.error('Failed to create overtime', err);
        alert('Failed to post overtime. Please try again.');
      }
    });
  }

  viewApplications(overtime: any): void {
    this.selectedOvertime = overtime;
    this.overtimeApplications = overtime.applications || [];
    this.showApplicationsModal = true;
  }

  closeApplicationsModal(): void {
    this.showApplicationsModal = false;
    this.selectedOvertime = null;
    this.overtimeApplications = [];
  }

  approveApplication(applicationId: number): void {
    this.overtimeService.approveApplication(applicationId).subscribe({
      next: () => {
        this.loadOvertimeData();
        this.closeApplicationsModal();
        alert('Application approved!');
      },
      error: (err) => console.error('Failed to approve', err)
    });
  }

  rejectApplication(applicationId: number): void {
    this.overtimeService.rejectApplication(applicationId).subscribe({
      next: () => {
        this.loadOvertimeData();
        this.closeApplicationsModal();
        alert('Application rejected');
      },
      error: (err) => console.error('Failed to reject', err)
    });
  }

  closeOvertime(overtimeId: number): void {
    if (confirm('Close this overtime opportunity? No more applications will be accepted.')) {
      this.overtimeService.closeOvertime(overtimeId).subscribe({
        next: () => {
          this.loadOvertimeData();
          alert('Overtime closed');
        },
        error: (err) => console.error('Failed to close', err)
      });
    }
  }

  private loadDepartmentData(): void {
    const managerId = this.authService.employeeId;
    if (!managerId) return;

    this.http.get(`https://localhost:7156/api/Manager/team/${managerId}`).subscribe({
      next: (data: any) => {
        this.departmentEmployees = data;
        this.loadingEmployees = false;
      },
      error: (err) => {
        console.error('Failed to load team', err);
        this.departmentEmployees = [];
        this.loadingEmployees = false;
      }
    });

    this.http.get(`https://localhost:7156/api/Manager/pending-leaves/${managerId}`).subscribe({
      next: (data: any) => {
        this.pendingRequests = data;
        this.loadingRequests = false;
      },
      error: (err) => {
        console.error('Failed to load pending leaves', err);
        this.pendingRequests = [];
        this.loadingRequests = false;
      }
    });

    this.http.get(`https://localhost:7156/api/Manager/pending-late/${managerId}`).subscribe({
      next: (data: any) => {
        this.pendingLateArrivals = data;
        this.loadingLate = false;
      },
      error: (err) => {
        console.error('Failed to load late arrivals', err);
        this.pendingLateArrivals = [];
        this.loadingLate = false;
      }
    });
  }

  private loadPendingSupervisorRequests(): void {
    const managerId = this.authService.employeeId;
    if (!managerId) return;

    this.http.get(`https://localhost:7156/api/Manager/pending-supervisors/${managerId}`).subscribe({
      next: (data: any) => {
        this.pendingSupervisorRequests = data;
        this.loadingSupervisors = false;
      },
      error: (err) => {
        console.error('Failed to load supervisor requests', err);
        this.pendingSupervisorRequests = [];
        this.loadingSupervisors = false;
      }
    });
  }

  approveSupervisor(requestId: number): void {
    console.log('Approving supervisor request:', requestId);
    this.http.post(`https://localhost:7156/api/Manager/approve-supervisor/${requestId}`, {}).subscribe({
      next: () => {
        this.pendingSupervisorRequests = this.pendingSupervisorRequests.filter(r => r.id !== requestId);
      },
      error: (err) => console.error('Failed to approve supervisor', err)
    });
  }

  rejectSupervisor(requestId: number): void {
    console.log('Rejecting supervisor request:', requestId);
    this.http.post(`https://localhost:7156/api/Manager/reject-supervisor/${requestId}`, {}).subscribe({
      next: () => {
        this.pendingSupervisorRequests = this.pendingSupervisorRequests.filter(r => r.id !== requestId);
      },
      error: (err) => console.error('Failed to reject supervisor', err)
    });
  }

  approveRequest(requestId: number): void {
    console.log('Approving request:', requestId);
    this.http.put(`https://localhost:7156/api/Manager/approve-leave/${requestId}`, {}).subscribe({
      next: () => {
        this.pendingRequests = this.pendingRequests.filter(r => r.leaveID !== requestId);
      },
      error: (err) => console.error('Approval failed', err)
    });
  }

  rejectRequest(requestId: number): void {
    console.log('Rejecting request:', requestId);
    this.http.put(`https://localhost:7156/api/Manager/reject-leave/${requestId}`, {}).subscribe({
      next: () => {
        this.pendingRequests = this.pendingRequests.filter(r => r.leaveID !== requestId);
      },
      error: (err) => console.error('Rejection failed', err)
    });
  }

  reviewLateArrival(lateId: number): void {
    console.log('Reviewing late arrival:', lateId);
    this.http.put(`https://localhost:7156/api/Manager/review-late/${lateId}`, {}).subscribe({
      next: () => {
        this.pendingLateArrivals = this.pendingLateArrivals.filter(l => l.lateID !== lateId);
      },
      error: (err) => console.error('Review failed', err)
    });
  }

  viewEmployeeDetails(employee: any): void {
    this.selectedEmployee = employee;
    this.showEmployeeModal = true;
  }

  closeEmployeeModal(): void {
    this.showEmployeeModal = false;
    this.selectedEmployee = null;
  }

  getRoleColor(role: string): string {
    switch(role) {
      case 'Admin': return '#ff00ff';
      case 'Manager': return '#00ffff';
      case 'Supervisor': return '#ffaa00';
      default: return '#888';
    }
  }

  private calculateStats(): void {
    this.teamOnLeaveToday = 0;
    this.lateThisWeek = this.pendingLateArrivals.length;
  }

  goToDashboard(): void {
    this.router.navigate(['/']);
  }

  viewAllSupervisorRequests(): void {
    this.router.navigate(['/supervisor-requests']);
  }

  viewAllLeaves(): void {
    this.router.navigate(['/leave-requests']);
  }

  viewAllLate(): void {
    this.router.navigate(['/late-arrivals']);
  }

  viewAllTeam(): void {
    this.router.navigate(['/team']);
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  }

  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    localStorage.setItem('theme', this.isDarkTheme ? 'Dark' : 'Light');
    document.body.classList.toggle('dark-theme', this.isDarkTheme);
  }

  logout(): void {
    this.authService.logout();
  }

  protected Math = Math;
}