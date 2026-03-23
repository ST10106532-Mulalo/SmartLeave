import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LeaveService } from '../services/leave.service';
import { Auth } from '../services/auth';
import { NotificationBellComponent } from '../notification-bell/notification-bell';
import { HttpClient } from '@angular/common/http';
import { LogoComponent } from '../components/logo/logo.component';
import { OvertimeService } from '../services/overtime.service';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    NotificationBellComponent,
    LogoComponent
  ],
  templateUrl: './employee-dashboard.html',
  styleUrl: './employee-dashboard.css'
})
export class EmployeeDashboardComponent implements OnInit {
  leaveRequests: any[] = [];
  lateArrivals: any[] = [];
  
  teamPendingRequests: any[] = [];
  teamPendingCount = 0;
  departmentSize = 0;
  departmentPendingLeaves = 0;
  departmentLateToday = 0;
  pendingApprovalCount = 0;
  totalActiveUsers = 0;
  
  loadingLeaves = true;
  loadingLate = true;
  loadingTeam = true;
  
  userName: string = '';
  departmentName: string = '';
  currentDate = new Date();
  isDarkTheme = false;
  
  availableOvertimeCount: number = 0;
  showOvertimeBadge: boolean = false;
  pendingOvertimeApplications: number = 0;
  approvedOvertimeApplications: number = 0;
  
  private apiUrl = 'http://localhost:5298/api';
  
  stats = [
    { label: 'Total Leaves', value: '0', icon: '📋', color: '#4f46e5', trend: 12 },
    { label: 'Pending', value: '0', icon: '⏳', color: '#f59e0b', trend: 5 },
    { label: 'Approved', value: '0', icon: '✅', color: '#10b981', trend: 8 },
    { label: 'Late Arrivals', value: '0', icon: '⏰', color: '#ef4444', trend: -2 }
  ];

  constructor(
    public leaveService: LeaveService,
    public authService: Auth,
    private http: HttpClient,
    private router: Router,
    private changeDetector: ChangeDetectorRef,
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

    this.userName = this.authService.currentUser?.name || 'Employee';
    this.departmentName = this.authService.currentUser?.department || '';
    this.loadLeaveRequests();
    this.loadLateArrivals();
    this.loadOvertimeData();
    
    if (this.authService.canSupervise) {
      this.loadTeamData();
    }
    if (this.authService.canApprove) {
      this.loadDepartmentData();
      this.loadPendingApprovalCount();
    }
    if (this.authService.canViewAll) {
      this.loadSystemData();
    }
  }

  private loadOvertimeData(): void {
    const employeeId = this.authService.employeeId;
    if (!employeeId) return;

    this.overtimeService.getEmployeeDepartment(employeeId).subscribe({
      next: (employee) => {
        if (employee.departmentID) {
          this.overtimeService.getOpenOvertimeByDepartment(employee.departmentID).subscribe({
            next: (data) => {
              this.availableOvertimeCount = data.length;
              this.showOvertimeBadge = this.availableOvertimeCount > 0;
              this.changeDetector.detectChanges();
            },
            error: (err) => console.error('Failed to load overtime', err)
          });
        } else {
          this.availableOvertimeCount = 0;
          this.showOvertimeBadge = false;
          this.changeDetector.detectChanges();
        }
      },
      error: (err) => console.error('Failed to get employee department', err)
    });

    this.overtimeService.getEmployeeApplications(employeeId).subscribe({
      next: (data) => {
        this.pendingOvertimeApplications = data.filter(a => a.status === 'Pending').length;
        this.approvedOvertimeApplications = data.filter(a => a.status === 'Approved').length;
        this.changeDetector.detectChanges();
      },
      error: (err) => console.error('Failed to load applications', err)
    });
  }

  private loadLeaveRequests(): void {
    const employeeId = this.authService.employeeId;
    
    if (!employeeId) {
      console.error('[EmployeeDashboard] No authenticated employee ID found');
      this.router.navigate(['/login']);
      return;
    }
    
    this.leaveService.getMyLeaves(employeeId).subscribe({
      next: (response) => {
        console.log('📊 RAW API RESPONSE:', response);
        
        if (Array.isArray(response) && response.length > 0) {
          console.log('📋 First item structure:', JSON.stringify(response[0], null, 2));
        } else if (response && typeof response === 'object') {
          console.log('📋 Single item structure:', JSON.stringify(response, null, 2));
        }
        
        this.leaveRequests = Array.isArray(response) ? response : [response];
        console.log('✅ Processed leaveRequests:', this.leaveRequests);
        
        this.loadingLeaves = false;
        this.updateStats();
        this.changeDetector.detectChanges();
      },
      error: (error) => {
        console.error('[EmployeeDashboard] Failed to load leave requests:', error);
        this.leaveRequests = [];
        this.loadingLeaves = false;
        this.updateStats();
        this.changeDetector.detectChanges();
      }
    });
  }

  private loadLateArrivals(): void {
    const employeeId = this.authService.employeeId;
    if (!employeeId) return;

    this.leaveService.getMyLateArrivals(employeeId).subscribe({
      next: (response) => {
        console.log('⏰ Late arrivals loaded:', response);
        this.lateArrivals = response;
        this.loadingLate = false;
        this.updateStats();
        this.changeDetector.detectChanges();
      },
      error: (error) => {
        console.error('[EmployeeDashboard] Failed to load late arrivals:', error);
        this.lateArrivals = [];
        this.loadingLate = false;
        this.updateStats();
        this.changeDetector.detectChanges();
      }
    });
  }

  private loadTeamData(): void {
    const employeeId = this.authService.employeeId;
    if (!employeeId) return;

    this.http.get(`${this.apiUrl}/Employee/team-pending/${employeeId}`).subscribe({
      next: (data: any) => {
        this.teamPendingRequests = data;
        this.teamPendingCount = data.length;
        this.loadingTeam = false;
        this.changeDetector.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load team data:', error);
        this.teamPendingRequests = [];
        this.teamPendingCount = 0;
        this.loadingTeam = false;
        this.changeDetector.detectChanges();
      }
    });
  }

  private loadDepartmentData(): void {
    const employeeId = this.authService.employeeId;
    if (!employeeId) return;

    this.http.get(`${this.apiUrl}/Manager/department-stats/${employeeId}`).subscribe({
      next: (data: any) => {
        this.departmentSize = data.size || 0;
        this.departmentPendingLeaves = data.pendingLeaves || 0;
        this.departmentLateToday = data.lateToday || 0;
        this.changeDetector.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load department data:', error);
        this.departmentSize = 0;
        this.departmentPendingLeaves = 0;
        this.departmentLateToday = 0;
      }
    });
  }

  private loadPendingApprovalCount(): void {
    const employeeId = this.authService.employeeId;
    if (!employeeId) return;

    this.http.get(`${this.apiUrl}/Manager/pending-count/${employeeId}`).subscribe({
      next: (data: any) => {
        this.pendingApprovalCount = data.count || 0;
        this.changeDetector.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load pending count:', error);
        this.pendingApprovalCount = 0;
      }
    });
  }

  private loadSystemData(): void {
    this.http.get(`${this.apiUrl}/Admin/stats`).subscribe({
      next: (data: any) => {
        this.totalActiveUsers = data.totalEmployees || 0;
        this.changeDetector.detectChanges();
      },
      error: (error) => {
        console.error('Failed to load system data:', error);
        this.totalActiveUsers = 0;
      }
    });
  }

  navigateToTeamView(): void {
    if (this.authService.userRole === 'Supervisor') {
      this.router.navigate(['/supervisor']);
    } else if (this.authService.userRole === 'Manager') {
      this.router.navigate(['/manager']);
    } else if (this.authService.userRole === 'Admin') {
      this.router.navigate(['/admin']);
    }
  }

  navigateToApprovals(): void {
    if (this.authService.userRole === 'Manager') {
      this.router.navigate(['/manager']);
    } else if (this.authService.userRole === 'Admin') {
      this.router.navigate(['/admin']);
    }
  }

  navigateToAdminPanel(): void {
    this.router.navigate(['/admin']);
  }

  navigateToManagerView(): void {
    this.router.navigate(['/manager']);
  }

  navigateToSupervisorView(): void {
    this.router.navigate(['/supervisor']);
  }

  viewAllLeaves(): void {
    console.log('View all leaves');
  }

  viewAllLate(): void {
    console.log('View all late arrivals');
  }

  viewOvertime(): void {
    this.router.navigate(['/overtime']);
  }

  private updateStats(): void {
    const totalLeaves = this.leaveRequests.length;
    const pending = this.leaveRequests.filter(l => l.status === 'Pending').length;
    const approved = this.leaveRequests.filter(l => l.status === 'Approved').length;
    
    this.stats = [
      { label: 'Total Leaves', value: totalLeaves.toString(), icon: '📋', color: '#4f46e5', trend: 12 },
      { label: 'Pending', value: pending.toString(), icon: '⏳', color: '#f59e0b', trend: 5 },
      { label: 'Approved', value: approved.toString(), icon: '✅', color: '#10b981', trend: 8 },
      { label: 'Late Arrivals', value: this.lateArrivals.length.toString(), icon: '⏰', color: '#ef4444', trend: -2 }
    ];
  }

  getLateStatusClass(status: string): string {
    return status === 'Pending' ? 'status-pending' : 'status-reviewed';
  }

  getRoleDisplay(): string {
    const role = this.authService.userRole;
    switch(role) {
      case 'Admin': return 'Administrator';
      case 'Manager': return 'Department Manager';
      case 'Supervisor': return 'Team Supervisor';
      default: return 'Employee';
    }
  }

  getLeaveIcon(leaveType: string): string {
    switch(leaveType?.toLowerCase()) {
      case 'annual': return '🌴';
      case 'sick': return '🤒';
      case 'family': return '👪';
      case 'unpaid': return '💰';
      default: return '📅';
    }
  }

  getAvatarGradient(): string {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    ];
    const index = this.userName.length % gradients.length;
    return gradients[index];
  }

  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    localStorage.setItem('theme', this.isDarkTheme ? 'Dark' : 'Light');
    document.body.classList.toggle('dark-theme', this.isDarkTheme);
  }

  navigateToSettings(): void {
    this.router.navigate(['/settings']);
  }

  logout(): void {
    this.authService.logout();
  }

  navigateToLeaveRequest(): void {
    this.router.navigate(['/leave-request']);
  }

  navigateToLateArrival(): void {
    this.router.navigate(['/late-arrival']);
  }

  protected Math = Math;
}