import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import * as functions from "firebase-functions";

// Initialize Firebase Admin
const app = initializeApp({
  credential: cert({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // Ensure private key is properly formatted with newlines
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

export const auth = getAuth(app);
export const db = getFirestore(app);

// Cloud Function to delete a user
export const deleteUser = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  // Verify admin status
  const callerUid = context.auth.uid;
  try {
    const callerDoc = await db.collection('users').doc(callerUid).get();
    const callerData = callerDoc.data();
    const isAdmin = callerData?.displayName?.includes('admin');

    if (!isAdmin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only administrators can delete users.'
      );
    }

    // Get the user to delete
    const { userId } = data;
    if (!userId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'The function must be called with userId argument.'
      );
    }

    // Delete from Authentication
    await auth.deleteUser(userId);

    // Delete from Firestore
    await db.collection('users').doc(userId).delete();

    return { success: true, message: 'User deleted successfully' };
  } catch (error: any) {
    console.error('Error deleting user:', error);
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'An error occurred while deleting the user'
    );
  }
});