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
  serverTimestamp
} from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { db } from '../../config/firebase';

export const signUp = async (email: string, password: string, name: string, phone: string) => {
  try {
    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (user) {
      // Update user profile with additional information
      await updateDoc(doc(db, 'users', user.uid), {
        name: name,
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
    // Improve error handling for specific Firebase errors
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('An account already exists with this email address');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password should be at least 6 characters');
    } else {
      throw new Error('Failed to sign up. Please try again.');
    }
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const auth = getAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    // Provide more user-friendly error messages
    if (error.code === 'auth/user-not-found') {
      throw new Error('No account exists with this email address');
    } else if (error.code === 'auth/wrong-password') {
      throw new Error('Incorrect password');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address');
    } else {
      throw new Error('Failed to sign in. Please try again.');
    }
  }
};

export const getCurrentUser = () => {
  const auth = getAuth();
  return auth.currentUser;
};

export const createEmergencyAlert = async ({ lat, lng }: { lat: number; lng: number }) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const alertsRef = collection(db, 'emergency_alerts');
    const alert = await addDoc(alertsRef, {
      userId: user.uid,
      location: {
        lat,
        lng
      },
      status: 'active',
      createdAt: serverTimestamp(),
      resolved: false
    });

    return alert.id;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const searchRides = async (origin: string, destination: string, date: Date) => {
  try {
    const ridesRef = collection(db, 'rides');
    
    // Create a date range for the search
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Query rides within the date range
    const q = query(
      ridesRef,
      where('status', '==', 'scheduled'),
      orderBy('departureTime', 'asc')
    );

    const snapshot = await getDocs(q);
    const rides = snapshot.docs
      .map(doc => {
        const data = doc.data();
        // Handle both Timestamp and string formats for departureTime
        const departureTime = typeof data.departureTime === 'string' 
          ? new Date(data.departureTime)
          : data.departureTime.toDate();
          
        return {
          id: doc.id,
          ...data,
          departureTime
        };
      })
      .filter(ride => {
        const rideDate = ride.departureTime;
        return (
          rideDate >= startOfDay &&
          rideDate <= endOfDay &&
          ride.origin.name.toLowerCase() === origin.toLowerCase() &&
          ride.destination.name.toLowerCase() === destination.toLowerCase()
        );
      });

    // Fetch driver details for each ride
    const ridesWithDrivers = await Promise.all(
      rides.map(async (ride) => {
        if (ride.driverId) {
          const driverData = await getUserProfile(ride.driverId);
          return { ...ride, driver: driverData };
        }
        return ride;
      })
    );

    return ridesWithDrivers;
  } catch (error: any) {
    throw new Error(error.message);
  }
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

export const getEmergencyContacts = async () => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      return [];
    }

    const contactsRef = collection(db, 'emergency_contacts');
    const q = query(contactsRef, where('userId', '==', user.uid));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const getUserReviews = async (userId: string) => {
  try {
    const reviewsRef = collection(db, 'reviews');
    // Note: This query requires a composite index in Firebase
    // Create the index using the link in the error message
    const q = query(
      reviewsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error: any) {
    throw new Error('Error fetching reviews. Please ensure the required index is created in Firebase.');
  }
};

export const signOut = async () => {
  const auth = getAuth();
  await auth.signOut();
};

export const getRide = async (rideId: string) => {
  try {
    const rideDoc = await getDoc(doc(db, 'rides', rideId));
    if (rideDoc.exists()) {
      return {
        id: rideDoc.id,
        ...rideDoc.data()
      };
    }
    return null;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const sendMessage = async (rideId: string, text: string) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const messagesRef = collection(db, 'messages');
    const message = await addDoc(messagesRef, {
      rideId,
      text,
      senderId: user.uid,
      timestamp: serverTimestamp()
    });

    return message.id;
  } catch (error: any) {
    throw new Error(error.message);
  }
};