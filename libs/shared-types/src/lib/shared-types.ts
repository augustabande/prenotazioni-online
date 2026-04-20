export interface ApiResponse<T> {
  data: T;
  message: string;
  statusCode: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}

export type SlotStatus = 'AVAILABLE' | 'PENDING' | 'CONFIRMED' | 'CANCELLED_BY_WEATHER' | 'CANCELLED_BY_SCHOOL' | 'COMPLETED';
export type Role = 'CUSTOMER' | 'INSTRUCTOR' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface LessonType {
  id: string;
  code: string;
  title: string;
  description: string;
  durationMinutes: number;
  minParticipants: number;
  maxParticipants: number;
  pricePerPerson: number;
  requiredWindKnotsMin: number;
  requiredWindKnotsMax: number;
  imageUrl?: string;
  active: boolean;
}

export interface Instructor {
  id: string;
  userId: string;
  bio: string;
  certifications: string[];
  colorHex: string;
  active: boolean;
  user: User;
}

export interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description: string;
}

export interface Slot {
  id: string;
  instructorId: string;
  locationId: string;
  lessonTypeId: string;
  startsAt: string;
  endsAt: string;
  status: SlotStatus;
  maxStudents: number;
  weatherCheckedAt?: string;
  weatherDecisionReason?: string;
  windForecastKnots?: number;
  instructor: Instructor;
  lessonType: LessonType;
  location: Location;
}

export interface Booking {
  id: string;
  slotId: string;
  userId: string;
  status: SlotStatus;
  stripePaymentIntentId?: string;
  depositAmount: number;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  slot: Slot;
  user?: User;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface BookingCreateResponse {
  booking: Booking;
  clientSecret: string;
}

export interface WindForecast {
  time: string;
  windSpeedKnots: number;
  windDirection: number;
}
