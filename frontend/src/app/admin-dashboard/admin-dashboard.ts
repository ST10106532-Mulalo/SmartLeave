import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../services/auth';
import { LeaveService } from '../services/leave.service';
import { HttpClient } from '@angular/common/http';
import { LogoComponent } from '../components/logo/logo.component';
import { NotificationBellComponent } from '../notification-bell/notification-bell';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    LogoComponent,
    NotificationBellComponent
  ],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboardComponent implements OnInit {
  totalEmployees = 0;
  totalDepartments = 0;
  pendingLeaves = 0;
  pendingLate = 0;
  
  allEmployees: any[] = [];
  allLeaveRequests: any[] = [];
  allLateArrivals: any[] = [];
  departments: string[] = [];
  
  pendingApprovals: any[] = [];
  loadingApprovals = true;
  approvalStats = {
    total: 0,
    managers: 0,
    supervisors: 0,
    admins: 0
  };
  
  processingUserId: number | null = null;
  processingRequestId: number | null = null;
  processingLateId: number | null = null;
  
  departmentStats: any[] = [];
  recentActivity: any[] = [];
  
  loadingEmployees = true;
  loadingLeaves = true;
  loadingLate = true;
  currentDate = new Date();
  isDarkTheme = false;
  
  userName: string = '';
  departmentName: string = '';
  selectedView: 'employees' | 'leaves' | 'late' | 'reports' | 'approvals' = 'approvals';
  
  searchTerm = '';
  filterRole = 'all';
  employeeSearch = '';
  selectedDepartment: string = 'all';
  leaveSearch = '';
  lateSearch = '';
  
  // Modal properties
  showEmployeeModal = false;
  selectedEmployee: any = null;
  
  private apiUrl = 'http://localhost:5298/api';

  successMessage = '';
  errorMessage = '';

  constructor(
    private authService: Auth,
    private leaveService: LeaveService,
    private http: HttpClient,
    private router: Router
  ) {
    const savedTheme = localStorage.getItem('theme');
    this.isDarkTheme = savedTheme === 'Dark';
  }

  ngOnInit(): void {
    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.authService.canViewAll) {
      this.router.navigate(['/']);
      return;
    }

    this.userName = this.authService.currentUser?.name || 'Admin';
    this.departmentName = this.authService.currentUser?.department || '';
    this.loadAllData();
    this.loadPendingApprovals();
  }

  private loadAllData(): void {
    this.http.get(`${this.apiUrl}/Admin/employees`).subscribe({
      next: (data: any) => {
        this.allEmployees = data;
        this.totalEmployees = data.length;
        this.loadingEmployees = false;
        this.calculateDepartmentStats();
      },
      error: (err) => {
        console.error('Failed to load employees', err);
        this.loadingEmployees = false;
      }
    });

    this.http.get(`${this.apiUrl}/Admin/leave-requests`).subscribe({
      next: (data: any) => {
        this.allLeaveRequests = data;
        this.pendingLeaves = data.filter((l: any) => l.status === 'Pending').length;
        this.loadingLeaves = false;
      },
      error: (err) => {
        console.error('Failed to load leaves', err);
        this.loadingLeaves = false;
      }
    });

    this.http.get(`${this.apiUrl}/Admin/late-arrivals`).subscribe({
      next: (data: any) => {
        this.allLateArrivals = data;
        this.pendingLate = data.filter((l: any) => l.status === 'Pending').length;
        this.loadingLate = false;
      },
      error: (err) => {
        console.error('Failed to load late arrivals', err);
        this.loadingLate = false;
      }
    });

    this.http.get(`${this.apiUrl}/Admin/departments`).subscribe({
      next: (data: any) => {
        this.departments = data.map((d: any) => d.name);
        this.totalDepartments = data.length;
      },
      error: (err) => console.error('Failed to load departments', err)
    });
  }

  private loadPendingApprovals(): void {
    this.http.get(`${this.apiUrl}/Admin/pending-approvals`).subscribe({
      next: (data: any) => {
        console.log('Pending approvals loaded:', data);
        this.pendingApprovals = data;
        this.loadingApprovals = false;
        this.calculateApprovalStats();
      },
      error: (err) => {
        console.error('Failed to load pending approvals', err);
        this.pendingApprovals = [];
        this.loadingApprovals = false;
        this.calculateApprovalStats();
      }
    });
  }

  private calculateApprovalStats(): void {
    this.approvalStats.total = this.pendingApprovals.length;
    this.approvalStats.managers = this.pendingApprovals.filter(a => a.requestedRole === 'Manager').length;
    this.approvalStats.supervisors = this.pendingApprovals.filter(a => a.requestedRole === 'Supervisor').length;
    this.approvalStats.admins = this.pendingApprovals.filter(a => a.requestedRole === 'Admin').length;
  }

  private calculateDepartmentStats(): void {
    const deptMap = new Map();
    this.allEmployees.forEach(emp => {
      const dept = emp.department || 'Unassigned';
      deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
    });
    this.departmentStats = Array.from(deptMap.entries()).map(([name, count]) => ({ name, count }));
  }

  get filteredEmployees(): any[] {
    let filtered = [...this.allEmployees];
    
    // Filter by department
    if (this.selectedDepartment !== 'all') {
      filtered = filtered.filter(emp => emp.department === this.selectedDepartment);
    }
    
    // Filter by search term
    if (this.employeeSearch.trim()) {
      const search = this.employeeSearch.toLowerCase();
      filtered = filtered.filter(emp => 
        emp.name?.toLowerCase().includes(search) ||
        emp.email?.toLowerCase().includes(search) ||
        emp.department?.toLowerCase().includes(search) ||
        emp.role?.toLowerCase().includes(search)
      );
    }
    
    return filtered;
  }

  applyEmployeeFilters(): void {
    // This method triggers change detection
    // The filteredEmployees getter will automatically update
  }

  approveUser(userId: number): void {
    this.processingUserId = userId;
    this.errorMessage = '';
    this.successMessage = '';
    
    this.http.post(`${this.apiUrl}/Admin/approve-user/${userId}`, {}).subscribe({
      next: () => {
        this.pendingApprovals = this.pendingApprovals.filter(a => a.employeeID !== userId);
        this.calculateApprovalStats();
        this.loadAllData();
        this.processingUserId = null;
        this.successMessage = 'User approved successfully!';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        console.error('Approval failed', err);
        this.processingUserId = null;
        this.errorMessage = 'Failed to approve user. Please try again.';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  rejectUser(userId: number): void {
    if (confirm('Are you sure you want to reject this user?')) {
      this.processingUserId = userId;
      this.errorMessage = '';
      
      this.http.post(`${this.apiUrl}/Admin/reject-user/${userId}`, {}).subscribe({
        next: () => {
          this.pendingApprovals = this.pendingApprovals.filter(a => a.employeeID !== userId);
          this.calculateApprovalStats();
          this.processingUserId = null;
        },
        error: (err) => {
          console.error('Rejection failed', err);
          this.processingUserId = null;
          alert('Failed to reject user. Please try again.');
        }
      });
    }
  }

  get filteredApprovals(): any[] {
    return this.pendingApprovals.filter(approval => {
      const matchesSearch = this.searchTerm === '' || 
        approval.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        approval.email.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesRole = this.filterRole === 'all' || approval.requestedRole === this.filterRole;
      
      return matchesSearch && matchesRole;
    });
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

  getRoleColor(role: string): string {
    switch(role) {
      case 'Admin': return '#ff00ff';
      case 'Manager': return '#00ffff';
      case 'Supervisor': return '#ffaa00';
      default: return '#888';
    }
  }

  changeView(view: 'employees' | 'leaves' | 'late' | 'reports' | 'approvals'): void {
    this.selectedView = view;
  }

  approveRequest(requestId: number): void {
    this.processingRequestId = requestId;
    
    this.http.put(`${this.apiUrl}/Admin/approve-leave/${requestId}`, {}).subscribe({
      next: () => {
        this.loadAllData();
        this.processingRequestId = null;
      },
      error: (err) => {
        console.error('Approval failed', err);
        this.processingRequestId = null;
        alert('Failed to approve request. Please try again.');
      }
    });
  }

  rejectRequest(requestId: number): void {
    this.processingRequestId = requestId;
    
    this.http.put(`${this.apiUrl}/Admin/reject-leave/${requestId}`, {}).subscribe({
      next: () => {
        this.loadAllData();
        this.processingRequestId = null;
      },
      error: (err) => {
        console.error('Rejection failed', err);
        this.processingRequestId = null;
        alert('Failed to reject request. Please try again.');
      }
    });
  }

  reviewLateArrival(lateId: number): void {
    this.processingLateId = lateId;
    
    this.http.put(`${this.apiUrl}/Admin/review-late/${lateId}`, {}).subscribe({
      next: () => {
        this.loadAllData();
        this.processingLateId = null;
      },
      error: (err) => {
        console.error('Review failed', err);
        this.processingLateId = null;
        alert('Failed to review late arrival. Please try again.');
      }
    });
  }

  viewEmployeeDetails(employeeId: number): void {
    const employee = this.allEmployees.find(e => e.employeeID === employeeId);
    if (employee) {
      this.selectedEmployee = employee;
      this.showEmployeeModal = true;
    } else {
      alert('Employee not found');
    }
  }

  closeEmployeeModal(): void {
    this.showEmployeeModal = false;
    this.selectedEmployee = null;
  }

  toggleTheme(): void {
    this.isDarkTheme = !this.isDarkTheme;
    localStorage.setItem('theme', this.isDarkTheme ? 'Dark' : 'Light');
    document.body.classList.toggle('dark-theme', this.isDarkTheme);
  }

  logout(): void {
    this.authService.logout();
  }

  goToDashboard(): void {
    this.router.navigate(['/']);
  }

  protected Math = Math;
}