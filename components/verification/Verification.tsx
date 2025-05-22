import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  TouchableOpacity,
  Platform,
  ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Upload } from 'lucide-react-native';
import { Button } from '../ui/Button';
import { colors } from '../../constants/theme';
import { getCurrentUser, db, storage } from '../../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface VerificationProps {
  type: 'phone' | 'license';
  onComplete: () => void;
}

export const Verification: React.FC<VerificationProps> = ({ type, onComplete }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhoneVerification = async () => {
    try {
      setError(null);
      setLoading(true);

      // Validate phone number (Indian format)
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(phoneNumber)) {
        throw new Error('Please enter a valid 10-digit Indian mobile number');
      }

      const user = getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      // Update user profile with phone number
      await updateDoc(doc(db, 'users', user.uid), {
        phoneNumber: `+91${phoneNumber}`,
        'verificationStatus.phone': true
      });

      onComplete();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      setError(null);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0].uri);
      }
    } catch (error: any) {
      setError('Failed to pick image. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      setError(null);
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        setError('Camera permission is required to take a photo');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0].uri);
      }
    } catch (error: any) {
      setError('Failed to take photo. Please try again.');
    }
  };

  const handleLicenseVerification = async () => {
    try {
      setError(null);
      setLoading(true);

      if (!image) {
        throw new Error('Please select or take a photo of your license');
      }

      const user = getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      // Upload image to Firebase Storage
      const response = await fetch(image);
      const blob = await response.blob();
      const storageRef = ref(storage, `licenses/${user.uid}/license.jpg`);
      await uploadBytes(storageRef, blob);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);

      // Update user profile
      await updateDoc(doc(db, 'users', user.uid), {
        'verificationStatus.license': true,
        licenseUrl: downloadURL,
        licenseVerifiedAt: new Date().toISOString()
      });

      onComplete();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {type === 'phone' ? (
        <>
          <Text style={styles.label}>Enter your phone number</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.prefix}>+91</Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="10-digit mobile number"
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
          <Button
            title={loading ? "Verifying..." : "Verify Phone"}
            onPress={handlePhoneVerification}
            loading={loading}
            style={styles.button}
            fullWidth
          />
        </>
      ) : (
        <>
          <Text style={styles.label}>Upload your driver's license</Text>
          
          {image ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: image }} style={styles.image} />
              <TouchableOpacity 
                style={styles.retakeButton}
                onPress={() => setImage(null)}
              >
                <Text style={styles.retakeText}>Choose Different Image</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadContainer}>
              <TouchableOpacity 
                style={styles.uploadOption}
                onPress={takePhoto}
              >
                <Camera size={32} color={colors.primary} />
                <Text style={styles.uploadOptionText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.uploadOption}
                onPress={pickImage}
              >
                <Upload size={32} color={colors.primary} />
                <Text style={styles.uploadOptionText}>Upload Photo</Text>
              </TouchableOpacity>
            </View>
          )}

          {image && (
            <Button
              title={loading ? "Uploading..." : "Upload License"}
              onPress={handleLicenseVerification}
              loading={loading}
              style={styles.button}
              fullWidth
            />
          )}
        </>
      )}
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
    marginTop: 16,
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
  imageContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  retakeButton: {
    padding: 8,
  },
  retakeText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  uploadContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    marginBottom: 24,
  },
  uploadOption: {
    alignItems: 'center',
    backgroundColor: colors.primary100,
    padding: 24,
    borderRadius: 12,
    width: '45%',
  },
  uploadOptionText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
});