import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Camera, Upload, ChevronLeft } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../ui/Button';
import { colors } from '../../constants/theme';
import { getCurrentUser, uploadLicense, getUserProfile } from '../../services/firebase';

interface LicenseVerificationProps {
  onVerificationComplete: () => void;
}

export const LicenseVerification: React.FC<LicenseVerificationProps> = ({
  onVerificationComplete
}) => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingLicense, setExistingLicense] = useState<string | null>(null);

  useEffect(() => {
    fetchExistingLicense();
  }, []);

  const fetchExistingLicense = async () => {
    try {
      const user = getCurrentUser();
      if (!user) return;

      const profile = await getUserProfile(user.uid);
      if (profile?.licenseUrl) {
        setExistingLicense(profile.licenseUrl);
      }
    } catch (error) {
      console.error('Error fetching license:', error);
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

  const handleUpload = async () => {
    try {
      setError(null);
      setLoading(true);

      if (!image) {
        throw new Error('Please select or take a photo of your license');
      }

      await uploadLicense(image);
      onVerificationComplete();
    } catch (error: any) {
      setError(error.message || 'Failed to upload license. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onVerificationComplete} style={styles.backButton}>
          <ChevronLeft size={24} color={colors.gray800} />
        </TouchableOpacity>
        <Text style={styles.title}>Driver's License</Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {existingLicense ? (
        <View style={styles.existingLicenseContainer}>
          <Image 
            source={{ uri: existingLicense }} 
            style={styles.existingLicense}
            resizeMode="contain"
          />
          <TouchableOpacity 
            style={styles.updateButton}
            onPress={() => setExistingLicense(null)}
          >
            <Text style={styles.updateButtonText}>Upload New License</Text>
          </TouchableOpacity>
        </View>
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
              onPress={handleUpload}
              loading={loading}
              style={styles.button}
              fullWidth
            />
          )}

          <Text style={styles.disclaimer}>
            Please ensure your license is clearly visible and all details are readable.
            We'll verify your license within 24 hours.
          </Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.gray900,
    marginLeft: 8,
  },
  label: {
    fontSize: 16,
    color: colors.gray800,
    marginBottom: 16,
    padding: 16,
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
  imageContainer: {
    marginHorizontal: 16,
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
  button: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  errorContainer: {
    backgroundColor: colors.error100,
    padding: 12,
    margin: 16,
    borderRadius: 8,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
  },
  disclaimer: {
    marginTop: 16,
    fontSize: 12,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 32,
  },
  existingLicenseContainer: {
    flex: 1,
    padding: 16,
  },
  existingLicense: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 16,
  },
  updateButton: {
    backgroundColor: colors.primary100,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
});