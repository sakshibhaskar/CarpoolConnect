import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { Calendar, Clock } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../../constants/theme';

interface DateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  mode: 'date' | 'time';
  label?: string;
  minimumDate?: Date;
  error?: string;
}

export const CustomDateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  mode,
  label,
  minimumDate = new Date(),
  error
}) => {
  const [show, setShow] = useState(false);

  const handleChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }
    
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    if (mode === 'date') {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const Icon = mode === 'date' ? Calendar : Clock;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity 
        style={[
          styles.button,
          error && styles.buttonError
        ]}
        onPress={() => setShow(true)}
      >
        <Icon size={20} color={colors.gray500} />
        <Text style={styles.buttonText}>
          {formatDate(value)}
        </Text>
      </TouchableOpacity>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {Platform.OS === 'ios' ? (
        <Modal
          visible={show}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {mode === 'date' ? 'Select Date' : 'Select Time'}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShow(false)}
                >
                  <Text style={styles.closeButtonText}>Done</Text>
                </TouchableOpacity>
              </View>

              <DateTimePicker
                value={value}
                mode={mode}
                display="spinner"
                onChange={handleChange}
                minimumDate={minimumDate}
                textColor={colors.gray900}
                style={styles.picker}
              />
            </View>
          </View>
        </Modal>
      ) : show ? (
        <DateTimePicker
          value={value}
          mode={mode}
          is24Hour={false}
          display="default"
          onChange={handleChange}
          minimumDate={minimumDate}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray700,
    marginBottom: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray300,
  },
  buttonError: {
    borderColor: colors.error,
  },
  buttonText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.gray800,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24, // Extra padding for iPhone home indicator
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gray900,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  picker: {
    height: 200,
    width: '100%',
  },
});