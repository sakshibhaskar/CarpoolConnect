import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity
} from 'react-native';
import { MapPin, Clock, Star, ChevronRight, Circle as XCircle } from 'lucide-react-native';
import { colors, getShadow } from '../../constants/theme';
import { Ride, User } from '../../types/types';
import { formatCurrency, formatTime, formatDate } from '../../utils/formatters';

interface RideCardProps {
  ride: Ride;
  driver?: User;
  onPress: () => void;
  compact?: boolean;
  requestStatus?: 'pending' | 'accepted' | 'rejected';
}

export const RideCard: React.FC<RideCardProps> = ({ 
  ride, 
  driver, 
  onPress,
  compact = false,
  requestStatus
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.card, 
        compact && styles.compactCard,
        requestStatus === 'rejected' && styles.rejectedCard
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.timeContainer}>
        <Text style={styles.time}>{formatTime(ride.departureTime)}</Text>
        <Text style={styles.date}>{!compact && formatDate(ride.departureTime)}</Text>
        {requestStatus === 'rejected' && (
          <View style={styles.statusBadge}>
            <XCircle size={14} color={colors.error} />
            <Text style={styles.statusText}>Rejected</Text>
          </View>
        )}
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.routeLine}>
          <View style={styles.routeDot} />
          <View style={styles.routeLineInner} />
          <View style={[styles.routeDot, styles.destinationDot]} />
        </View>
        <View style={styles.locationContainer}>
          <Text style={styles.locationText} numberOfLines={1}>{ride.origin.name}</Text>
          <Text style={styles.locationText} numberOfLines={1}>{ride.destination.name}</Text>
        </View>
      </View>

      <View style={styles.priceContainer}>
        <Text style={[
          styles.price,
          requestStatus === 'rejected' && styles.rejectedPrice
        ]}>{formatCurrency(ride.price)}</Text>
      </View>

      {!compact && driver && (
        <>
          <View style={styles.divider} />
          <View style={styles.driverContainer}>
            <View style={styles.driverInfo}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {driver.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.driverDetails}>
                <Text style={styles.driverName}>{driver.name}</Text>
                <View style={styles.ratingContainer}>
                  <Star size={14} color={colors.warning} fill={colors.warning} />
                  <Text style={styles.ratingText}>
                    {driver.rating?.toFixed(1)} • {ride.driver ? `${ride.driver.ridesOffered} rides` : ''}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.vehicleContainer}>
              {ride.vehicle && (
                <Text style={styles.vehicleText}>
                  {ride.vehicle.make} {ride.vehicle.model} • {ride.vehicle.color}
                </Text>
              )}
            </View>
          </View>
        </>
      )}

      {compact && (
        <ChevronRight size={18} color={colors.gray500} style={styles.chevron} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...getShadow(3),
  },
  rejectedCard: {
    backgroundColor: colors.gray100,
    opacity: 0.8,
  },
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  timeContainer: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  time: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray900,
  },
  date: {
    fontSize: 14,
    color: colors.gray600,
    marginRight: 'auto',
    marginLeft: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: colors.error,
    marginLeft: 4,
    fontWeight: '500',
  },
  routeContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  routeLine: {
    width: 12,
    alignItems: 'center',
    marginRight: 12,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  destinationDot: {
    backgroundColor: colors.secondary,
  },
  routeLineInner: {
    width: 2,
    height: 24,
    backgroundColor: colors.gray300,
    marginVertical: 4,
  },
  locationContainer: {
    flex: 1,
    justifyContent: 'space-between',
    height: 44,
  },
  locationText: {
    fontSize: 14,
    color: colors.gray800,
  },
  priceContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  price: {
    fontSize: 16,
    fontWeight: '600', 
    color: colors.primary,
  },
  rejectedPrice: {
    color: colors.gray500,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginVertical: 12,
  },
  driverContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  driverDetails: {
    justifyContent: 'center',
  },
  driverName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray900,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingText: {
    fontSize: 12,
    color: colors.gray600,
    marginLeft: 4,
  },
  vehicleContainer: {
    alignItems: 'flex-end',
  },
  vehicleText: {
    fontSize: 12,
    color: colors.gray600,
  },
  chevron: {
    position: 'absolute',
    right: 16,
  },
});