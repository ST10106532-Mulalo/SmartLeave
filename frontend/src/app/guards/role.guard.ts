import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../services/auth';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard {
  constructor(
    private authService: Auth,
    private router: Router
  ) {}

  canActivate(route: any): boolean {
    const userRole = this.authService.userRole;
    const requiredRole = route.data['role'];

    // Admin can access everything
    if (userRole === 'Admin') {
      return true;
    }

    // Check if user has the required role
    if (userRole === requiredRole) {
      return true;
    }

    // Redirect to appropriate dashboard based on role
    if (userRole === 'Manager') {
      this.router.navigate(['/manager']);
    } else if (userRole === 'Employee') {
      this.router.navigate(['/']);
    } else {
      this.router.navigate(['/login']);
    }

    return false;
  }
}