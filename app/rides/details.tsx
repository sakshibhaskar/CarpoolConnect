import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
  Share,
  Modal
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Clock, Users, Package, Car, MessageSquare, Star, Shield, Calendar, MapPin, TriangleAlert as AlertTriangle, Share2, Zap, CookingPot as Smoking, Dog, Check } from 'lucide-react-native';
import { colors } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { getRide, getUserProfile, createBookingRequest, createConversation } from '../../services/firebase';
import { formatCurrency, formatTime } from '../../utils/formatters';
import { Ride, User } from '../../types/types';

export default function RideDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [ride, setRide] = useState<Ride | null>(null);
  const [driver, setDriver] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    const fetchRideDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const rideData = await getRide(id as string);
        
        if (rideData) {
          const departureTime = (rideData.departureTime && typeof rideData.departureTime.toDate === 'function')
            ? rideData.departureTime.toDate()
            : new Date(rideData.departureTime);
            
          setRide({
            ...rideData,
            departureTime: departureTime.toISOString()
          });
        }
        
        if (rideData?.driverId) {
          const driverData = await getUserProfile(rideData.driverId);
          setDriver(driverData);
        }
      } catch (error) {
        console.error('Error fetching ride details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRideDetails();
  }, [id]);

  const handleChat = async () => {
    try {
      if (!ride || !driver) return;
      
      // Create or get existing conversation
      const conversationId = await createConversation(ride.id, ride.driverId);
      
      // Navigate to chat screen
      router.push(`/chat?conversationId=${conversationId}&rideId=${ride.id}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      Alert.alert('Error', 'Failed to start conversation. Please try again.');
    }
  };

  const handleShare = async () => {
    try {
      if (!ride) return;
      
      const message = `Check out this ride from ${ride.origin.name} to ${ride.destination.name}!`;
      
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({
            title: 'Share Ride',
            text: message,
            url: window.location.href,
          });
        } else {
          await navigator.clipboard.writeText(message);
          alert('Ride details copied to clipboard!');
        }
      } else {
        await Share.share({
          message,
        });
      }
    } catch (error) {
      console.error('Error sharing ride:', error);
      if (error instanceof Error) {
        Alert.alert('Error', error.message);
      }
    }
  };

  const handleReport = () => {
    Alert.alert(
      'Report Ride',
      'Are you sure you want to report this ride?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Report',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Thank you', 'Your report has been submitted.');
          }
        }
      ]
    );
  };

  const handleBooking = async () => {
    try {
      if (!ride || !driver) return;
      
      setBooking(true);
      await createBookingRequest(ride.id);
      setShowConfirmation(true);
      
      setTimeout(() => {
        setShowConfirmation(false);
        router.push('/(tabs)/rides');
      }, 2000);
    } catch (error) {
      console.error('Error booking ride:', error);
      Alert.alert('Error', 'Failed to book ride. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading ride details...</Text>
      </View>
    );
  }

  if (!ride || !driver) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Ride not found</Text>
        <Button 
          title="Go Back" 
          onPress={() => router.back()} 
          style={styles.errorButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft color={colors.gray800} size={24} />
          </TouchableOpacity>
          
          <View style={styles.dateHeader}>
            <Calendar size={20} color={colors.gray600} />
            <Text style={styles.dateText}>
              {new Date(ride.departureTime).toLocaleDateString('en-US', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
              })}
            </Text>
          </View>
        </View>

        <View style={styles.routeCard}>
          <View style={styles.timeSlot}>
            <Clock size={20} color={colors.gray600} />
            <View style={styles.timeDetails}>
              <Text style={styles.time}>{formatTime(ride.departureTime)}</Text>
              <Text style={styles.duration}>{ride.duration}</Text>
            </View>
          </View>

          <View style={styles.locationContainer}>
            <View style={styles.locationPoint}>
              <MapPin size={20} color={colors.primary} />
              <View style={styles.locationDetails}>
                <Text style={styles.locationName}>{ride.origin.name}</Text>
                <Text style={styles.locationAddress}>{ride.origin.address}</Text>
              </View>
            </View>

            <View style={styles.routeLine} />

            <View style={styles.locationPoint}>
              <MapPin size={20} color={colors.secondary} />
              <View style={styles.locationDetails}>
                <Text style={styles.locationName}>{ride.destination.name}</Text>
                <Text style={styles.locationAddress}>{ride.destination.address}</Text>
              </View>
            </View>
          </View>

          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Price per passenger</Text>
            <Text style={styles.price}>{formatCurrency(ride.price)}</Text>
          </View>
        </View>

        <View style={styles.driverCard}>
          <View style={styles.driverHeader}>
            <View style={styles.driverInfo}>
              <View style={styles.driverAvatar}>
                <Text style={styles.avatarText}>{driver.name[0]}</Text>
              </View>
              <View style={styles.driverDetails}>
                <Text style={styles.driverName}>{driver.name}</Text>
                <View style={styles.ratingContainer}>
                  <Star size={16} color={colors.warning} fill={colors.warning} />
                  <Text style={styles.rating}>{driver.rating?.toFixed(1)} • {driver.ridesOffered} rides</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.verificationContainer}>
            <Shield size={20} color={colors.success} />
            <Text style={styles.verificationText}>Verified Profile</Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Car size={20} color={colors.gray600} />
              <Text style={styles.statText}>
                {ride.vehicle?.make} {ride.vehicle?.model} • {ride.vehicle?.color}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.preferencesCard}>
          <Text style={styles.sectionTitle}>Ride Preferences</Text>

          <View style={styles.preferencesList}>
            {ride.instantBookingEnabled && (
              <View style={styles.preferenceItem}>
                <Zap size={20} color={colors.success} />
                <Text style={styles.preferenceText}>Your booking will be confirmed instantly</Text>
              </View>
            )}

            <View style={styles.preferenceItem}>
              <Smoking size={20} color={colors.gray600} />
              <Text style={styles.preferenceText}>
                {ride.preferences?.smoking ? 'Smoking allowed' : 'No smoking'}
              </Text>
            </View>

            <View style={styles.preferenceItem}>
              <Dog size={20} color={colors.gray600} />
              <Text style={styles.preferenceText}>
                {ride.preferences?.pets ? 'Pets allowed' : 'No pets allowed'}
              </Text>
            </View>

            <View style={styles.preferenceItem}>
              <Users size={20} color={colors.gray600} />
              <Text style={styles.preferenceText}>
                {ride.availableSeats} seats available
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsCard}>
          <TouchableOpacity style={styles.actionButton} onPress={handleChat}>
            <MessageSquare size={20} color={colors.primary} />
            <Text style={styles.actionText}>Contact {driver.name}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Share2 size={20} color={colors.gray600} />
            <Text style={styles.actionText}>Share ride</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleReport}>
            <AlertTriangle size={20} color={colors.error} />
            <Text style={[styles.actionText, { color: colors.error }]}>Report ride</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <Text style={styles.footerPrice}>{formatCurrency(ride.price)}</Text>
          <Text style={styles.footerPriceLabel}>per passenger</Text>
        </View>
        <Button
          title={booking ? "Sending Request..." : "Book Now"}
          leftIcon={<Zap size={18} color={colors.white} />}
          onPress={handleBooking}
          loading={booking}
          style={styles.bookButton}
        />
      </View>

      <Modal
        visible={showConfirmation}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.confirmationModal}>
          <View style={styles.confirmationContent}>
            <View style={styles.confirmationIcon}>
              <Check size={40} color={colors.success} />
            </View>
            <Text style={styles.confirmationTitle}>Booking Successful!</Text>
            <Text style={styles.confirmationText}>
              Your ride request has been sent to the driver.
            </Text>
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
  scrollView: {
    flex: 1,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: colors.gray800,
    marginBottom: 16,
  },
  errorButton: {
    minWidth: 120,
  },
  header: {
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray800,
    marginLeft: 8,
  },
  routeCard: {
    backgroundColor: colors.white,
    marginTop: 1,
    padding: 16,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeDetails: {
    marginLeft: 12,
  },
  time: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray900,
  },
  duration: {
    fontSize: 14,
    color: colors.gray600,
    marginTop: 2,
  },
  locationContainer: {
    marginBottom: 16,
  },
  locationPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  locationDetails: {
    marginLeft: 12,
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.gray800,
  },
  locationAddress: {
    fontSize: 14,
    color: colors.gray600,
    marginTop: 2,
  },
  routeLine: {
    width: 2,
    height: 24,
    backgroundColor: colors.gray300,
    marginLeft: 10,
    marginVertical: 4,
  },
  priceContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    paddingTop: 16,
  },
  priceLabel: {
    fontSize: 14,
    color: colors.gray600,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray900,
  },
  driverCard: {
    backgroundColor: colors.white,
    marginTop: 8,
    padding: 16,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.white,
  },
  driverDetails: {
    marginLeft: 12,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray900,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rating: {
    fontSize: 14,
    color: colors.gray600,
    marginLeft: 4,
  },
  verificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  verificationText: {
    fontSize: 16,
    color: colors.gray800,
    marginLeft: 8,
  },
  statsContainer: {
    marginTop: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statText: {
    fontSize: 16,
    color: colors.gray800,
    marginLeft: 8,
  },
  preferencesCard: {
    backgroundColor: colors.white,
    marginTop: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray800,
    marginBottom: 16,
  },
  preferencesList: {
    gap: 16,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preferenceText: {
    fontSize: 16,
    color: colors.gray800,
    marginLeft: 12,
  },
  actionsCard: {
    backgroundColor: colors.white,
    marginTop: 8,
    padding: 16,
    marginBottom: 100,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionText: {
    fontSize: 16,
    color: colors.gray800,
    marginLeft: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  footerContent: {
    flex: 1,
  },
  footerPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray900,
  },
  footerPriceLabel: {
    fontSize: 14,
    color: colors.gray600,
  },
  bookButton: {
    minWidth: 120,
  },
  confirmationModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  confirmationContent: {
    backgroundColor: colors.white,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    margin: 32,
  },
  confirmationIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray900,
    marginBottom: 8,
  },
  confirmationText: {
    fontSize: 16,
    color: colors.gray600,
    textAlign: 'center',
  },
});