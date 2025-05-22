import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      throw new Error('Missing required fields');
    }

    // Upload to Firebase Storage
    const storage = getStorage();
    const fileRef = ref(storage, `licenses/${userId}/${file.name}`);
    
    const response = await fetch(file.uri);
    const blob = await response.blob();
    await uploadBytes(fileRef, blob);

    // Get download URL
    const downloadURL = await getDownloadURL(fileRef);

    // Update user profile
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      'verificationStatus.license': true,
      licenseUrl: downloadURL,
      licenseVerifiedAt: new Date().toISOString()
    });

    return Response.json({ success: true, downloadURL });
  } catch (error: any) {
    console.error('Error uploading license:', error);
    return new Response(error.message, { status: 400 });
  }
}