import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { PhoneVerification } from '../../components/verification/PhoneVerification';
import { colors } from '../../constants/theme';

export default function PhoneVerificationScreen() {
  const router = useRouter();

  const handleVerificationComplete = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <PhoneVerification onVerificationComplete={handleVerificationComplete} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
});