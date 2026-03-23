import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, Subscription } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { Auth } from './auth';

export interface Notification {
  notificationID: number;
  employeeID: number;
  type: string;
  title: string;
  message: string;
  referenceID?: number;
  referenceType?: string;
  isRead: boolean;
  isHeard: boolean;
  createdAt: Date;
  readAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'http://localhost:5298/api';
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private pollingSubscription: Subscription | null = null;
  
  public notifications$ = this.notificationsSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();

  // Sound files (you'll need to add these to your assets folder)
  private sounds = {
    chime: new Audio('/assets/sounds/chime.mp3'),
    bell: new Audio('/assets/sounds/bell.mp3'),
    digital: new Audio('/assets/sounds/digital.mp3'),
    soft: new Audio('/assets/sounds/soft.mp3'),
    success: new Audio('/assets/sounds/success.mp3')
  };

  constructor(
    private http: HttpClient,
    private auth: Auth
  ) {
    this.sounds.chime.load();
    this.sounds.bell.load();
    this.sounds.digital.load();
    this.sounds.soft.load();
    this.sounds.success.load();
  }

  /**
   * Start polling for notifications (call after login)
   */
  startPolling(): void {
    if (this.pollingSubscription) {
      this.stopPolling();
    }

    const employeeId = this.auth.employeeId;
    if (!employeeId) return;

    // Poll every 30 seconds
    this.pollingSubscription = interval(30000).pipe(
      switchMap(() => this.fetchNotifications(employeeId))
    ).subscribe();

    // Initial fetch
    this.fetchNotifications(employeeId).subscribe();
  }

  /**
   * Stop polling for notifications
   */
  stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }

  /**
   * Fetch notifications for current user
   */
  fetchNotifications(employeeId: number): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/Notification/user/${employeeId}`).pipe(
      catchError(error => {
        console.error('Error fetching notifications:', error);
        return [];
      })
    );
  }

  /**
   * Get unread count
   */
  getUnreadCount(employeeId: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/Notification/user/${employeeId}/unread-count`);
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/Notification/${notificationId}/read`, {});
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(employeeId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/Notification/user/${employeeId}/read-all`, {});
  }

  /**
   * Delete a single notification
   */
  deleteNotification(notificationId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/Notification/${notificationId}`);
  }

  /**
   * Delete all notifications for a user
   */
  deleteAllNotifications(employeeId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/Notification/user/${employeeId}/all`);
  }

  /**
   * Play notification sound based on type
   */
  playSound(type: string, settings?: any): void {
    if (settings?.masterSound === false) return;

    let soundFile: HTMLAudioElement;
    
    switch(type) {
      case 'NewLeave':
        soundFile = this.sounds.chime;
        break;
      case 'NewLate':
        soundFile = this.sounds.bell;
        break;
      case 'LeaveApproved':
      case 'LateReviewed':
        soundFile = this.sounds.success;
        break;
      case 'LeaveRejected':
        soundFile = this.sounds.soft;
        break;
      default:
        soundFile = this.sounds.digital;
    }

    soundFile.volume = (settings?.volume || 80) / 100;
    soundFile.play().catch(e => console.log('Sound play failed:', e));
  }

  /**
   * Show browser notification
   */
  showBrowserNotification(title: string, body: string): void {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/assets/icon.png' });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, { body, icon: '/assets/icon.png' });
        }
      });
    }
  }

  /**
   * Vibrate device (if supported)
   */
  vibrate(duration: number = 500): void {
    if (window.navigator.vibrate) {
      window.navigator.vibrate(duration);
    }
  }

  /**
   * Vibrate in a pattern (shake effect)
   */
  shakeVibrate(): void {
    if (window.navigator.vibrate) {
      window.navigator.vibrate([200, 100, 200, 100, 200]);
    }
  }
}