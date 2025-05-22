import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Platform,
  ScrollView,
  Alert,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Camera } from 'lucide-react-native';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { colors } from '../../../constants/theme';
import { getCurrentUser, getUserProfile, updateUserProfile } from '../../../services/firebase';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../config/firebase';

export default function EditProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    preferences: {
      chatLevel: 'Chatty',
      music: 'any',
      smoking: false,
      pets: false
    }
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const user = getCurrentUser();
      if (!user) return;

      const profile = await getUserProfile(user.uid);
      if (profile) {
        setFormData({
          name: profile.name || '',
          email: profile.email || '',
          phone: profile.phoneNumber?.replace('+91', '') || '',
          preferences: profile.preferences || {
            chatLevel: 'Chatty',
            music: 'any',
            smoking: false,
            pets: false
          }
        });
        setProfileImage(profile.profileImage || null);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      const user = getCurrentUser();
      if (!user) throw new Error('Not authenticated');

      const response = await fetch(uri);
      const blob = await response.blob();
      
      const storageRef = ref(storage, `profiles/${user.uid}/profile.jpg`);
      await uploadBytes(storageRef, blob);
      
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      throw error;
    }
  };

  const handleSave = async () => {
    try {
      setError(null);
      setLoading(true);

      const user = getCurrentUser();
      if (!user) throw new Error('Not authenticated');

      let profileImageUrl = profileImage;
      if (profileImage && profileImage.startsWith('file://')) {
        profileImageUrl = await uploadImage(profileImage);
      }

      const phoneNumber = formData.phone ? `+91${formData.phone}` : '';

      await updateUserProfile(user.uid, {
        ...formData,
        phoneNumber,
        profileImage: profileImageUrl
      });
      
      if (Platform.OS === 'web') {
        alert('Profile updated successfully!');
      } else {
        Alert.alert('Success', 'Profile updated successfully!');
      }

      router.replace('/(tabs)/profile');
    } catch (error: any) {
      setError(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setError('Failed to pick image');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity 
          style={styles.avatarContainer}
          onPress={pickImage}
        >
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {formData.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.cameraButton}>
            <Camera size={20} color={colors.white} />
          </View>
        </TouchableOpacity>

        <Input
          label="Full Name"
          value={formData.name}
          onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
          placeholder="Enter your full name"
        />

        <Input
          label="Email"
          value={formData.email}
          onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          editable={false}
        />

        <Input
          label="Phone"
          value={formData.phone}
          onChangeText={(text) => {
            // Only allow digits and limit to 10 characters
            const cleaned = text.replace(/\D/g, '');
            if (cleaned.length <= 10) {
              setFormData(prev => ({ ...prev, phone: cleaned }));
            }
          }}
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
        />

        <Text style={styles.sectionTitle}>Preferences</Text>

        <View style={styles.preferencesContainer}>
          <TouchableOpacity
            style={styles.preferenceOption}
            onPress={() => setFormData(prev => ({
              ...prev,
              preferences: {
                ...prev.preferences,
                smoking: !prev.preferences.smoking
              }
            }))}
          >
            <Text style={styles.preferenceLabel}>Allow smoking</Text>
            <View style={[
              styles.checkbox,
              formData.preferences.smoking && styles.checkboxChecked
            ]} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.preferenceOption}
            onPress={() => setFormData(prev => ({
              ...prev,
              preferences: {
                ...prev.preferences,
                pets: !prev.preferences.pets
              }
            }))}
          >
            <Text style={styles.preferenceLabel}>Allow pets</Text>
            <View style={[
              styles.checkbox,
              formData.preferences.pets && styles.checkboxChecked
            ]} />
          </TouchableOpacity>
        </View>

        <Button
          title={loading ? "Saving..." : "Save Changes"}
          onPress={handleSave}
          loading={loading}
          style={styles.saveButton}
          fullWidth
        />
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
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
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.white,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray800,
    marginTop: 24,
    marginBottom: 16,
  },
  preferencesContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  preferenceOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  preferenceLabel: {
    fontSize: 16,
    color: colors.gray800,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.gray400,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  saveButton: {
    marginVertical: 24,
  },
});