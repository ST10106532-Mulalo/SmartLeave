import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserSettings {
  settingID?: number;
  employeeID: number;
  masterSound: boolean;
  volume: number;
  vibration: boolean;
  notificationDuration: number;
  theme: 'Light' | 'Dark' | 'Auto';
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  dailyDigest: boolean;
  digestTime: string;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
 private apiUrl = 'http://localhost:5298/api';

  constructor(private http: HttpClient) {}

  /**
   * Get user settings by employee ID
   */
  getUserSettings(employeeId: number): Observable<UserSettings> {
    return this.http.get<UserSettings>(`${this.apiUrl}/Settings/user/${employeeId}`);
  }

  /**
   * Update user settings
   */
  updateUserSettings(settings: UserSettings): Observable<UserSettings> {
    return this.http.put<UserSettings>(`${this.apiUrl}/Settings/${settings.employeeID}`, settings);
  }

  /**
   * Create default settings for a new user
   */
  createDefaultSettings(employeeId: number): Observable<UserSettings> {
    const defaultSettings: UserSettings = {
      employeeID: employeeId,
      masterSound: true,
      volume: 80,
      vibration: true,
      notificationDuration: 60,
      theme: 'Light',
      dateFormat: 'MM/DD/YYYY',
      dailyDigest: false,
      digestTime: '08:00'
    };
    return this.http.post<UserSettings>(`${this.apiUrl}/Settings`, defaultSettings);
  }
}