import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity,
  Platform,
  ImageBackground
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../constants/theme';
import { Button } from '../components/ui/Button';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://images.pexels.com/photos/3806753/pexels-photo-3806753.jpeg' }}
        style={styles.backgroundImage}
      >
        <View style={styles.overlay}>
          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>CarpoolConnect</Text>
              <Text style={styles.tagline}>Share rides, save money, reduce carbon footprint</Text>
            </View>

            <View style={styles.buttonContainer}>
              <Button
                title="Sign Up"
                onPress={() => router.push('/(auth)/signup')}
                style={styles.signupButton}
                fullWidth
              />
              
              <Button
                title="Sign In"
                variant="outline"
                onPress={() => router.push('/(auth)/login')}
                style={styles.loginButton}
                fullWidth
              />
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  content: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 48 : 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: 12,
  },
  tagline: {
    fontSize: 18,
    color: colors.white,
    textAlign: 'center',
    opacity: 0.9,
  },
  buttonContainer: {
    gap: 12,
  },
  signupButton: {
    backgroundColor: colors.white,
  },
  loginButton: {
    borderColor: colors.white,
  },
});