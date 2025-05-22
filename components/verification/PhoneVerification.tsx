import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Platform,
} from 'react-native';
import { Button } from '../ui/Button';
import { colors } from '../../constants/theme';
import { getCurrentUser, getUserProfile, db } from '../../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface PhoneVerificationProps {
  onVerificationComplete: () => void;
}

export const PhoneVerification: React.FC<PhoneVerificationProps> = ({
  onVerificationComplete
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingPhone, setExistingPhone] = useState<string | null>(null);

  useEffect(() => {
    fetchUserPhone();
  }, []);

  const fetchUserPhone = async () => {
    try {
      const user = getCurrentUser();
      if (!user) return;

      const userProfile = await getUserProfile(user.uid);
      if (userProfile?.phoneNumber) {
        setExistingPhone(userProfile.phoneNumber);
        setPhoneNumber(userProfile.phoneNumber.replace('+91', ''));
      }
    } catch (error) {
      console.error('Error fetching user phone:', error);
    }
  };

  const handleVerification = async () => {
    try {
      setError(null);
      setLoading(true);

      if (!phoneNumber && !existingPhone) {
        throw new Error('No phone number available');
      }

      // If there's no new phone number but we have an existing one, just verify it
      const numberToVerify = phoneNumber || existingPhone?.replace('+91', '');

      // Validate phone number (Indian format)
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(numberToVerify!)) {
        throw new Error('Please enter a valid 10-digit Indian mobile number');
      }

      const user = getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      // Update user profile with phone number
      await updateDoc(doc(db, 'users', user.uid), {
        phoneNumber: `+91${numberToVerify}`,
        'verificationStatus.phone': true
      });

      onVerificationComplete();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!existingPhone) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorMessage}>No phone number added to your profile.</Text>
        <Text style={styles.instruction}>Please add a phone number in your profile settings first.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Text style={styles.label}>Your phone number</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.prefix}>+91</Text>
        <TextInput
          style={styles.input}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="10-digit mobile number"
          keyboardType="phone-pad"
          maxLength={10}
          editable={!existingPhone}
        />
      </View>
      <Button
        title={loading ? "Verifying..." : "Verify Phone"}
        onPress={handleVerification}
        loading={loading}
        style={styles.button}
        fullWidth
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    color: colors.gray800,
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  prefix: {
    fontSize: 16,
    color: colors.gray800,
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.gray900,
    backgroundColor: colors.white,
  },
  button: {
    marginTop: 8,
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
  errorMessage: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 8,
  },
  instruction: {
    fontSize: 14,
    color: colors.gray600,
    textAlign: 'center',
  },
});