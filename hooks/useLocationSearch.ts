import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

interface LocationResult {
  name: string;
  lat: number;
  lng: number;
}

// Mock API for location suggestions (in a real app, use Google Places API or similar)
const searchLocations = async (query: string): Promise<LocationResult[]> => {
  // Mock data for demonstration
  const mockLocations = {
    'mum': [
      { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
      { name: 'Mumbai Airport', lat: 19.0896, lng: 72.8656 },
      { name: 'Mumbai Central', lat: 18.9691, lng: 72.8193 }
    ],
    'del': [
      { name: 'Delhi', lat: 28.7041, lng: 77.1025 },
      { name: 'Delhi Airport', lat: 28.5562, lng: 77.1000 },
      { name: 'Delhi Cantonment', lat: 28.5398, lng: 77.1511 }
    ],
    'pun': [
      { name: 'Pune', lat: 18.5204, lng: 73.8567 },
      { name: 'Pune Station', lat: 18.5294, lng: 73.8744 },
      { name: 'Punchkula', lat: 30.6942, lng: 76.8606 }
    ],
    'ban': [
      { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
      { name: 'Bangalore Airport', lat: 13.1986, lng: 77.7066 },
      { name: 'Banashankari', lat: 12.9252, lng: 77.5460 }
    ],
    'cha': [
      { name: 'Chandigarh', lat: 30.7333, lng: 76.7794 },
      { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
      { name: 'Chadni Chowk, Delhi', lat: 28.6506, lng: 77.2295 }
    ]
  };

  const queryLower = query.toLowerCase();
  const prefix = queryLower.substring(0, 3);
  
  if (prefix in mockLocations && query.length >= 2) {
    return mockLocations[prefix as keyof typeof mockLocations].filter(
      loc => loc.name.toLowerCase().includes(queryLower)
    );
  }
  
  return [];
};

export const useLocationSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationResult | null>(null);

  useEffect(() => {
    if (query.length >= 2) {
      setLoading(true);
      const delayDebounce = setTimeout(async () => {
        const searchResults = await searchLocations(query);
        setResults(searchResults);
        setLoading(false);
      }, 300);

      return () => clearTimeout(delayDebounce);
    } else {
      setResults([]);
    }
  }, [query]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        throw new Error('Permission to access location was denied');
      }
      
      setLoading(true);
      const location = await Location.getCurrentPositionAsync({});
      
      // Reverse geocoding would go here in a real app
      // For now, just set a placeholder name
      setCurrentLocation({
        name: 'Current Location',
        lat: location.coords.latitude,
        lng: location.coords.longitude
      });
      
      setLoading(false);
      return {
        name: 'Current Location',
        lat: location.coords.latitude,
        lng: location.coords.longitude
      };
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  return {
    query,
    setQuery,
    results,
    loading,
    currentLocation,
    getCurrentLocation
  };
};