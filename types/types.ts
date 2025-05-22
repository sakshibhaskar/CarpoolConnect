export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  profileImage?: string;
  rating?: number;
  verificationStatus?: {
    email: boolean;
    phone: boolean;
    license: boolean;
  };
  preferences?: {
    smoking: boolean;
    pets: boolean;
    music: string;
    chatLevel: 'Chatty' | 'Quiet' | 'Silent';
  };
  emergencyContacts?: EmergencyContact[];
  ridesOffered?: number;
  ridesTaken?: number;
  memberSince?: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export interface Ride {
  id: string;
  driverId: string;
  driver?: User;
  origin: {
    name: string;
    lat: number;
    lng: number;
  };
  destination: {
    name: string;
    lat: number;
    lng: number;
  };
  departureTime: string;
  estimatedArrival: string;
  seats: number;
  availableSeats: number;
  price: number;
  vehicle?: Vehicle;
  preferences?: {
    smoking: boolean;
    pets: boolean;
    music: boolean;
  };
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  passengers?: User[];
  requests?: RideRequest[];
  distance?: number;
  duration?: string;
}

export interface Vehicle {
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate?: string;
}

export interface RideRequest {
  id: string;
  rideId: string;
  userId: string;
  user?: User;
  status: 'pending' | 'accepted' | 'declined';
  passengers: number;
  message?: string;
  timestamp: string;
}

export interface Message {
  id: string;
  rideId: string;
  senderId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface EmergencyAlert {
  id: string;
  userId: string;
  location: {
    lat: number;
    lng: number;
  };
  timestamp: string;
  resolved: boolean;
}

export interface ChatConversation {
  id: string;
  rideId: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
}