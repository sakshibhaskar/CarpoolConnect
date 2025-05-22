import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  increment,
  Timestamp,
  onSnapshot,
  setDoc
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  getAuth
} from 'firebase/auth';
import { db, auth } from '../config/firebase';
import { User } from '../types/types';

// ========== User Auth and Profile ==========
export const updateUserProfile = async (userId: string, profileData: Partial<User>) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...profileData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error: any) {
    console.error('Error updating profile:', error);
    throw new Error(error.message || 'Failed to update profile');
  }
};

export const signUp = async (email: string, password: string, name: string, phone: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (user) {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        name,
        email,
        phoneNumber: `+91${phone}`,
        verificationStatus: {
          email: true,
          phone: false,
          license: false
        },
        preferences: {
          smoking: false,
          pets: false,
          music: 'any',
          chatLevel: 'Chatty'
        },
        ridesOffered: 0,
        ridesTaken: 0,
        memberSince: serverTimestamp()
      });

      return user;
    }

    throw new Error('Failed to create user account');
  } catch (error: any) {
    console.error('Signup error:', error);
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('An account already exists with this email address');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password should be at least 6 characters');
    }
    throw new Error(error.message || 'Failed to sign up. Please try again.');
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      throw new Error('No account exists with this email address');
    } else if (error.code === 'auth/wrong-password') {
      throw new Error('Incorrect password');
    }
    throw new Error('Failed to sign in. Please try again.');
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    throw new Error('Failed to sign out. Please try again.');
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const getUserProfile = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return {
        id: userDoc.id,
        ...userDoc.data()
      };
    }
    return null;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// ========== Rides ==========
export const searchRides = async (origin: string, destination: string, date: Date, filters?: any) => {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const ridesRef = collection(db, 'rides');
    const q = query(
      ridesRef,
      where('status', '==', 'scheduled'),
      where('origin.name', '==', origin),
      where('destination.name', '==', destination),
      orderBy('departureTime', 'asc')
    );

    const snapshot = await getDocs(q);
    const currentUser = getCurrentUser();

    const rides = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const departureTime = data.departureTime instanceof Timestamp
          ? data.departureTime.toDate()
          : new Date(data.departureTime);

        if (
          departureTime < startOfDay ||
          departureTime > endOfDay ||
          data.availableSeats < (filters?.passengers || 1) ||
          (currentUser && data.driverId === currentUser.uid)
        ) {
          return null;
        }

        const driver = await getUserProfile(data.driverId);

        return {
          id: doc.id,
          ...data,
          departureTime: departureTime.toISOString(),
          driver
        };
      })
    );

    return rides.filter(ride => ride !== null);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to search rides');
  }
};

export const getRide = async (rideId: string) => {
  try {
    const rideDoc = await getDoc(doc(db, 'rides', rideId));
    if (rideDoc.exists()) {
      const data = rideDoc.data();
      const departureTime = data.departureTime instanceof Timestamp
        ? data.departureTime.toDate()
        : new Date(data.departureTime);

      const driver = await getUserProfile(data.driverId);

      return {
        id: rideDoc.id,
        ...data,
        departureTime: departureTime.toISOString(),
        driver
      };
    }
    return null;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch ride details');
  }
};

// ========== Ride Requests & Notifications ==========
export const createBookingRequest = async (rideId: string) => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const requestsRef = collection(db, 'ride_requests');
    const request = await addDoc(requestsRef, {
      rideId,
      userId: user.uid,
      status: 'pending',
      createdAt: serverTimestamp()
    });

    const ride = await getRide(rideId);
    if (ride) {
      const notificationsRef = collection(db, 'notifications');
      await addDoc(notificationsRef, {
        userId: ride.driverId,
        type: 'request',
        title: 'New Ride Request',
        message: 'Someone requested to join your ride',
        timestamp: serverTimestamp(),
        read: false,
        rideId,
        requestId: request.id
      });
    }

    return request.id;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const handleRideRequest = async (requestId: string, rideId: string, accept: boolean) => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const requestDoc = await getDoc(doc(db, 'ride_requests', requestId));
    if (!requestDoc.exists()) throw new Error('Request no longer exists');

    const rideDoc = await getDoc(doc(db, 'rides', rideId));
    if (!rideDoc.exists()) throw new Error('Ride no longer exists');

    await updateDoc(doc(db, 'ride_requests', requestId), {
      status: accept ? 'accepted' : 'rejected',
      updatedAt: serverTimestamp()
    });

    if (accept) {
      await updateDoc(doc(db, 'rides', rideId), {
        availableSeats: increment(-1),
        passengers: [...(rideDoc.data().passengers || []), {
          id: requestDoc.data().userId,
          joinedAt: serverTimestamp()
        }]
      });
    }

    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, {
      userId: requestDoc.data().userId,
      type: 'alert',
      title: accept ? 'Ride Request Accepted' : 'Ride Request Rejected',
      message: accept
        ? 'Your ride request has been accepted!'
        : 'Your ride request has been rejected.',
      timestamp: serverTimestamp(),
      read: false,
      rideId
    });

    return true;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const getNotifications = async () => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate().toISOString()
    }));
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// ========== Messaging ==========
export const getConversations = async (userId: string) => {
  try {
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const getConversation = async (conversationId: string) => {
  try {
    const conversationDoc = await getDoc(doc(db, 'conversations', conversationId));
    if (!conversationDoc.exists()) {
      throw new Error('Conversation not found');
    }

    const data = conversationDoc.data();
    const participants = await Promise.all(
      data.participants.map(async (userId: string) => {
        const userDoc = await getDoc(doc(db, 'users', userId));
        return {
          id: userId,
          ...userDoc.data()
        };
      })
    );

    return {
      id: conversationDoc.id,
      ...data,
      participants
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const subscribeToConversations = (userId: string, callback: (conversations: any[]) => void) => {
  const conversationsRef = collection(db, 'conversations');
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', userId),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(q, async (snapshot) => {
    const conversations = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const otherUserId = data.participants.find((id: string) => id !== userId);
        const otherUser = otherUserId ? await getUserProfile(otherUserId) : null;

        return {
          id: doc.id,
          ...data,
          otherUser,
          updatedAt: data.updatedAt?.toDate().toISOString()
        };
      })
    );
    callback(conversations);
  });
};

export const subscribeToMessages = (conversationId: string, callback: (messages: any[]) => void) => {
  const messagesRef = collection(db, 'messages');
  const q = query(
    messagesRef,
    where('conversationId', '==', conversationId),
    orderBy('timestamp', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate().toISOString()
    }));
    callback(messages);
  });
};

export const sendMessage = async (conversationId: string, content: string) => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const messagesRef = collection(db, 'messages');
    const messageDoc = await addDoc(messagesRef, {
      conversationId,
      content,
      senderId: user.uid,
      timestamp: serverTimestamp()
    });

    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      lastMessage: {
        content,
        timestamp: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    });

    return messageDoc.id;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const createConversation = async (rideId: string, driverId: string) => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('rideId', '==', rideId),
      where('participants', 'array-contains', user.uid)
    );

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs[0].id;
    }

    const conversation = await addDoc(conversationsRef, {
      rideId,
      participants: [user.uid, driverId],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return conversation.id;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// ========== Emergency Contacts ==========
export const getEmergencyContacts = async () => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const contactsRef = collection(db, 'emergency_contacts');
    const q = query(
      contactsRef,
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const addEmergencyContact = async (contactData: {
  name: string;
  phone: string;
  relationship: string;
}) => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const contactsRef = collection(db, 'emergency_contacts');
    const docRef = await addDoc(contactsRef, {
      ...contactData,
      userId: user.uid,
      createdAt: serverTimestamp()
    });

    return docRef.id;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// ========== Re-exports ==========
export { auth, db };
export { getCurrentUser, subscribeToMessages, sendMessage, getConversation, createConversation, getEmergencyContacts, addEmergencyContact, handleRideRequest, getNotifications, getRide, getUserProfile, searchRides };