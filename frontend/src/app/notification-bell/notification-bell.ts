import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../services/notification.service';
import { Auth } from '../services/auth';
import { Subscription, interval } from 'rxjs';
import { HttpClient } from '@angular/common/http';

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
  private pollingSubscription: Subscription | null = null;
  private apiUrl = 'http://localhost:5298/api';
  
  // Track previous counts to detect new items
  private previousPendingApprovals = 0;
  private previousPendingLeaves = 0;
  private previousPendingLate = 0;

  constructor(
    public notificationService: NotificationService,
    private auth: Auth,
    private router: Router,
    private http: HttpClient
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
    
    // Start polling for admin-specific notifications
    this.startAdminPolling();
  }

  ngOnDestroy(): void {
    this.notificationService.stopPolling();
    this.stopShaking();
    this.subscription.unsubscribe();
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  private startAdminPolling(): void {
    // Poll every 30 seconds for new pending items
    this.pollingSubscription = interval(30000).subscribe(() => {
      if (this.auth.isAuthenticated) {
        this.checkForNewAdminNotifications();
      }
    });
  }

  private checkForNewAdminNotifications(): void {
    const userRole = this.auth.userRole;
    
    // For Admin users - check pending approvals
    if (userRole === 'Admin') {
      this.http.get(`${this.apiUrl}/Admin/pending-approvals`).subscribe({
        next: (data: any) => {
          const currentCount = data.length;
          
          // If there are new pending approvals
          if (currentCount > this.previousPendingApprovals && this.previousPendingApprovals > 0) {
            const newCount = currentCount - this.previousPendingApprovals;
            this.addLocalNotification({
              id: Date.now(),
              type: 'PendingApproval',
              title: 'New Pending Approvals',
              message: `${newCount} new user registration${newCount > 1 ? 's' : ''} pending approval`,
              referenceType: 'Admin',
              referenceID: null,
              createdAt: new Date(),
              isRead: false
            });
          } else if (currentCount > 0 && this.previousPendingApprovals === 0) {
            // First load - just set the count without notification
            this.addLocalNotification({
              id: Date.now(),
              type: 'PendingApproval',
              title: 'Pending Approvals',
              message: `${currentCount} user registration${currentCount > 1 ? 's are' : ' is'} pending approval`,
              referenceType: 'Admin',
              referenceID: null,
              createdAt: new Date(),
              isRead: false
            });
          }
          this.previousPendingApprovals = currentCount;
        },
        error: (err) => console.error('Failed to check pending approvals', err)
      });
    }

    // For Managers and Admins - check pending leaves
    if (this.auth.canApprove) {
      this.http.get(`${this.apiUrl}/LeaveRequests/pending-count`).subscribe({
        next: (data: any) => {
          const currentCount = data.count || 0;
          
          if (currentCount > this.previousPendingLeaves && this.previousPendingLeaves > 0) {
            const newCount = currentCount - this.previousPendingLeaves;
            this.addLocalNotification({
              id: Date.now(),
              type: 'NewLeave',
              title: 'New Leave Requests',
              message: `${newCount} new leave request${newCount > 1 ? 's' : ''} pending approval`,
              referenceType: 'Leave',
              referenceID: null,
              createdAt: new Date(),
              isRead: false
            });
          }
          this.previousPendingLeaves = currentCount;
        },
        error: (err) => console.error('Failed to check pending leaves', err)
      });
    }

    // For Managers and Admins - check pending late arrivals
    if (this.auth.canApprove) {
      this.http.get(`${this.apiUrl}/LateArrivals/pending-count`).subscribe({
        next: (data: any) => {
          const currentCount = data.count || 0;
          
          if (currentCount > this.previousPendingLate && this.previousPendingLate > 0) {
            const newCount = currentCount - this.previousPendingLate;
            this.addLocalNotification({
              id: Date.now(),
              type: 'NewLate',
              title: 'New Late Arrivals',
              message: `${newCount} new late arrival${newCount > 1 ? 's' : ''} pending review`,
              referenceType: 'Late',
              referenceID: null,
              createdAt: new Date(),
              isRead: false
            });
          }
          this.previousPendingLate = currentCount;
        },
        error: (err) => console.error('Failed to check pending late', err)
      });
    }
  }

  private addLocalNotification(notification: any): void {
    // Add to beginning of list
    this.notifications.unshift(notification);
    this.unreadCount++;
    this.startShaking();
    
    // Play sound
    this.playNotificationSound();
    
    // Save to localStorage
    this.saveLocalNotifications();
  }

  private saveLocalNotifications(): void {
    localStorage.setItem('localNotifications', JSON.stringify(this.notifications));
  }

  private loadLocalNotifications(): void {
    const saved = localStorage.getItem('localNotifications');
    if (saved) {
      const parsed = JSON.parse(saved);
      this.notifications = parsed;
      this.unreadCount = this.notifications.filter(n => !n.isRead).length;
    }
  }

  private playNotificationSound(): void {
    // Get user settings
    const settings = localStorage.getItem('userSettings');
    let masterSound = true;
    let volume = 24;
    let selectedSound = 'chime';
    
    if (settings) {
      const parsed = JSON.parse(settings);
      masterSound = parsed.masterSound ?? true;
      volume = parsed.volume ?? 24;
      selectedSound = parsed.selectedSound ?? 'chime';
    }
    
    if (!masterSound) return;
    
    // Use Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume / 100;
    gainNode.connect(audioContext.destination);
    
    // Create reverb effect
    const reverb = audioContext.createConvolver();
    const length = audioContext.sampleRate * 1.2;
    const impulse = audioContext.createBuffer(2, length, audioContext.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }
    reverb.buffer = impulse;
    
    gainNode.connect(reverb);
    reverb.connect(audioContext.destination);
    
    const now = audioContext.currentTime;
    
    switch (selectedSound) {
      case 'chime':
        const osc1 = audioContext.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.value = 587.33;
        osc1.connect(gainNode);
        osc1.start(now);
        osc1.stop(now + 0.4);
        
        const osc2 = audioContext.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = 783.99;
        osc2.connect(gainNode);
        osc2.start(now + 0.1);
        osc2.stop(now + 0.3);
        break;
        
      case 'ping':
        const pingOsc = audioContext.createOscillator();
        pingOsc.type = 'sine';
        pingOsc.frequency.value = 880;
        pingOsc.connect(gainNode);
        pingOsc.start(now);
        pingOsc.stop(now + 0.2);
        break;
        
      default:
        const defaultOsc = audioContext.createOscillator();
        defaultOsc.type = 'sine';
        defaultOsc.frequency.value = 659.25;
        defaultOsc.connect(gainNode);
        defaultOsc.start(now);
        defaultOsc.stop(now + 0.3);
        break;
    }
    
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    
    setTimeout(() => {
      audioContext.close();
    }, 1000);
  }

  toggleDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.showDropdown = !this.showDropdown;
    if (this.showDropdown && this.unreadCount > 0) {
      this.stopShaking();
    }
  }

  markAsRead(notificationId: number): void {
    const notification = this.notifications.find(n => n.notificationID === notificationId || n.id === notificationId);
    if (notification && !notification.isRead) {
      notification.isRead = true;
      this.unreadCount = this.notifications.filter(n => !n.isRead).length;
      this.saveLocalNotifications();
      
      // Also mark in backend if it's a real notification
      if (notification.notificationID) {
        this.notificationService.markAsRead(notificationId).subscribe({
          next: () => {},
          error: (err) => console.error('Failed to mark as read', err)
        });
      }
    }
  }

  markAllAsRead(): void {
    // Mark local notifications as read
    this.notifications.forEach(n => n.isRead = true);
    this.unreadCount = 0;
    this.saveLocalNotifications();
    this.stopShaking();
    
    // Also mark in backend
    const employeeId = this.auth.employeeId;
    if (employeeId) {
      this.notificationService.markAllAsRead(employeeId).subscribe({
        next: () => {},
        error: (err) => console.error('Failed to mark all as read', err)
      });
    }
  }

  // ADD THIS METHOD - FIXES THE ERROR
  clearAll(): void {
    if (confirm('Clear all notifications?')) {
      this.notifications = [];
      this.unreadCount = 0;
      localStorage.removeItem('localNotifications');
    }
  }

  navigateToReference(notification: any): void {
    if (notification.referenceType === 'Leave') {
      this.router.navigate(['/leave-request', notification.referenceID]);
    } else if (notification.referenceType === 'Late') {
      this.router.navigate(['/late-arrival', notification.referenceID]);
    } else if (notification.type === 'PendingApproval') {
      this.router.navigate(['/admin']);
    }
    this.showDropdown = false;
  }

  navigateToAll(): void {
    this.router.navigate(['/notifications']);
    this.showDropdown = false;
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

  getNotificationColor(type: string): string {
    switch(type) {
      case 'PendingApproval': return '#ffaa00';
      case 'NewLeave': return '#00ffff';
      case 'NewLate': return '#ffaa00';
      case 'LeaveApproved': return '#00ff80';
      case 'LeaveRejected': return '#ff4d4d';
      default: return '#00ffff';
    }
  }

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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.notification-container')) {
      this.showDropdown = false;
    }
  }
}