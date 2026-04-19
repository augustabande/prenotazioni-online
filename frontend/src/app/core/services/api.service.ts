import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { LessonType, Slot, Booking, BookingCreateResponse } from '@kite/shared-types';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getLessonTypes() {
    return this.http.get<LessonType[]>(`${this.base}/lesson-types`);
  }

  getLessonType(id: string) {
    return this.http.get<LessonType>(`${this.base}/lesson-types/${id}`);
  }

  getSlots(params: { startAfter?: string; lessonTypeId?: string } = {}) {
    let hp = new HttpParams();
    if (params.startAfter) hp = hp.set('startAfter', params.startAfter);
    if (params.lessonTypeId) hp = hp.set('lessonTypeId', params.lessonTypeId);
    return this.http.get<Slot[]>(`${this.base}/slots`, { params: hp });
  }

  createBooking(slotId: string, notes?: string) {
    return this.http.post<BookingCreateResponse>(`${this.base}/bookings`, { slotId, notes });
  }

  getMyBookings() {
    return this.http.get<Booking[]>(`${this.base}/bookings/mine`);
  }

  cancelBooking(id: string) {
    return this.http.post<Booking>(`${this.base}/bookings/${id}/cancel`, {});
  }

  rescheduleBooking(id: string, newSlotId: string) {
    return this.http.post<Booking>(`${this.base}/bookings/${id}/reschedule`, { newSlotId });
  }
}
