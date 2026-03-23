import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../services/notification.service';
import { Auth } from '../services/auth';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-bell.html',
  styleUrls: ['./notification-bell.css']
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  unreadCount: number = 0;
  showDropdown: boolean = false;
  notifications: any[] = [];
  isShaking: boolean = false;
  private shakeInterval: any;
  private subscription: Subscription = new Subscription();

  constructor(
    public notificationService: NotificationService,
    private auth: Auth,
    private router: Router
  ) {}

  ngOnInit(): void {
    const employeeId = this.auth.employeeId;
    if (!employeeId) return;

    this.notificationService.startPolling();

    this.subscription.add(
      this.notificationService.unreadCount$.subscribe(count => {
        this.unreadCount = count;
        if (count > 0) {
          this.startShaking();
        } else {
          this.stopShaking();
        }
      })
    );

    this.subscription.add(
      this.notificationService.notifications$.subscribe(notifs => {
        this.notifications = notifs;
      })
    );

    this.notificationService.getUnreadCount(employeeId).subscribe(count => {
      this.unreadCount = count;
    });

    this.notificationService.fetchNotifications(employeeId).subscribe(notifs => {
      this.notifications = notifs;
    });
  }

  ngOnDestroy(): void {
    this.notificationService.stopPolling();
    this.stopShaking();
    this.subscription.unsubscribe();
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
    if (this.showDropdown && this.unreadCount > 0) {
      this.stopShaking();
    }
  }

  markAsRead(notificationId: number): void {
    this.notificationService.markAsRead(notificationId).subscribe(() => {
      const employeeId = this.auth.employeeId;
      if (employeeId) {
        this.notificationService.getUnreadCount(employeeId).subscribe(count => {
          this.unreadCount = count;
        });
        this.notificationService.fetchNotifications(employeeId).subscribe(notifs => {
          this.notifications = notifs;
        });
      }
    });
  }

  markAllAsRead(): void {
    const employeeId = this.auth.employeeId;
    if (!employeeId) return;

    this.notificationService.markAllAsRead(employeeId).subscribe(() => {
      this.unreadCount = 0;
      this.notificationService.fetchNotifications(employeeId).subscribe(notifs => {
        this.notifications = notifs;
      });
      this.stopShaking();
    });
  }

  navigateToReference(notification: any): void {
    if (notification.referenceType === 'Leave') {
      this.router.navigate(['/leave-request', notification.referenceID]);
    } else if (notification.referenceType === 'Late') {
      this.router.navigate(['/late-arrival', notification.referenceID]);
    }
    this.showDropdown = false;
  }

  // ========== ADD THESE TWO METHODS HERE ==========
  
  /**
   * Navigates to the notifications page
   */
  navigateToAll(): void {
    this.router.navigate(['/notifications']);
    this.showDropdown = false;
  }

  /**
   * Returns an emoji icon based on notification type
   */
  getNotificationIcon(type: string): string {
    switch(type) {
      case 'NewLeave': return '📋';
      case 'NewLate': return '⏰';
      case 'LeaveApproved': return '✅';
      case 'LeaveRejected': return '❌';
      case 'LateReviewed': return '👀';
      default: return '📌';
    }
  }

  // ==============================================

  private startShaking(): void {
    if (this.isShaking) return;
    
    this.isShaking = true;
    this.shakeInterval = setInterval(() => {
      this.isShaking = true;
      setTimeout(() => {
        this.isShaking = false;
      }, 500);
    }, 3000);
  }

  private stopShaking(): void {
    this.isShaking = false;
    if (this.shakeInterval) {
      clearInterval(this.shakeInterval);
      this.shakeInterval = null;
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
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }
}