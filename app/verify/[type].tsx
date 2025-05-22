import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Verification } from '../../components/verification/Verification';
import { colors } from '../../constants/theme';

export default function VerificationScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams();

  const handleVerificationComplete = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ChevronLeft size={24} color={colors.gray800} />
        </TouchableOpacity>
      </View>

      <Verification 
        type={type as 'phone' | 'license'} 
        onComplete={handleVerificationComplete} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
});