import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Alert,
  Platform,
  Modal,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { 
  ChevronLeft, 
  Plus, 
  User, 
  Phone, 
  Heart, 
  Trash2,
  X,
  Save
} from 'lucide-react-native';
import { Button } from '../../components/ui/Button';
import { colors } from '../../constants/theme';
import { getEmergencyContacts, addEmergencyContact } from '../../services/firebase';
import { EmergencyContact } from '../../types/types';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';

export default function EmergencyContactsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    phone: '',
    relationship: ''
  });
  const [addingContact, setAddingContact] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (user) {
      fetchContacts();
    }
  }, [user]);
  
  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      const contactsList = await getEmergencyContacts();
      setContacts(contactsList);
    } catch (error) {
      console.error('Error fetching emergency contacts:', error);
      setError('Failed to load emergency contacts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validatePhoneNumber = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return false;
    }
    return true;
  };

  const formatPhoneNumber = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      return `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`;
    }
    return phone;
  };
  
  const handleAddContact = async () => {
    try {
      setError(null);

      if (!newContact.name.trim()) {
        throw new Error('Please enter a name');
      }

      if (!newContact.phone.trim()) {
        throw new Error('Please enter a phone number');
      }

      if (!validatePhoneNumber(newContact.phone)) {
        throw new Error('Please enter a valid 10-digit Indian mobile number');
      }

      if (!newContact.relationship.trim()) {
        throw new Error('Please specify the relationship');
      }
      
      setAddingContact(true);
      
      const formattedPhone = formatPhoneNumber(newContact.phone);
      
      await addEmergencyContact({
        name: newContact.name.trim(),
        phone: formattedPhone,
        relationship: newContact.relationship.trim()
      });
      
      setModalVisible(false);
      setNewContact({ name: '', phone: '', relationship: '' });
      fetchContacts();
    } catch (error: any) {
      setError(error.message || 'Failed to add contact. Please try again.');
    } finally {
      setAddingContact(false);
    }
  };
  
  const handleDeleteContact = (contactId: string) => {
    const confirmMessage = "Are you sure you want to delete this emergency contact?";
    if (Platform.OS === 'web') {
      if (confirm(confirmMessage)) {
        // Add delete functionality
        console.log('Delete contact:', contactId);
      }
    } else {
      Alert.alert(
        "Delete Contact",
        confirmMessage,
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Delete", 
            style: "destructive",
            onPress: () => {
              // Add delete functionality
              console.log('Delete contact:', contactId);
            }
          }
        ]
      );
    }
  };

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.replace('/(tabs)/profile')}
        >
          <ChevronLeft size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Emergency Contacts</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>
          These contacts will be notified in case of an emergency with your current location.
        </Text>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            setError(null);
            setModalVisible(true);
          }}
        >
          <Plus size={20} color={colors.primary} />
          <Text style={styles.addButtonText}>Add Emergency Contact</Text>
        </TouchableOpacity>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        {loading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.loadingText}>Loading contacts...</Text>
          </View>
        ) : contacts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Heart size={64} color={colors.error} />
            <Text style={styles.emptyTitle}>No Emergency Contacts</Text>
            <Text style={styles.emptyText}>
              Add trusted contacts who should be notified in case of an emergency.
            </Text>
          </View>
        ) : (
          <FlatList
            data={contacts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.contactCard}>
                <View style={styles.contactDetails}>
                  <View style={styles.contactHeader}>
                    <View style={styles.contactAvatar}>
                      <Text style={styles.contactAvatarText}>
                        {item.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.contactInfo}>
                      <Text style={styles.contactName}>{item.name}</Text>
                      <Text style={styles.contactRelationship}>{item.relationship}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.contactPhone}>
                    <Phone size={16} color={colors.gray600} />
                    <Text style={styles.contactPhoneText}>{item.phone}</Text>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => handleDeleteContact(item.id)}
                >
                  <Trash2 size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            )}
            contentContainerStyle={styles.contactsList}
          />
        )}
      </View>
      
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Emergency Contact</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => {
                  setError(null);
                  setModalVisible(false);
                }}
              >
                <X size={24} color={colors.gray700} />
              </TouchableOpacity>
            </View>

            {error && (
              <View style={styles.modalErrorContainer}>
                <Text style={styles.modalErrorText}>{error}</Text>
              </View>
            )}
            
            <Input
              label="Full Name"
              placeholder="Enter contact name"
              value={newContact.name}
              onChangeText={(text) => setNewContact({...newContact, name: text})}
              leftIcon={<User size={20} color={colors.gray500} />}
            />
            
            <Input
              label="Phone Number"
              placeholder="10-digit mobile number"
              value={newContact.phone}
              onChangeText={(text) => {
                // Only allow digits
                const cleaned = text.replace(/\D/g, '');
                if (cleaned.length <= 10) {
                  setNewContact({...newContact, phone: cleaned});
                }
              }}
              keyboardType="phone-pad"
              leftIcon={<Phone size={20} color={colors.gray500} />}
            />
            
            <Input
              label="Relationship"
              placeholder="e.g. Parent, Spouse, Friend"
              value={newContact.relationship}
              onChangeText={(text) => setNewContact({...newContact, relationship: text})}
              leftIcon={<Heart size={20} color={colors.gray500} />}
            />
            
            <Button
              title="Save Contact"
              onPress={handleAddContact}
              loading={addingContact}
              style={styles.saveButton}
              fullWidth
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.primary,
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  content: {
    padding: 16,
  },
  description: {
    fontSize: 16,
    color: colors.gray700,
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  addButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: colors.errorLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    color: colors.gray600,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray800,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray600,
    textAlign: 'center',
  },
  contactsList: {
    gap: 16,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactDetails: {
    flex: 1,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactAvatarText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray800,
  },
  contactRelationship: {
    fontSize: 14,
    color: colors.gray600,
  },
  contactPhone: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactPhoneText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.gray600,
  },
  deleteButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.gray800,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalErrorContainer: {
    backgroundColor: colors.errorLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  modalErrorText: {
    color: colors.error,
    fontSize: 14,
  },
  saveButton: {
    marginTop: 24,
  },
});