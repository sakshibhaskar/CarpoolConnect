import React, { useState } from 'react';
import { 
  StyleSheet, 
  TouchableOpacity, 
  View, 
  Text,
  Modal,
  ActivityIndicator,
  Platform
} from 'react-native';
import { TriangleAlert as AlertTriangle } from 'lucide-react-native';
import * as Location from 'expo-location';
import { Button } from './Button';
import { colors } from '../../constants/theme';
import { createEmergencyAlert } from '../../services/firebase';

export const EmergencyButton: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [alerting, setAlerting] = useState(false);
  const [alertSent, setAlertSent] = useState(false);

  const handlePress = () => {
    setModalVisible(true);
  };

  const handleEmergency = async () => {
    try {
      setAlerting(true);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        throw new Error('Permission to access location was denied');
      }
      
      const location = await Location.getCurrentPositionAsync({});
      
      await createEmergencyAlert({
        lat: location.coords.latitude,
        lng: location.coords.longitude
      });
      
      setAlertSent(true);
      setTimeout(() => {
        setModalVisible(false);
        setAlerting(false);
        setAlertSent(false);
      }, 3000);
    } catch (error) {
      console.error('Error sending emergency alert:', error);
      setAlerting(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.emergencyButton}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <AlertTriangle size={24} color={colors.white} />
      </TouchableOpacity>
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {alertSent ? (
              <View style={styles.alertSentContainer}>
                <AlertTriangle size={48} color={colors.success} />
                <Text style={styles.alertSentTitle}>Alert Sent!</Text>
                <Text style={styles.alertSentText}>
                  Emergency contacts have been notified with your current location.
                </Text>
              </View>
            ) : alerting ? (
              <View style={styles.alertingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.alertingText}>Sending emergency alert...</Text>
              </View>
            ) : (
              <>
                <View style={styles.iconContainer}>
                  <AlertTriangle size={48} color={colors.error} />
                </View>
                <Text style={styles.modalTitle}>Emergency Alert</Text>
                <Text style={styles.modalText}>
                  This will send an alert with your current location to your emergency contacts.
                </Text>
                <View style={styles.buttonContainer}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    style={styles.cancelButton}
                    onPress={() => setModalVisible(false)}
                  />
                  <Button
                    title="Send Alert"
                    variant="danger"
                    style={styles.sendButton}
                    onPress={handleEmergency}
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  emergencyButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.3)',
      },
    }),
    zIndex: 1000,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
      },
    }),
  },
  iconContainer: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: colors.gray900,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    color: colors.gray700,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  sendButton: {
    flex: 1,
    marginLeft: 8,
  },
  alertingContainer: {
    alignItems: 'center',
    padding: 16,
  },
  alertingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.gray700,
  },
  alertSentContainer: {
    alignItems: 'center',
    padding: 16,
  },
  alertSentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: colors.success,
  },
  alertSentText: {
    fontSize: 16,
    textAlign: 'center',
    color: colors.gray700,
  },
});