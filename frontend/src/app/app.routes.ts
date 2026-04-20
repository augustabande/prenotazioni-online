import { Route } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'lezioni',
    loadComponent: () => import('./features/catalog/catalog.component').then((m) => m.CatalogComponent),
  },
  {
    path: 'lezioni/:id',
    loadComponent: () => import('./features/catalog/lesson-detail.component').then((m) => m.LessonDetailComponent),
  },
  {
    path: 'prenota/:slotId',
    canMatch: [authGuard],
    loadComponent: () => import('./features/booking/booking-flow.component').then((m) => m.BookingFlowComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'portale',
    canMatch: [authGuard, roleGuard('CUSTOMER')],
    loadComponent: () => import('./features/portal/portal-layout.component').then((m) => m.PortalLayoutComponent),
    children: [
      { path: '', loadComponent: () => import('./features/portal/dashboard.component').then((m) => m.DashboardComponent) },
      { path: 'prenotazioni', loadComponent: () => import('./features/portal/bookings-list.component').then((m) => m.BookingsListComponent) },
      { path: 'prenotazioni/:id', loadComponent: () => import('./features/portal/booking-detail.component').then((m) => m.BookingDetailComponent) },
    ],
  },
  {
    path: 'admin',
    canMatch: [authGuard, roleGuard('ADMIN')],
    loadComponent: () => import('./features/admin/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      { path: '', loadComponent: () => import('./features/admin/admin-dashboard.component').then((m) => m.AdminDashboardComponent) },
      { path: 'slots', loadComponent: () => import('./features/admin/slots-calendar.component').then((m) => m.SlotsCalendarComponent) },
      { path: 'bookings', loadComponent: () => import('./features/admin/admin-bookings.component').then((m) => m.AdminBookingsComponent) },
      { path: 'lesson-types', loadComponent: () => import('./features/admin/lesson-types-admin.component').then((m) => m.LessonTypesAdminComponent) },
      { path: 'instructors', loadComponent: () => import('./features/admin/instructors-admin.component').then((m) => m.InstructorsAdminComponent) },
      { path: 'weather', loadComponent: () => import('./features/admin/weather-preview.component').then((m) => m.WeatherPreviewComponent) },
    ],
  },
  {
    path: '**',
    loadComponent: () => import('./shared/components/not-found.component').then((m) => m.NotFoundComponent),
  },
];
