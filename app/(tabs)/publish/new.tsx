import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Users, Car as CarIcon } from 'lucide-react-native';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { colors } from '../../../constants/theme';
import { useLocationSearch } from '../../../hooks/useLocationSearch';
import { publishRide } from '../../../services/firebase';

export default function PublishScreen() {
  const router = useRouter();
  const { 
    query: originQuery, 
    setQuery: setOriginQuery,
    results: originResults 
  } = useLocationSearch();

  const { 
    query: destinationQuery, 
    setQuery: setDestinationQuery,
    results: destinationResults 
  } = useLocationSearch();

  const [showOriginResults, setShowOriginResults] = useState(false);
  const [showDestinationResults, setShowDestinationResults] = useState(false);
  const [selectedOrigin, setSelectedOrigin] = useState<any>(null);
  const [selectedDestination, setSelectedDestination] = useState<any>(null);
  const [originError, setOriginError] = useState(false);
  const [destinationError, setDestinationError] = useState(false);
  
  const nextHour = new Date();
  nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
  
  const [dateInput, setDateInput] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const [dateError, setDateError] = useState<string | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);
  
  const [passengers, setPassengers] = useState(1);
  const [price, setPrice] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [vehicle, setVehicle] = useState({
    make: '',
    model: '',
    color: '',
    year: new Date().getFullYear().toString()
  });
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateLocations = () => {
    let isValid = true;
    
    if (!selectedOrigin) {
      setOriginError(true);
      isValid = false;
    } else {
      setOriginError(false);
    }

    if (!selectedDestination) {
      setDestinationError(true);
      isValid = false;
    } else {
      setDestinationError(false);
    }

    return isValid;
  };

  const validateDate = (value: string) => {
    const regex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
    return regex.test(value);
  };

  const validateTime = (value: string) => {
    const regex = /^(0[1-9]|1[0-2]):[0-5][0-9]$/;
    return regex.test(value);
  };

  const handlePublish = async () => {
    try {
      setError(null);
      
      if (!validateDate(dateInput)) {
        throw new Error('Please enter a valid date (MM/DD/YYYY)');
      }

      if (!validateTime(timeInput)) {
        throw new Error('Please enter a valid time (HH:MM)');
      }

      const [month, day, year] = dateInput.split('/').map(Number);
      const [hours, minutes] = timeInput.split(':').map(Number);
      
      const departureTime = new Date(year, month - 1, day, hours, minutes);

      if (departureTime < new Date()) {
        throw new Error('Please select a future date and time');
      }

      if (!validateLocations()) {
        throw new Error('Please select both origin and destination locations from the search results');
      }
      
      if (!price || isNaN(Number(price))) {
        throw new Error('Please enter a valid price');
      }

      if (!licensePlate) {
        throw new Error('Please enter your vehicle license plate');
      }

      if (!vehicle.make || !vehicle.model || !vehicle.color) {
        throw new Error('Please enter all vehicle details');
      }

      setPublishing(true);

      const rideData = {
        origin: selectedOrigin,
        destination: selectedDestination,
        departureTime: departureTime.toISOString(),
        seats: passengers,
        availableSeats: passengers,
        price: Number(price),
        vehicle: {
          ...vehicle,
          licensePlate,
          year: Number(vehicle.year)
        },
        preferences: {
          smoking: false,
          pets: false,
          music: false
        },
        instantBookingEnabled: true
      };

      await publishRide(rideData);

      if (Platform.OS === 'web') {
        alert('Ride published successfully!');
      } else {
        Alert.alert('Success', 'Ride published successfully!');
      }

      router.replace('/(tabs)/rides');
    } catch (error) {
      console.error('Error publishing ride:', error);
      setError(error instanceof Error ? error.message : 'Failed to publish ride');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.headerTitle}>Publish a Ride</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Route Information</Text>
          
          <View style={styles.locationContainer}>
            <Text style={styles.label}>Departure</Text>
            <Input
              placeholder="Enter starting location"
              value={selectedOrigin ? selectedOrigin.name : originQuery}
              onChangeText={(text) => {
                setOriginQuery(text);
                setSelectedOrigin(null);
                setShowOriginResults(true);
                setShowDestinationResults(false);
                setOriginError(false);
              }}
              onFocus={() => {
                setShowOriginResults(true);
                setShowDestinationResults(false);
              }}
              leftIcon={<MapPin size={20} color={colors.gray500} />}
              containerStyle={[
                styles.inputContainer,
                originError && styles.inputError
              ]}
              error={originError ? "Please select a departure location" : undefined}
            />
            
            {showOriginResults && originResults.length > 0 && (
              <View style={styles.resultsContainer}>
                {originResults.map((result) => (
                  <TouchableOpacity
                    key={`${result.name}-${result.lat}`}
                    style={styles.resultItem}
                    onPress={() => {
                      setSelectedOrigin(result);
                      setShowOriginResults(false);
                      setOriginError(false);
                    }}
                  >
                    <MapPin size={16} color={colors.gray500} style={styles.resultIcon} />
                    <Text style={styles.resultText}>{result.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.locationContainer}>
            <Text style={styles.label}>Destination</Text>
            <Input
              placeholder="Enter destination"
              value={selectedDestination ? selectedDestination.name : destinationQuery}
              onChangeText={(text) => {
                setDestinationQuery(text);
                setSelectedDestination(null);
                setShowDestinationResults(true);
                setShowOriginResults(false);
                setDestinationError(false);
              }}
              onFocus={() => {
                setShowDestinationResults(true);
                setShowOriginResults(false);
              }}
              leftIcon={<MapPin size={20} color={colors.gray500} />}
              containerStyle={[
                styles.inputContainer,
                destinationError && styles.inputError
              ]}
              error={destinationError ? "Please select a destination location" : undefined}
            />
            
            {showDestinationResults && destinationResults.length > 0 && (
              <View style={styles.resultsContainer}>
                {destinationResults.map((result) => (
                  <TouchableOpacity
                    key={`${result.name}-${result.lat}`}
                    style={styles.resultItem}
                    onPress={() => {
                      setSelectedDestination(result);
                      setShowDestinationResults(false);
                      setDestinationError(false);
                    }}
                  >
                    <MapPin size={16} color={colors.gray500} style={styles.resultIcon} />
                    <Text style={styles.resultText}>{result.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.row}>
            <View style={styles.halfColumn}>
              <Text style={styles.label}>Date (MM/DD/YYYY)</Text>
              <TextInput
                style={styles.input}
                value={dateInput}
                onChangeText={(text) => {
                  const cleaned = text.replace(/\D/g, '');
                  let formatted = cleaned;
                  if (cleaned.length > 4) {
                    formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4) + '/' + cleaned.slice(4, 8);
                  } else if (cleaned.length > 2) {
                    formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
                  }
                  setDateInput(formatted);
                }}
                placeholder="MM/DD/YYYY"
                maxLength={10}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.halfColumn}>
              <Text style={styles.label}>Time (HH:MM)</Text>
              <TextInput
                style={styles.input}
                value={timeInput}
                onChangeText={(text) => {
                  const cleaned = text.replace(/\D/g, '');
                  let formatted = cleaned;
                  if (cleaned.length > 2) {
                    formatted = cleaned.slice(0, 2) + ':' + cleaned.slice(2, 4);
                  }
                  setTimeInput(formatted);
                }}
                placeholder="HH:MM"
                maxLength={5}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Vehicle Details</Text>

          <Input
            label="Vehicle Make"
            placeholder="e.g., Toyota"
            value={vehicle.make}
            onChangeText={(text) => setVehicle(v => ({ ...v, make: text }))}
            leftIcon={<CarIcon size={20} color={colors.gray500} />}
          />

          <Input
            label="Vehicle Model"
            placeholder="e.g., Camry"
            value={vehicle.model}
            onChangeText={(text) => setVehicle(v => ({ ...v, model: text }))}
          />

          <Input
            label="Vehicle Color"
            placeholder="e.g., Silver"
            value={vehicle.color}
            onChangeText={(text) => setVehicle(v => ({ ...v, color: text }))}
          />

          <Input
            label="License Plate"
            placeholder="Enter vehicle license plate"
            value={licensePlate}
            onChangeText={setLicensePlate}
            autoCapitalize="characters"
          />

          <Text style={styles.sectionTitle}>Ride Details</Text>

          <Text style={styles.label}>Available Seats</Text>
          <View style={styles.seatsContainer}>
            <TouchableOpacity
              style={[styles.seatButton, passengers >= 1 && styles.seatButtonSelected]}
              onPress={() => setPassengers(1)}
            >
              <Text style={[styles.seatButtonText, passengers >= 1 && styles.seatButtonTextSelected]}>1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.seatButton, passengers >= 2 && styles.seatButtonSelected]}
              onPress={() => setPassengers(2)}
            >
              <Text style={[styles.seatButtonText, passengers >= 2 && styles.seatButtonTextSelected]}>2</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.seatButton, passengers >= 3 && styles.seatButtonSelected]}
              onPress={() => setPassengers(3)}
            >
              <Text style={[styles.seatButtonText, passengers >= 3 && styles.seatButtonTextSelected]}>3</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.seatButton, passengers >= 4 && styles.seatButtonSelected]}
              onPress={() => setPassengers(4)}
            >
              <Text style={[styles.seatButtonText, passengers >= 4 && styles.seatButtonTextSelected]}>4</Text>
            </TouchableOpacity>
          </View>

          <Input
            label="Price per Seat (₹)"
            placeholder="Enter price"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />

          <Button
            title={publishing ? "Publishing..." : "Publish Ride"}
            onPress={handlePublish}
            loading={publishing}
            style={styles.publishButton}
            fullWidth
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray100,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  formContainer: {
    padding: 16,
  },
  errorContainer: {
    backgroundColor: colors.error100,
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray800,
    marginTop: 24,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray700,
    marginBottom: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 1,
  },
  locationContainer: {
    position: 'relative',
    zIndex: 1000,
    marginBottom: 16,
  },
  resultsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray300,
    marginTop: 4,
    maxHeight: 200,
    zIndex: 1001,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      }
    }),
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  resultIcon: {
    marginRight: 8,
  },
  resultText: {
    fontSize: 14,
    color: colors.gray800,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  halfColumn: {
    width: '48%',
  },
  seatsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  seatButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.gray400,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  seatButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  seatButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray700,
  },
  seatButtonTextSelected: {
    color: colors.white,
  },
  publishButton: {
    marginTop: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.gray800,
  },
});