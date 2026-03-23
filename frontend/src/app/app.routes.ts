import { Routes } from '@angular/router';
import { EmployeeDashboardComponent } from './employee-dashboard/employee-dashboard';
import { ManagerDashboardComponent } from './manager-dashboard/manager-dashboard';
import { SupervisorDashboardComponent } from './supervisor-dashboard/supervisor-dashboard';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard';
import { LeaveRequestFormComponent } from './leave-request-form/leave-request-form';
import { LateArrivalFormComponent } from './late-arrival-form/late-arrival-form';
import { LoginComponent } from './login/login.component';
import { Register } from './register/register';
import { SettingsComponent } from './settings/settings';
import { Notifications } from './notifications/notifications';
import { OvertimeComponent } from './overtime/overtime';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: Register },
  { path: 'settings', component: SettingsComponent, canActivate: [AuthGuard] },
  { path: 'notifications', component: Notifications, canActivate: [AuthGuard] },
  { path: 'overtime', component: OvertimeComponent, canActivate: [AuthGuard] },
  {
    path: '',
    component: EmployeeDashboardComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'supervisor',
    component: SupervisorDashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'Supervisor' }
  },
  {
    path: 'manager',
    component: ManagerDashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'Manager' }
  },
  {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'Admin' }
  },
  {
    path: 'leave-request',
    component: LeaveRequestFormComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'late-arrival',
    component: LateArrivalFormComponent,
    canActivate: [AuthGuard]
  }
];