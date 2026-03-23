import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth } from '../services/auth';
import { LeaveService } from '../services/leave.service';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NotificationBellComponent } from '../notification-bell/notification-bell';
import { LogoComponent } from '../components/logo/logo.component';

@Component({
  selector: 'app-supervisor-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    NotificationBellComponent,
    LogoComponent
  ],
  templateUrl: './supervisor-dashboard.html',
  styleUrls: ['./supervisor-dashboard.css']
})
export class SupervisorDashboardComponent implements OnInit {
  teamMembers: any[] = [];
  pendingRequests: any[] = [];
  lateArrivals: any[] = [];
  
  loadingTeam = true;
  loadingRequests = true;
  loadingLate = true;
  
  totalPendingRequests = 0;
  teamOnLeaveToday = 0;
  
  userName: string = '';
  departmentName: string = '';
  currentDate = new Date();
  isDarkTheme = false;
  selectedEmployee: any = null;
  selectedDetailTab: 'leaves' | 'late' = 'leaves';

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

    if (!this.authService.canSupervise) {
      this.router.navigate(['/']);
      return;
    }

    this.userName = this.authService.currentUser?.name || 'Supervisor';
    this.departmentName = this.authService.currentUser?.department || '';
    this.loadTeamMembers();
    this.calculateStats();
  }

  private loadTeamMembers(): void {
    const supervisorId = this.authService.employeeId;
    if (!supervisorId) return;

    // TODO: Replace with actual API call
    setTimeout(() => {
      this.teamMembers = [
        { 
          id: 1, 
          name: 'John Smith', 
          department: 'IT', 
          pendingRequests: 2, 
          completedRequests: 5, 
          isActive: true,
          avatar: 'JS'
        },
        { 
          id: 2, 
          name: 'Sarah Johnson', 
          department: 'IT', 
          pendingRequests: 0, 
          completedRequests: 8, 
          isActive: true,
          avatar: 'SJ'
        },
        { 
          id: 3, 
          name: 'Mike Chen', 
          department: 'IT', 
          pendingRequests: 1, 
          completedRequests: 3, 
          isActive: false,
          avatar: 'MC'
        },
        { 
          id: 4, 
          name: 'Lisa Wong', 
          department: 'IT', 
          pendingRequests: 0, 
          completedRequests: 6, 
          isActive: true,
          avatar: 'LW'
        }
      ];
      this.loadingTeam = false;
      this.calculateStats();
    }, 1000);
  }

  viewEmployeeDetails(employee: any): void {
    this.selectedEmployee = employee;
    this.selectedDetailTab = 'leaves';
    
    this.pendingRequests = [
      {
        leaveID: 101,
        leaveType: 'Annual',
        startDate: new Date(),
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        reason: 'Family vacation'
      },
      {
        leaveID: 102,
        leaveType: 'Sick',
        startDate: new Date(),
        endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        reason: 'Medical appointment'
      }
    ];
    
    this.lateArrivals = [
      {
        lateID: 201,
        date: new Date(),
        expectedArrival: '09:00',
        reason: 'Traffic delay',
        status: 'Pending',
        photoPath: null
      }
    ];
    
    this.loadingRequests = false;
    this.loadingLate = false;
  }

  clearSelectedEmployee(): void {
    this.selectedEmployee = null;
    this.pendingRequests = [];
    this.lateArrivals = [];
  }

  addComment(requestId: number): void {
    const comment = prompt('Enter your comment:');
    if (comment) {
      console.log('Adding comment to request:', requestId, comment);
      alert('Comment added successfully');
    }
  }

  forwardToManager(requestId: number): void {
    if (confirm('Forward this request to your manager?')) {
      console.log('Forwarding request to manager:', requestId);
      alert('Request forwarded to manager');
    }
  }

  private calculateStats(): void {
    this.totalPendingRequests = this.teamMembers.reduce(
      (sum, member) => sum + (member.pendingRequests || 0), 0
    );
    
    this.teamOnLeaveToday = Math.floor(Math.random() * 2);
  }

  getAvatarColor(name: string): string {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    ];
    const index = name.length % gradients.length;
    return gradients[index];
  }

  viewAllTeam(): void {
    console.log('View all team members');
  }

  generateReport(): void {
    console.log('Generating team report');
    alert('Report generation started');
  }

  contactManager(): void {
    console.log('Contacting manager');
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