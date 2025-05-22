import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList,
  TouchableOpacity,
  Modal,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Filter, Calendar, Users, X, Check, ArrowUpDown, Clock, MapPin, Shield, Car, CookingPot as Smoking, Dog, Zap } from 'lucide-react-native';
import { RideCard } from '../../components/cards/RideCard';
import { Button } from '../../components/ui/Button';
import { colors } from '../../constants/theme';
import { searchRides, createRideAlert, getCurrentUser, createConversation } from '../../services/firebase';

type SortOption = 'departure_asc' | 'departure_desc' | 'price_asc' | 'price_desc';

interface Filters {
  driverGender?: 'male' | 'female' | null;
  verifiedOnly: boolean;
  instantBooking: boolean;
  smoking: boolean;
  pets: boolean;
  sort: SortOption;
}

export default function RideListingsScreen() {
  const router = useRouter();
  const { origin, destination, date: dateParam, passengers: passengersParam } = useLocalSearchParams();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    verifiedOnly: false,
    instantBooking: false,
    smoking: false,
    pets: false,
    sort: 'departure_asc'
  });
  const [creatingAlert, setCreatingAlert] = useState(false);

  useEffect(() => {
    fetchRides();
  }, [origin, destination, dateParam, filters]);

  const fetchRides = async () => {
    try {
      setLoading(true);
      const searchResults = await searchRides(
        origin as string,
        destination as string,
        new Date(dateParam as string),
        filters
      );

      // Sort rides based on selected option
      const sortedRides = [...searchResults].sort((a, b) => {
        switch (filters.sort) {
          case 'price_asc':
            return a.price - b.price;
          case 'price_desc':
            return b.price - a.price;
          case 'departure_asc':
            return new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime();
          case 'departure_desc':
            return new Date(b.departureTime).getTime() - new Date(a.departureTime).getTime();
          default:
            return 0;
        }
      });

      setRides(sortedRides);
    } catch (error) {
      console.error('Error fetching rides:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlert = async () => {
    try {
      setCreatingAlert(true);
      await createRideAlert(origin as string, destination as string);
      
      if (Platform.OS === 'web') {
        alert('Alert created! We\'ll notify you when rides become available.');
      } else {
        Alert.alert(
          'Alert Created',
          'We\'ll notify you when rides become available.'
        );
      }
      
      router.push('/notifications');
    } catch (error) {
      console.error('Error creating alert:', error);
    } finally {
      setCreatingAlert(false);
    }
  };

  const handleRideSelect = async (ride: any) => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        router.push('/(auth)/login');
        return;
      }

      // Create or get existing conversation
      const conversationId = await createConversation(ride.id, ride.driverId);
      
      // Navigate to chat screen
      router.push(`/chat?conversationId=${conversationId}&rideId=${ride.id}`);
    } catch (error) {
      console.error('Error handling ride selection:', error);
      Alert.alert('Error', 'Failed to start conversation. Please try again.');
    }
  };

  const resetFilters = () => {
    setFilters({
      verifiedOnly: false,
      instantBooking: false,
      smoking: false,
      pets: false,
      sort: 'departure_asc'
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Finding rides...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color={colors.white} size={24} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{origin} → {destination}</Text>
          <Text style={styles.headerSubtitle}>
            {new Date(dateParam as string).toLocaleDateString()} • {passengersParam} passenger{Number(passengersParam) > 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowFilters(true)} style={styles.filterButton}>
          <Filter color={colors.white} size={24} />
        </TouchableOpacity>
      </View>

      {rides.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Image 
            source={{ uri: 'https://images.pexels.com/photos/7706434/pexels-photo-7706434.jpeg?auto=compress&cs=tinysrgb&w=600' }}
            style={styles.emptyImage}
          />
          <Text style={styles.emptyTitle}>No rides available</Text>
          <Text style={styles.emptyText}>
            We couldn't find any rides matching your search. Create an alert to get notified when rides become available.
          </Text>
          <Button
            title={creatingAlert ? "Creating Alert..." : "Create Alert"}
            onPress={handleCreateAlert}
            loading={creatingAlert}
            style={styles.createAlertButton}
          />
        </View>
      ) : (
        <FlatList
          data={rides}
          renderItem={({ item }) => (
            <RideCard
              ride={item}
              onPress={() => handleRideSelect(item)}
            />
          )}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.ridesList}
        />
      )}

      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity 
                onPress={() => setShowFilters(false)}
                style={styles.closeButton}
              >
                <X size={24} color={colors.gray700} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.filterSectionTitle}>Sort by</Text>
              <View style={styles.sortOptions}>
                <TouchableOpacity
                  style={[
                    styles.sortOption,
                    filters.sort === 'departure_asc' && styles.sortOptionSelected
                  ]}
                  onPress={() => setFilters(f => ({ ...f, sort: 'departure_asc' }))}
                >
                  <Clock size={20} color={filters.sort === 'departure_asc' ? colors.primary : colors.gray600} />
                  <Text style={styles.sortOptionText}>Earliest departure</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.sortOption,
                    filters.sort === 'price_asc' && styles.sortOptionSelected
                  ]}
                  onPress={() => setFilters(f => ({ ...f, sort: 'price_asc' }))}
                >
                  <Text style={styles.sortOptionText}>Lowest price</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.filterSectionTitle}>Driver Preference</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filters.driverGender === 'female' && styles.filterOptionSelected
                  ]}
                  onPress={() => setFilters(f => ({ 
                    ...f, 
                    driverGender: f.driverGender === 'female' ? null : 'female' 
                  }))}
                >
                  <Users size={20} color={filters.driverGender === 'female' ? colors.primary : colors.gray600} />
                  <Text style={styles.filterOptionText}>Female driver only</Text>
                  {filters.driverGender === 'female' && (
                    <Check size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.filterSectionTitle}>Preferences</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filters.verifiedOnly && styles.filterOptionSelected
                  ]}
                  onPress={() => setFilters(f => ({ ...f, verifiedOnly: !f.verifiedOnly }))}
                >
                  <Shield size={20} color={filters.verifiedOnly ? colors.primary : colors.gray600} />
                  <Text style={styles.filterOptionText}>Verified drivers only</Text>
                  {filters.verifiedOnly && (
                    <Check size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filters.instantBooking && styles.filterOptionSelected
                  ]}
                  onPress={() => setFilters(f => ({ ...f, instantBooking: !f.instantBooking }))}
                >
                  <Zap size={20} color={filters.instantBooking ? colors.primary : colors.gray600} />
                  <Text style={styles.filterOptionText}>Instant booking</Text>
                  {filters.instantBooking && (
                    <Check size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filters.smoking && styles.filterOptionSelected
                  ]}
                  onPress={() => setFilters(f => ({ ...f, smoking: !f.smoking }))}
                >
                  <Smoking size={20} color={filters.smoking ? colors.primary : colors.gray600} />
                  <Text style={styles.filterOptionText}>Smoking allowed</Text>
                  {filters.smoking && (
                    <Check size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filters.pets && styles.filterOptionSelected
                  ]}
                  onPress={() => setFilters(f => ({ ...f, pets: !f.pets }))}
                >
                  <Dog size={20} color={filters.pets ? colors.primary : colors.gray600} />
                  <Text style={styles.filterOptionText}>Pets allowed</Text>
                  {filters.pets && (
                    <Check size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Reset"
                variant="outline"
                onPress={resetFilters}
                style={styles.resetButton}
              />
              <Button
                title="Apply Filters"
                onPress={() => setShowFilters(false)}
                style={styles.applyButton}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    color: colors.white,
    opacity: 0.8,
    fontSize: 14,
    marginTop: 4,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.gray600,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyImage: {
    width: 200,
    height: 200,
    borderRadius: 16,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray900,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray600,
    textAlign: 'center',
    marginBottom: 24,
  },
  createAlertButton: {
    minWidth: 200,
  },
  ridesList: {
    padding: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.gray900,
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    maxHeight: '70%',
  },
  filterSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray800,
    marginTop: 24,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  sortOptions: {
    paddingHorizontal: 20,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  sortOptionSelected: {
    color: colors.primary,
  },
  sortOptionText: {
    fontSize: 16,
    color: colors.gray800,
    marginLeft: 12,
  },
  filterOptions: {
    paddingHorizontal: 20,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.gray100,
    borderRadius: 12,
    marginBottom: 8,
  },
  filterOptionSelected: {
    backgroundColor: colors.primary100,
  },
  filterOptionText: {
    flex: 1,
    fontSize: 16,
    color: colors.gray800,
    marginLeft: 12,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  resetButton: {
    flex: 1,
    marginRight: 8,
  },
  applyButton: {
    flex: 1,
    marginLeft: 8,
  },
});