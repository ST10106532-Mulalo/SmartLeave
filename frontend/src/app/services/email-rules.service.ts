import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EmailDomainRule {
  name: string;
  allowedDomains: string[];
  usernamePattern: string | null;
  description: string;
  isActive: boolean;
}

export interface EmailValidationConfig {
  enabled: boolean;
  strictMode: boolean;
  rules: EmailDomainRule[];
}

@Injectable({
  providedIn: 'root'
})
export class EmailRulesService {
 private apiUrl = 'http://localhost:5298/api';

  constructor(private http: HttpClient) {}

  getEmailRules(): Observable<EmailValidationConfig> {
    return this.http.get<EmailValidationConfig>(`${this.apiUrl}/Config/email-rules`);
  }
}