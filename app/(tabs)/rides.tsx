import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Car, User, History, Filter } from 'lucide-react-native';
import { RideCard } from '../../components/cards/RideCard';
import { colors } from '../../constants/theme';
import { collection, query, where, orderBy, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { getCurrentUser } from '../../services/firebase';
import { db } from '../../config/firebase';
import { Ride } from '../../types/types';

type TabType = 'offered' | 'requested' | 'past';

export default function RidesScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('offered');
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user?.uid) {
      setLoading(false);
      setRides([]);
      return;
    }
    
    setLoading(true);
    let unsubscribe: (() => void) | undefined;
    
    const fetchRides = async () => {
      try {
        if (activeTab === 'requested') {
          const requestsRef = collection(db, 'ride_requests');
          const requestsQuery = query(
            requestsRef,
            where('userId', '==', user.uid),
            where('status', 'in', ['pending', 'accepted'])
          );
          
          const requestsSnapshot = await getDocs(requestsQuery);
          const requestedRideIds = requestsSnapshot.docs
            .map(doc => doc.data().rideId)
            .filter(id => id !== undefined);
          
          if (requestedRideIds.length === 0) {
            setRides([]);
            setLoading(false);
            return;
          }
          
          const rides: Ride[] = [];
          for (const rideId of requestedRideIds) {
            const rideDoc = await getDoc(doc(db, 'rides', rideId));
            if (rideDoc.exists()) {
              rides.push({
                id: rideDoc.id,
                ...rideDoc.data()
              } as Ride);
            }
          }
          setRides(rides);
        } else if (activeTab === 'past') {
          const ridesRef = collection(db, 'rides');
          const pastRidesQuery = query(
            ridesRef,
            where('status', 'in', ['completed', 'rejected']),
            where('driverId', '==', user.uid),
            orderBy('departureTime', 'desc')
          );

          const pastRequestsQuery = query(
            collection(db, 'ride_requests'),
            where('userId', '==', user.uid),
            where('status', 'in', ['accepted', 'rejected'])
          );

          const [pastRidesSnapshot, pastRequestsSnapshot] = await Promise.all([
            getDocs(pastRidesQuery),
            getDocs(pastRequestsQuery)
          ]);

          const pastRides = pastRidesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          const pastRequestedRides = await Promise.all(
            pastRequestsSnapshot.docs.map(async (requestDoc) => {
              const rideDoc = await getDoc(doc(db, 'rides', requestDoc.data().rideId));
              if (rideDoc.exists()) {
                return {
                  id: rideDoc.id,
                  ...rideDoc.data(),
                  requestStatus: requestDoc.data().status
                };
              }
              return null;
            })
          );

          setRides([...pastRides, ...pastRequestedRides.filter(Boolean)]);
        } else {
          const ridesRef = collection(db, 'rides');
          const ridesQuery = query(
            ridesRef,
            where('driverId', '==', user.uid),
            where('status', 'in', ['scheduled', 'in-progress']),
            orderBy('departureTime', 'asc')
          );
          
          unsubscribe = onSnapshot(ridesQuery, (snapshot) => {
            const rideList = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            } as Ride));
            setRides(rideList);
            setLoading(false);
          }, (error) => {
            console.error('Error in snapshot listener:', error);
            setRides([]);
            setLoading(false);
          });
        }
      } catch (error) {
        console.error('Error fetching rides:', error);
        setRides([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRides();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [activeTab]);
  
  const handleRideSelect = (rideId: string) => {
    router.push(`/rides/details?id=${rideId}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Rides</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'offered' && styles.activeTab]}
          onPress={() => setActiveTab('offered')}
        >
          <Car size={18} color={activeTab === 'offered' ? colors.primary : colors.gray600} />
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'offered' && styles.activeTabText
            ]}
          >
            Offered
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requested' && styles.activeTab]}
          onPress={() => setActiveTab('requested')}
        >
          <User size={18} color={activeTab === 'requested' ? colors.primary : colors.gray600} />
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'requested' && styles.activeTabText
            ]}
          >
            Requested
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.activeTab]}
          onPress={() => setActiveTab('past')}
        >
          <History size={18} color={activeTab === 'past' ? colors.primary : colors.gray600} />
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'past' && styles.activeTabText
            ]}
          >
            Past
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading rides...</Text>
        </View>
      ) : rides.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Car size={64} color={colors.gray400} />
          <Text style={styles.emptyTitle}>No rides found</Text>
          <Text style={styles.emptyText}>
            {activeTab === 'offered' 
              ? "You haven't offered any rides yet."
              : activeTab === 'requested'
                ? "You haven't requested any rides yet."
                : "You don't have any past rides."}
          </Text>
          {activeTab === 'offered' && (
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/publish')}
            >
              <Text style={styles.createButtonText}>Offer a Ride</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {rides.map(ride => (
            <RideCard
              key={ride.id}
              ride={ride}
              driver={ride.driver}
              onPress={() => handleRideSelect(ride.id)}
            />
          ))}
        </ScrollView>
      )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray600,
    marginLeft: 4,
  },
  activeTabText: {
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
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
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray800,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray600,
    textAlign: 'center',
    marginBottom: 32,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  createButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});