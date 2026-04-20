import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { LessonType, Slot, Booking, BookingCreateResponse, Instructor, WindForecast } from '@kite/shared-types';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;

  private http = inject(HttpClient);

  // Lesson Types
  getLessonTypes() { return this.http.get<LessonType[]>(`${this.base}/lesson-types`); }
  getLessonType(id: string) { return this.http.get<LessonType>(`${this.base}/lesson-types/${id}`); }
  createLessonType(data: Partial<LessonType>) { return this.http.post<LessonType>(`${this.base}/lesson-types`, data); }
  updateLessonType(id: string, data: Partial<LessonType>) { return this.http.patch<LessonType>(`${this.base}/lesson-types/${id}`, data); }
  deleteLessonType(id: string) { return this.http.delete(`${this.base}/lesson-types/${id}`); }

  // Slots
  getSlots(params: { startAfter?: string; startBefore?: string; lessonTypeId?: string; status?: string; instructorId?: string } = {}) {
    let hp = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v) hp = hp.set(k, v); });
    return this.http.get<Slot[]>(`${this.base}/slots`, { params: hp });
  }
  createSlot(data: { instructorId: string; locationId: string; lessonTypeId: string; startsAt: string; endsAt: string; maxStudents: number }) {
    return this.http.post<Slot>(`${this.base}/slots`, data);
  }
  updateSlotStatus(id: string, newStatus: string, reason?: string) {
    return this.http.patch<Slot>(`${this.base}/slots/${id}/status`, { newStatus, reason });
  }
  cancelDay(date: string, reason: string) {
    return this.http.post<{ cancelled: number }>(`${this.base}/slots/cancel-day`, { date, reason });
  }

  // Bookings
  createBooking(slotId: string, notes?: string) { return this.http.post<BookingCreateResponse>(`${this.base}/bookings`, { slotId, notes }); }
  getMyBookings() { return this.http.get<Booking[]>(`${this.base}/bookings/mine`); }
  getAllBookings() { return this.http.get<Booking[]>(`${this.base}/bookings`); }
  cancelBooking(id: string) { return this.http.post<Booking>(`${this.base}/bookings/${id}/cancel`, {}); }
  rescheduleBooking(id: string, newSlotId: string) { return this.http.post<Booking>(`${this.base}/bookings/${id}/reschedule`, { newSlotId }); }

  // Instructors
  getInstructors() { return this.http.get<Instructor[]>(`${this.base}/instructors`); }
  createInstructor(data: { email: string; name: string; bio: string; certifications: string[]; colorHex: string }) {
    return this.http.post<Instructor>(`${this.base}/instructors`, data);
  }

  // Weather
  getWeatherForecast(hours = 48) { return this.http.get<WindForecast[]>(`${this.base}/weather/forecast`, { params: { hours: hours.toString() } }); }

  // Users (admin)
  getUsers(page = 1, limit = 20) { return this.http.get<{ data: Record<string, unknown>[]; total: number }>(`${this.base}/users`, { params: { page: page.toString(), limit: limit.toString() } }); }
}
