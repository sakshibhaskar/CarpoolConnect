/*
  # CarpoolConnect Database Schema

  1. New Tables
    - users
      - Basic user information and verification status
    - rides
      - Ride details including route, pricing, and preferences
    - ride_requests
      - Booking requests from passengers
    - reviews
      - User reviews and ratings

  2. Security
    - Enable RLS on all tables
    - Add policies for data access control

  3. Initial Data
    - Sample users and rides for testing
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  avatar_url text,
  rating decimal(3,2) DEFAULT 5.0,
  rides_offered integer DEFAULT 0,
  rides_taken integer DEFAULT 0,
  member_since timestamp with time zone DEFAULT now(),
  verification_status jsonb DEFAULT '{"email": true, "phone": false, "license": false}'::jsonb,
  preferences jsonb DEFAULT '{"smoking": false, "pets": false, "music": "any", "chat_level": "chatty"}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Rides table
CREATE TABLE IF NOT EXISTS rides (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id uuid REFERENCES users(id),
  origin jsonb NOT NULL,
  destination jsonb NOT NULL,
  departure_time timestamp with time zone NOT NULL,
  seats integer NOT NULL,
  available_seats integer NOT NULL,
  price decimal(10,2) NOT NULL,
  status text DEFAULT 'scheduled',
  preferences jsonb DEFAULT '{"smoking": false, "pets": false, "music": false}'::jsonb,
  vehicle jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Ride requests table
CREATE TABLE IF NOT EXISTS ride_requests (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id uuid REFERENCES rides(id),
  user_id uuid REFERENCES users(id),
  status text DEFAULT 'pending',
  passengers integer NOT NULL,
  message text,
  created_at timestamp with time zone DEFAULT now()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id uuid REFERENCES rides(id),
  reviewer_id uuid REFERENCES users(id),
  reviewed_id uuid REFERENCES users(id),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read all profiles"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Anyone can read rides"
  ON rides FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Drivers can manage their rides"
  ON rides FOR ALL
  TO authenticated
  USING (auth.uid() = driver_id);

-- Insert sample data
INSERT INTO users (name, email, phone, rating, rides_offered, rides_taken) VALUES
  ('Arjun Sharma', 'arjun.sharma@example.com', '+91-9876543210', 4.8, 15, 5),
  ('Priya Patel', 'priya.patel@example.com', '+91-9876543211', 4.9, 8, 12),
  ('Rahul Kumar', 'rahul.kumar@example.com', '+91-9876543212', 4.7, 20, 3),
  ('Neha Singh', 'neha.singh@example.com', '+91-9876543213', 4.6, 5, 8),
  ('Amit Verma', 'amit.verma@example.com', '+91-9876543214', 4.9, 12, 6);

INSERT INTO rides (driver_id, origin, destination, departure_time, seats, available_seats, price, vehicle) 
SELECT 
  u.id,
  '{"name": "Mumbai", "lat": 19.0760, "lng": 72.8777}'::jsonb,
  '{"name": "Pune", "lat": 18.5204, "lng": 73.8567}'::jsonb,
  NOW() + interval '1 day',
  4,
  4,
  800,
  '{"make": "Maruti Suzuki", "model": "Swift", "color": "White", "year": 2022}'::jsonb
FROM users u
WHERE u.email = 'arjun.sharma@example.com'
UNION ALL
SELECT 
  u.id,
  '{"name": "Delhi", "lat": 28.7041, "lng": 77.1025}'::jsonb,
  '{"name": "Chandigarh", "lat": 30.7333, "lng": 76.7794}'::jsonb,
  NOW() + interval '2 days',
  3,
  3,
  1200,
  '{"make": "Honda", "model": "City", "color": "Silver", "year": 2021}'::jsonb
FROM users u
WHERE u.email = 'priya.patel@example.com';