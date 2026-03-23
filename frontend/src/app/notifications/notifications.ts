import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NotificationService, Notification } from '../services/notification.service';
import { Auth } from '../services/auth';
import { LogoComponent } from '../components/logo/logo.component';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule, LogoComponent],
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.css']
})
export class Notifications implements OnInit {
  notifications: Notification[] = [];
  filteredNotifications: Notification[] = [];
  loading = true;
  
  filterType: string = 'all';
  filterStatus: string = 'all';
  searchTerm: string = '';
  
  currentPage: number = 1;
  pageSize: number = 20;
  totalPages: number = 1;

  constructor(
    private notificationService: NotificationService,
    private auth: Auth,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    const employeeId = this.auth.employeeId;
    if (!employeeId) {
      this.router.navigate(['/login']);
      return;
    }

    this.notificationService.fetchNotifications(employeeId).subscribe({
      next: (notifs) => {
        this.notifications = notifs;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load notifications:', error);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.notifications];

    if (this.filterType !== 'all') {
      filtered = filtered.filter(n => n.type === this.filterType);
    }

    if (this.filterStatus !== 'all') {
      const isRead = this.filterStatus === 'read';
      filtered = filtered.filter(n => n.isRead === isRead);
    }

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(term) ||
        n.message.toLowerCase().includes(term)
      );
    }

    filtered.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    this.filteredNotifications = filtered;
    this.totalPages = Math.ceil(this.filteredNotifications.length / this.pageSize);
    this.currentPage = 1;
  }

  markAsRead(notificationId: number): void {
    this.notificationService.markAsRead(notificationId).subscribe({
      next: () => {
        const index = this.notifications.findIndex(n => n.notificationID === notificationId);
        if (index !== -1) {
          this.notifications[index].isRead = true;
          this.applyFilters();
        }
      },
      error: (err) => console.error('Failed to mark as read', err)
    });
  }

  markAllAsRead(): void {
    const employeeId = this.auth.employeeId;
    if (!employeeId) return;

    this.notificationService.markAllAsRead(employeeId).subscribe({
      next: () => {
        this.notifications.forEach(n => n.isRead = true);
        this.applyFilters();
      },
      error: (err) => console.error('Failed to mark all as read', err)
    });
  }

  deleteNotification(notificationId: number): void {
    if (confirm('Are you sure you want to delete this notification?')) {
      this.notificationService.deleteNotification(notificationId).subscribe({
        next: () => {
          this.notifications = this.notifications.filter(n => n.notificationID !== notificationId);
          this.applyFilters();
        },
        error: (err) => console.error('Failed to delete notification', err)
      });
    }
  }

  clearAll(): void {
    const employeeId = this.auth.employeeId;
    if (!employeeId) return;
    
    if (confirm('Are you sure you want to delete ALL notifications? This cannot be undone.')) {
      this.notificationService.deleteAllNotifications(employeeId).subscribe({
        next: () => {
          this.notifications = [];
          this.applyFilters();
        },
        error: (err) => console.error('Failed to clear notifications', err)
      });
    }
  }

  get paginatedNotifications(): Notification[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredNotifications.slice(start, end);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  getNotificationIcon(type: string): string {
    switch(type) {
      case 'NewLeave': return '📋';
      case 'NewLate': return '⏰';
      case 'LeaveApproved': return '✅';
      case 'LeaveRejected': return '❌';
      case 'LateReviewed': return '👀';
      case 'PendingApproval': return '⏳';
      default: return '📌';
    }
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return then.toLocaleDateString();
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}