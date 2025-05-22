import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';

export async function POST(request: Request) {
  try {
    const { phoneNumber, step } = await request.json();

    if (step === 'send') {
      // Instead of using Firebase's phone auth directly, we'll just validate the phone number format
      // and let the client handle the actual verification
      if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) {
        throw new Error('Invalid phone number format');
      }

      // Return success to indicate the phone number format is valid
      return Response.json({ success: true });
    } else if (step === 'verify') {
      const { userId } = await request.json();

      // Update user profile with the verified phone number
      await updateDoc(doc(db, 'users', userId), {
        'verificationStatus.phone': true,
        phoneNumber: `+91${phoneNumber}`
      });

      return Response.json({ success: true });
    }

    throw new Error('Invalid step');
  } catch (error: any) {
    return new Response(error.message, { status: 400 });
  }
}