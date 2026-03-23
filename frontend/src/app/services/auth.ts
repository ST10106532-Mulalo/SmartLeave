import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  department: string;
  gender: string;
  dateOfBirth: string;
}

export interface AuthResponse {
  token: string;
  employeeID: number;
  email: string;
  name: string;
  role: string;
  department: string;
  expiration: Date;
}

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private apiUrl = 'http://localhost:5298/api';
  private readonly currentUserSubject = new BehaviorSubject<AuthResponse | null>(null);
  
  // Role hierarchy: higher index = more privileges
  private readonly roleHierarchy = ['Employee', 'Supervisor', 'Manager', 'Admin'];

  // Auto-logout configuration
  private inactivityTimer: any;
  private inactivityTimeout = 60 * 60 * 1000; // 1 hour (60 minutes)
  private lastActivityKey = 'last_activity';
  private inactivityCheckInterval = 30000; // Check every 30 seconds

  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router
  ) {
    this.loadStoredUser();
    this.startInactivityTimer();
    this.setupActivityListeners();
  }

  /**
   * Setup event listeners to track user activity
   */
  private setupActivityListeners(): void {
    const events = [
      'click',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'touchmove',
      'focus'
    ];
    
    const resetTimer = () => {
      if (this.isAuthenticated) {
        this.updateLastActivity();
      }
    };
    
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });
  }

  /**
   * Update last activity timestamp
   */
  private updateLastActivity(): void {
    localStorage.setItem(this.lastActivityKey, Date.now().toString());
  }

  /**
   * Get last activity time
   */
  private getLastActivity(): number | null {
    const lastActivity = localStorage.getItem(this.lastActivityKey);
    return lastActivity ? parseInt(lastActivity) : null;
  }

  /**
   * Check if user should be logged out due to inactivity
   */
  private checkInactivity(): void {
    const lastActivity = this.getLastActivity();
    if (lastActivity && this.isAuthenticated) {
      const now = Date.now();
      const inactiveTime = now - lastActivity;
      
      if (inactiveTime >= this.inactivityTimeout) {
        console.log('Auto-logout: User inactive for 1 hour');
        this.logout();
      }
    }
  }

  /**
   * Start the inactivity timer
   */
  private startInactivityTimer(): void {
    this.clearInactivityTimer();
    
    // Check inactivity at regular intervals
    this.inactivityTimer = setInterval(() => {
      if (this.isAuthenticated) {
        this.checkInactivity();
      }
    }, this.inactivityCheckInterval);
  }

  /**
   * Clear inactivity timer
   */
  private clearInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearInterval(this.inactivityTimer);
    }
  }

  /**
   * Retrieves and validates stored user data from localStorage on service initialization
   * Automatically logs out if token has expired
   */
  private loadStoredUser(): void {
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) return;

    try {
      const user: AuthResponse = JSON.parse(storedUser);
      const isValid = new Date(user.expiration) > new Date();

      if (isValid) {
        this.currentUserSubject.next(user);
        // Reset activity timer when user loads from storage
        this.updateLastActivity();
      } else {
        this.logout();
      }
    } catch {
      this.logout();
    }
  }

  /**
   * Authenticates user with email and password
   * Stores returned token and user data on success
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/Auth/login`, credentials)
      .pipe(
        tap(response => {
          localStorage.setItem('currentUser', JSON.stringify(response));
          this.currentUserSubject.next(response);
          this.updateLastActivity(); // Reset activity timer on login
        })
      );
  }

  /**
   * Registers a new user account
   * Automatically logs in the user upon successful registration
   */
  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/Auth/register`, userData)
      .pipe(
        tap(response => {
          localStorage.setItem('currentUser', JSON.stringify(response));
          this.currentUserSubject.next(response);
          this.updateLastActivity(); // Reset activity timer on register
        })
      );
  }

  /**
   * Logs out current user by clearing stored data and redirecting to login
   */
  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem(this.lastActivityKey);
    this.currentUserSubject.next(null);
    this.clearInactivityTimer();
    this.router.navigate(['/login']);
  }

  /**
   * Returns current authenticated user or null if not logged in
   */
  get currentUser(): AuthResponse | null {
    return this.currentUserSubject.value;
  }

  /**
   * Checks if user is currently authenticated with valid token
   */
  get isAuthenticated(): boolean {
    const user = this.currentUser;
    if (!user) return false;
    return new Date(user.expiration) > new Date();
  }

  /**
   * Returns JWT token for authenticated requests
   */
  get token(): string | null {
    return this.currentUser?.token || null;
  }

  /**
   * Returns current employee ID for API requests
   */
  get employeeId(): number | null {
    return this.currentUser?.employeeID || null;
  }

  /**
   * Returns user role for authorization decisions
   */
  get userRole(): string | null {
    return this.currentUser?.role || null;
  }

  /**
   * Checks if user has the required role or higher
   * @param requiredRole Minimum role required (Employee, Supervisor, Manager, Admin)
   */
  hasRole(requiredRole: string): boolean {
    const userRole = this.userRole;
    if (!userRole) return false;

    const userRoleIndex = this.roleHierarchy.indexOf(userRole);
    const requiredRoleIndex = this.roleHierarchy.indexOf(requiredRole);

    return userRoleIndex >= requiredRoleIndex;
  }

  /**
   * Checks if user can approve requests (Manager or Admin)
   */
  get canApprove(): boolean {
    const role = this.userRole;
    return role === 'Admin' || role === 'Manager';
  }

  /**
   * Checks if user can supervise (view but not approve) - Supervisor, Manager, Admin
   */
  get canSupervise(): boolean {
    const role = this.userRole;
    return role === 'Admin' || role === 'Manager' || role === 'Supervisor';
  }

  /**
   * Checks if user can view all records (Admin only)
   */
  get canViewAll(): boolean {
    return this.userRole === 'Admin';
  }

  /**
   * Gets display name for user's role
   */
  get roleDisplayName(): string {
    const role = this.userRole;
    switch(role) {
      case 'Admin': return 'Administrator';
      case 'Manager': return 'Department Manager';
      case 'Supervisor': return 'Team Supervisor';
      case 'Employee': return 'Employee';
      default: return role || 'User';
    }
  }
}