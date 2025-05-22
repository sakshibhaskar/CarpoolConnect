import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LicenseVerification } from '../../components/verification/LicenseVerification';
import { colors } from '../../constants/theme';

export default function LicenseVerificationScreen() {
  const router = useRouter();

  const handleVerificationComplete = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <LicenseVerification onVerificationComplete={handleVerificationComplete} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
});