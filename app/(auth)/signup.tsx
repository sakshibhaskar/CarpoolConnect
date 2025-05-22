import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, User, Phone, Calendar } from 'lucide-react-native';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { colors } from '../../constants/theme';
import { signUp } from '../../services/firebase';

export default function Signup() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [skipMobileVerification, setSkipMobileVerification] = useState(false);
  const [optOutPromotional, setOptOutPromotional] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validatePhone = (phoneNumber: string) => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phoneNumber);
  };

  const validateDateOfBirth = (dob: string) => {
    const dobRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
    if (!dobRegex.test(dob)) return false;
    
    const [month, day, year] = dob.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    const now = new Date();
    
    return date.getTime() < now.getTime() - (18 * 365.25 * 24 * 60 * 60 * 1000);
  };

  const handleSignup = async () => {
    try {
      setError(null);

      if (!name || !email || !password || !phone) {
        setError('Please fill in all required fields');
        return;
      }

      if (!validatePhone(phone)) {
        setError('Please enter a valid 10-digit phone number');
        return;
      }

      if (dateOfBirth && !validateDateOfBirth(dateOfBirth)) {
        setError('Please enter a valid date of birth (MM/DD/YYYY). You must be at least 18 years old.');
        return;
      }

      setLoading(true);
      await signUp(email, password, name, phone);
      router.replace('/(tabs)');
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to sign up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.formContainer}>
          <Input
            label="Full Name"
            placeholder="Enter your full name"
            value={name}
            onChangeText={setName}
            leftIcon={<User size={20} color={colors.gray500} />}
          />

          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            leftIcon={<Mail size={20} color={colors.gray500} />}
          />

          <Input
            label="Phone Number"
            placeholder="10-digit mobile number"
            value={phone}
            onChangeText={(text) => {
              // Only allow digits
              const cleaned = text.replace(/\D/g, '');
              if (cleaned.length <= 10) {
                setPhone(cleaned);
              }
            }}
            keyboardType="phone-pad"
            leftIcon={<Phone size={20} color={colors.gray500} />}
          />

          <Input
            label="Date of Birth (Optional)"
            placeholder="MM/DD/YYYY"
            value={dateOfBirth}
            onChangeText={(text) => {
              // Format as MM/DD/YYYY while typing
              const cleaned = text.replace(/\D/g, '');
              let formatted = cleaned;
              if (cleaned.length > 4) {
                formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4) + '/' + cleaned.slice(4, 8);
              } else if (cleaned.length > 2) {
                formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
              }
              setDateOfBirth(formatted);
            }}
            maxLength={10}
            leftIcon={<Calendar size={20} color={colors.gray500} />}
          />

          <Input
            label="Password"
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            showPasswordToggle
            leftIcon={<Lock size={20} color={colors.gray500} />}
          />

          <View style={styles.checkboxContainer}>
            <TouchableOpacity 
              style={styles.checkbox}
              onPress={() => setOptOutPromotional(!optOutPromotional)}
            >
              <View style={[styles.checkboxBox, optOutPromotional && styles.checkboxChecked]} />
              <Text style={styles.checkboxText}>Opt out of promotional messages</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.termsText}>
            By signing up, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>

          <Button
            title="Sign Up"
            onPress={handleSignup}
            loading={loading}
            style={styles.signupButton}
            fullWidth
          />
        </View>

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.loginText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
  },
  headerContainer: {
    marginBottom: 24,
    marginTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.gray900,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray600,
  },
  formContainer: {
    width: '100%',
  },
  errorContainer: {
    backgroundColor: colors.error100,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
  },
  checkboxContainer: {
    marginBottom: 24,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.gray400,
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxText: {
    fontSize: 14,
    color: colors.gray700,
  },
  termsText: {
    fontSize: 14,
    color: colors.gray600,
    marginBottom: 24,
    lineHeight: 20,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: '500',
  },
  signupButton: {
    marginVertical: 8,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  footerText: {
    color: colors.gray600,
    marginRight: 4,
  },
  loginText: {
    color: colors.primary,
    fontWeight: '600',
  },
});