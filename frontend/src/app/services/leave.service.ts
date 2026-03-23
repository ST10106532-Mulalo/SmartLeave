import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LeaveService {
  private apiUrl = 'http://localhost:5298/api';

  constructor(private http: HttpClient) { }

  // Leave requests
  applyForLeave(leaveData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/LeaveRequests`, leaveData);
  }

  getMyLeaves(employeeId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/LeaveRequests/employee/${employeeId}`);
  }

  // Late arrivals
  getMyLateArrivals(employeeId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/LateArrivals/employee/${employeeId}`);
  }

  reportLate(lateData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/LateArrivals`, lateData);
  }
}