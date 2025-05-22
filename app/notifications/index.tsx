import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image,
  Alert,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, MessageSquare, Car, Clock, ChevronLeft, Check, X } from 'lucide-react-native';
import { colors } from '../../constants/theme';
import { getCurrentUser, getNotifications, handleRideRequest } from '../../services/firebase';
import { Button } from '../../components/ui/Button';

interface Notification {
  id: string;
  type: 'chat' | 'ride' | 'alert' | 'request';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  rideId?: string;
  requestId?: string;
  data?: any;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const user = getCurrentUser();
        if (!user) return;

        const userNotifications = await getNotifications();
        setNotifications(userNotifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleRequestResponse = async (notification: Notification, accept: boolean) => {
    try {
      if (!notification.requestId || !notification.rideId) return;
      
      setProcessingRequest(notification.id);
      
      try {
        await handleRideRequest(notification.requestId, notification.rideId, accept);
        
        // Remove the notification from the list
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
        
        // Show success message
        const message = accept ? 'Request accepted successfully' : 'Request rejected successfully';
        if (Platform.OS === 'web') {
          alert(message);
        } else {
          Alert.alert('Success', message);
        }
      } catch (error: any) {
        // Handle specific error for non-existent request
        if (error.message === 'Request no longer exists' || error.message === 'Ride no longer exists') {
          // Remove the notification since it's no longer valid
          setNotifications(prev => prev.filter(n => n.id !== notification.id));
          
          const message = 'This request is no longer available. It may have been handled by another user or deleted.';
          if (Platform.OS === 'web') {
            alert(message);
          } else {
            Alert.alert('Request Unavailable', message);
          }
        } else {
          // Handle other errors
          const message = 'Failed to process request. Please try again.';
          if (Platform.OS === 'web') {
            alert(message);
          } else {
            Alert.alert('Error', message);
          }
        }
      }
    } catch (error) {
      console.error('Error handling request:', error);
      Alert.alert('Error', 'Failed to process request. Please try again.');
    } finally {
      setProcessingRequest(null);
    }
  };

  const renderNotificationIcon = (type: string) => {
    switch (type) {
      case 'chat':
        return <MessageSquare size={24} color={colors.primary} />;
      case 'ride':
      case 'request':
        return <Car size={24} color={colors.primary} />;
      case 'alert':
        return <Bell size={24} color={colors.error} />;
      default:
        return <Bell size={24} color={colors.primary} />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderNotification = ({ item: notification }: { item: Notification }) => (
    <View style={[styles.notificationItem, !notification.read && styles.unreadItem]}>
      <View style={styles.iconContainer}>
        {renderNotificationIcon(notification.type)}
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.notificationTitle}>{notification.title}</Text>
        <Text style={styles.notificationMessage}>{notification.message}</Text>
        <View style={styles.timeContainer}>
          <Clock size={14} color={colors.gray500} />
          <Text style={styles.timeText}>{formatTime(notification.timestamp)}</Text>
        </View>
      </View>

      {notification.type === 'request' && (
        <View style={styles.requestActions}>
          <Button
            title="Accept"
            size="small"
            onPress={() => handleRequestResponse(notification, true)}
            loading={processingRequest === notification.id}
            style={styles.acceptButton}
            leftIcon={<Check size={16} color={colors.white} />}
          />
          <Button
            title="Reject"
            size="small"
            variant="danger"
            onPress={() => handleRequestResponse(notification, false)}
            loading={processingRequest === notification.id}
            style={styles.rejectButton}
            leftIcon={<X size={16} color={colors.white} />}
          />
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Image 
            source={{ uri: 'https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2' }}
            style={styles.emptyImage}
          />
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptyText}>
            We'll notify you when there are new messages, ride updates, or alerts.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          contentContainerStyle={styles.listContent}
        />
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
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
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
  listContent: {
    padding: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  unreadItem: {
    backgroundColor: colors.primary100,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray900,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: colors.gray700,
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: colors.gray500,
    marginLeft: 4,
  },
  requestActions: {
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 8,
    marginLeft: 16,
  },
  acceptButton: {
    minWidth: 100,
  },
  rejectButton: {
    minWidth: 100,
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
    borderRadius: 100,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray800,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray600,
    textAlign: 'center',
  },
});