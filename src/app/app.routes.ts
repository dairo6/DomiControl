import { Routes } from '@angular/router';
import { AuthLayout } from './layout/auth-layout/auth-layout';
import { MainLayout } from './layout/main-layout/main-layout';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { ForgotPassword } from './features/auth/forgot-password/forgot-password';
import { DashboardComponent } from './features/dashboard/dashboard';
import { ClientList } from './features/clients/client-list/client-list';
import { ClientForm } from './features/clients/client-form/client-form';
import { ClientStatement } from './features/clients/client-statement/client-statement';
import { ReportsComponent } from './features/reports/reports';
import { authGuard } from './core/guards/auth.guard';
import { noAuthGuard } from './core/guards/no-auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: AuthLayout,
    canActivate: [noAuthGuard],
    children: [
      { path: 'login', component: Login },
      { path: 'register', component: Register },
      { path: 'forgot-password', component: ForgotPassword },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent, data: { title: 'Dashboard', subtitle: 'Resumen general del estado de tus domicilios y cobros.' } },
      { path: 'clients', component: ClientList, data: { title: 'Clientes', subtitle: 'Administra tu lista de clientes y su estado.' } },
      { path: 'clients/:id', component: ClientStatement, data: { title: 'Estado de Cuenta', subtitle: 'Detalle de movimientos del cliente.' } },
      { path: 'reports', component: ReportsComponent, data: { title: 'Reportes e Historial', subtitle: 'Consulta todos los movimientos de ingresos y domicilios por fecha.' } },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
