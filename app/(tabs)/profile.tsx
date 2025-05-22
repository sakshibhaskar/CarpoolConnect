import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Platform,
  ActivityIndicator,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { Settings, UserCheck, CreditCard as Edit, Phone, CreditCard, TriangleAlert as AlertTriangle, Star, LogOut } from 'lucide-react-native';
import { colors } from '../../constants/theme';
import { 
  getCurrentUser, 
  getUserProfile, 
  signOut,
  getEmergencyContacts,
  getUserReviews
} from '../../src/services/firebase';
import { User, EmergencyContact } from '../../types/types';
import { ReviewCard } from '../../components/reviews/ReviewCard';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const isMounted = useRef(true);
  
  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  useEffect(() => {
    isMounted.current = true;

    const fetchUserData = async () => {
      try {
        const currentUser = getCurrentUser();
        
        if (!currentUser && isMounted.current) {
          setTimeout(() => {
            if (isMounted.current) {
              router.replace('/(auth)/login');
            }
          }, 0);
          return;
        }
        
        if (currentUser && isMounted.current) {
          const [userProfile, contacts] = await Promise.all([
            getUserProfile(currentUser.uid),
            getEmergencyContacts()
          ]);
          
          if (isMounted.current) {
            setUser(userProfile);
            setEmergencyContacts(contacts);
          }

          // Fetch reviews
          const userReviews = await getUserReviews(currentUser.uid);
          if (isMounted.current) {
            setReviews(userReviews);
            setLoadingReviews(false);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };
    
    fetchUserData();

    return () => {
      isMounted.current = false;
    };
  }, []);
  
  const handleSignOut = async () => {
    try {
      await signOut();
      if (isMounted.current) {
        router.replace('/(auth)/login');
      }
    } catch (error) {
      console.error('Error signing out:', error);
      if (Platform.OS === 'web') {
        alert('Failed to sign out. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to sign out. Please try again.');
      }
    }
  };
  
  const handleManageEmergencyContacts = () => {
    router.push('/emergency-contacts');
  };

  const handleVerifyPhone = () => {
    router.push('/verify/phone');
  };

  const handleVerifyLicense = () => {
    router.push('/verify/license');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const userRating = typeof user?.rating === 'number' ? String(user.rating.toFixed(1)) : '5.0';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={handleSettings}
        >
          <Settings size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.profileAvatarContainer}>
              <Text style={styles.profileAvatarText}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name || 'User'}</Text>
              
              <View style={styles.verificationContainer}>
                <UserCheck size={16} color={colors.success} />
                <Text style={styles.verificationText}>Verified</Text>
              </View>
              
              <View style={styles.ratingContainer}>
                <Star size={16} color={colors.warning} fill={colors.warning} />
                <Text style={styles.ratingText}>
                  {userRating}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.editButton}
              onPress={handleEditProfile}
            >
              <Text style={styles.editButtonText}>Edit profile</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{String(user?.ridesOffered || 0)}</Text>
              <Text style={styles.statLabel}>Rides</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{String(user?.ridesTaken || 0)}</Text>
              <Text style={styles.statLabel}>Bookings</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {String(user?.memberSince 
                  ? new Date(user.memberSince).getFullYear() 
                  : new Date().getFullYear())}
              </Text>
              <Text style={styles.statLabel}>Member since</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Verification</Text>
          
          <View style={styles.verificationItem}>
            <UserCheck size={20} color={colors.success} />
            <Text style={styles.verificationItemText}>Email verified</Text>
            <View style={styles.verificationCheckContainer}>
              <UserCheck size={16} color={colors.white} />
            </View>
          </View>
          
          <View style={styles.verificationItem}>
            <Phone size={20} color={user?.verificationStatus?.phone ? colors.success : colors.gray500} />
            <Text style={styles.verificationItemText}>Phone number</Text>
            {user?.verificationStatus?.phone ? (
              <View style={styles.verificationCheckContainer}>
                <UserCheck size={16} color={colors.white} />
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.verifyButton}
                onPress={handleVerifyPhone}
              >
                <Text style={styles.verifyButtonText}>Verify</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.verificationItem}>
            <CreditCard size={20} color={user?.verificationStatus?.license ? colors.success : colors.gray500} />
            <Text style={styles.verificationItemText}>Driver's license</Text>
            {user?.verificationStatus?.license ? (
              <View style={styles.verificationCheckContainer}>
                <UserCheck size={16} color={colors.white} />
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.verifyButton}
                onPress={handleVerifyLicense}
              >
                <Text style={styles.verifyButtonText}>Verify</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Chat level:</Text>
            <Text style={styles.preferenceValue}>{user?.preferences?.chatLevel || 'Chatty'}</Text>
          </View>
          
          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Music:</Text>
            <Text style={styles.preferenceValue}>{user?.preferences?.music || 'Any genre'}</Text>
          </View>
          
          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Pets:</Text>
            <Text style={styles.preferenceValue}>
              {user?.preferences?.pets ? 'Allowed' : 'Not allowed'}
            </Text>
          </View>
          
          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>Smoking:</Text>
            <Text style={styles.preferenceValue}>
              {user?.preferences?.smoking ? 'Allowed' : 'Not allowed'}
            </Text>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Reviews</Text>
          
          {loadingReviews ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : reviews.length === 0 ? (
            <View style={styles.emptyReviews}>
              <Text style={styles.emptyReviewsText}>No reviews yet</Text>
            </View>
          ) : (
            reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.emergencyContactsButton}
          onPress={handleManageEmergencyContacts}
        >
          <AlertTriangle size={20} color={colors.error} />
          <Text style={styles.emergencyContactsText}>Manage emergency contacts</Text>
          <View style={styles.emergencyBadge}>
            <Text style={styles.emergencyBadgeText}>{String(emergencyContacts.length)}</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <LogOut size={20} color={colors.error} />
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }
    }),
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileAvatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileAvatarText: {
    color: colors.white,
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray900,
    marginBottom: 4,
  },
  verificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  verificationText: {
    fontSize: 14,
    color: colors.success,
    marginLeft: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: colors.gray700,
    marginLeft: 4,
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.gray200,
  },
  editButtonText: {
    fontSize: 14,
    color: colors.gray700,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray900,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: colors.gray600,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: colors.gray200,
  },
  sectionContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.gray900,
    marginBottom: 16,
  },
  verificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  verificationItemText: {
    fontSize: 16,
    color: colors.gray800,
    marginLeft: 12,
    flex: 1,
  },
  verificationCheckContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.primary100,
  },
  verifyButtonText: {
    fontSize: 14,
    color: colors.primary,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  preferenceLabel: {
    fontSize: 16,
    color: colors.gray700,
  },
  preferenceValue: {
    fontSize: 16,
    color: colors.gray900,
    fontWeight: '500',
  },
  emergencyContactsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error100,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  emergencyContactsText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
    marginLeft: 12,
  },
  emergencyBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.white,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginBottom: 32,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
    marginLeft: 8,
  },
  emptyReviews: {
    padding: 24,
    alignItems: 'center',
  },
  emptyReviewsText: {
    fontSize: 16,
    color: colors.gray600,
  },
});