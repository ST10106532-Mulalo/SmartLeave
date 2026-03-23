import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from '../services/auth';

/**
 * HTTP interceptor that automatically adds JWT authentication token
 * to all outgoing HTTP requests if user is authenticated.
 * 
 * This ensures that API endpoints requiring authorization receive
 * the Bearer token in the Authorization header.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(Auth);
  const token = authService.token;

  // If token exists, clone the request and add Authorization header
  if (token) {
    const clonedRequest = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(clonedRequest);
  }

  // Otherwise, proceed with original request
  return next(req);
};
