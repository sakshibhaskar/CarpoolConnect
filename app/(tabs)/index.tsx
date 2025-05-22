import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Platform,
  TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Users, Search as SearchIcon } from 'lucide-react-native';
import { Button } from '../../components/ui/Button';
import { colors } from '../../constants/theme';
import { useLocationSearch } from '../../hooks/useLocationSearch';

export default function HomeScreen() {
  const router = useRouter();
  const [passengers, setPassengers] = useState(1);
  const [date, setDate] = useState('');
  
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
  const [selectedOrigin, setSelectedOrigin] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('');
  const [error, setError] = useState<string | null>(null);

  const validateDate = (value: string) => {
    const regex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
    return regex.test(value);
  };

  const handleSearch = async () => {
    try {
      setError(null);

      if (!selectedOrigin || !selectedDestination) {
        setError('Please select both origin and destination locations');
        return;
      }

      if (!validateDate(date)) {
        setError('Please enter a valid date (MM/DD/YYYY)');
        return;
      }

      const [month, day, year] = date.split('/').map(Number);
      const searchDate = new Date(year, month - 1, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day

      if (searchDate < today) {
        setError('Please select today or a future date');
        return;
      }

      router.push({
        pathname: '/rides/listings',
        params: {
          origin: selectedOrigin,
          destination: selectedDestination,
          date: searchDate.toISOString(),
          passengers
        }
      });
    } catch (error) {
      console.error('Error navigating to search results:', error);
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>CarpoolConnect</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.searchContainer}>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.locationContainer}>
            <Text style={styles.label}>From</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter starting location"
              value={selectedOrigin || originQuery}
              onChangeText={(text) => {
                setOriginQuery(text);
                setSelectedOrigin('');
                setShowOriginResults(true);
                setShowDestinationResults(false);
              }}
              onFocus={() => {
                setShowOriginResults(true);
                setShowDestinationResults(false);
              }}
            />
            
            {showOriginResults && originResults.length > 0 && (
              <View style={styles.resultsContainer}>
                {originResults.map((result) => (
                  <TouchableOpacity
                    key={`${result.name}-${result.lat}`}
                    style={styles.resultItem}
                    onPress={() => {
                      setSelectedOrigin(result.name);
                      setOriginQuery(result.name);
                      setShowOriginResults(false);
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
            <Text style={styles.label}>To</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter destination"
              value={selectedDestination || destinationQuery}
              onChangeText={(text) => {
                setDestinationQuery(text);
                setSelectedDestination('');
                setShowDestinationResults(true);
                setShowOriginResults(false);
              }}
              onFocus={() => {
                setShowDestinationResults(true);
                setShowOriginResults(false);
              }}
            />
            
            {showDestinationResults && destinationResults.length > 0 && (
              <View style={styles.resultsContainer}>
                {destinationResults.map((result) => (
                  <TouchableOpacity
                    key={`${result.name}-${result.lat}`}
                    style={styles.resultItem}
                    onPress={() => {
                      setSelectedDestination(result.name);
                      setDestinationQuery(result.name);
                      setShowDestinationResults(false);
                    }}
                  >
                    <MapPin size={16} color={colors.gray500} style={styles.resultIcon} />
                    <Text style={styles.resultText}>{result.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <Text style={styles.label}>Date (MM/DD/YYYY)</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={(text) => {
              const cleaned = text.replace(/\D/g, '');
              let formatted = cleaned;
              if (cleaned.length > 4) {
                formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4) + '/' + cleaned.slice(4, 8);
              } else if (cleaned.length > 2) {
                formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
              }
              setDate(formatted);
            }}
            placeholder="MM/DD/YYYY"
            maxLength={10}
            keyboardType="numeric"
          />

          <View style={styles.passengersContainer}>
            <Text style={styles.label}>Passengers</Text>
            <View style={styles.passengersControls}>
              <TouchableOpacity
                style={[styles.passengersButton, passengers <= 1 && styles.passengersButtonDisabled]}
                disabled={passengers <= 1}
                onPress={() => setPassengers(prev => Math.max(1, prev - 1))}
              >
                <Text style={styles.passengersButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.passengersCount}>{passengers}</Text>
              <TouchableOpacity
                style={[styles.passengersButton, passengers >= 4 && styles.passengersButtonDisabled]}
                disabled={passengers >= 4}
                onPress={() => setPassengers(prev => Math.min(4, prev + 1))}
              >
                <Text style={styles.passengersButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Button
            title="Search"
            leftIcon={<SearchIcon size={18} color={colors.white} />}
            onPress={handleSearch}
            style={styles.searchButton}
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
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 24,
  },
  title: {
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
  searchContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    margin: 16,
    marginTop: -20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      }
    }),
  },
  errorContainer: {
    backgroundColor: colors.error100,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
  },
  locationContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray700,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.gray900,
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
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
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
  passengersContainer: {
    marginBottom: 24,
  },
  passengersControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray100,
    borderRadius: 8,
    padding: 8,
  },
  passengersButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passengersButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  passengersButtonText: {
    fontSize: 20,
    color: colors.white,
    fontWeight: 'bold',
  },
  passengersCount: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray900,
    marginHorizontal: 24,
  },
  searchButton: {
    marginTop: 8,
  },
});