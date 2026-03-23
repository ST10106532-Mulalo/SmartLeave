import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Overtime {
  overtimeID: number;
  managerID: number;
  title: string;
  description: string;
  date: Date;
  startTime: string;
  endTime: string;
  maxSlots: number;
  currentSlots: number;
  status: string;
  managerName?: string;
  managerDepartment?: string;
}

export interface OvertimeApplication {
  applicationID: number;
  overtimeID: number;
  employeeID: number;
  status: string;
  appliedAt: Date;
  reason?: string;
  overtime?: Overtime;
}

@Injectable({
  providedIn: 'root'
})
export class OvertimeService {
  private apiUrl = 'http://localhost:5298/api/Overtime';

  constructor(private http: HttpClient) {}

  // Get employee's department info
  getEmployeeDepartment(employeeId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/employee/department/${employeeId}`);
  }

  // Get open overtime opportunities filtered by department
  getOpenOvertimeByDepartment(departmentId: number): Observable<Overtime[]> {
    let params = new HttpParams().set('departmentId', departmentId.toString());
    return this.http.get<Overtime[]>(this.apiUrl, { params });
  }

  // Get all open overtime opportunities (for employees)
  getOpenOvertime(): Observable<Overtime[]> {
    return this.http.get<Overtime[]>(this.apiUrl);
  }

  // Get manager's overtime posts (for managers)
  getManagerOvertime(managerId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/manager/${managerId}`);
  }

  // Get employee's applications (for employees)
  getEmployeeApplications(employeeId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/employee/${employeeId}/applications`);
  }

  // Create overtime post (manager only)
  createOvertime(overtime: any): Observable<any> {
    return this.http.post(this.apiUrl, overtime);
  }

  // Apply for overtime (employee only)
  applyForOvertime(overtimeID: number, employeeID: number, reason?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/apply`, { overtimeID, employeeID, reason });
  }

  // Approve application (manager only)
  approveApplication(applicationId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/application/${applicationId}/approve`, {});
  }

  // Reject application (manager only)
  rejectApplication(applicationId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/application/${applicationId}/reject`, {});
  }

  // Close overtime (manager only)
  closeOvertime(overtimeId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${overtimeId}/close`, {});
  }
}