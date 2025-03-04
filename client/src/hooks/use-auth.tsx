import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword,
  deleteUser,
  type User as FirebaseUser,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: FirebaseUser | null;
  isLoading: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string, isLandlord: boolean, isAdmin?: boolean) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: { displayName?: string; email?: string; password?: string }) => Promise<void>;
  deleteAccount: () => Promise<void>;
  isAdmin: boolean;
  loginAsAdmin: (email: string, password: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAdmin(
        user ?
          (user.email?.toLowerCase().endsWith('@sakany.com') ||
            user.displayName?.split('|').includes('admin')) :
          false
      );
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const sendVerificationEmail = async () => {
    if (!user) return;

    try {
      await sendEmailVerification(user);

      // Store the last verification attempt time in localStorage
      localStorage.setItem('lastEmailVerificationAttempt', Date.now().toString());

      toast({
        title: "Verification email sent",
        description: "Please check your email to verify your account",
      });
    } catch (error: any) {
      console.error("Email verification error:", error);
      let errorMessage = "Failed to send verification email";

      if (error.code === 'auth/too-many-requests') {
        // Check when the last attempt was made
        const lastAttempt = localStorage.getItem('lastEmailVerificationAttempt');
        if (lastAttempt) {
          const timeSinceLastAttempt = Date.now() - parseInt(lastAttempt);
          const minutesLeft = Math.ceil((60 * 1000 - timeSinceLastAttempt) / (60 * 1000));

          if (minutesLeft > 0) {
            errorMessage = `Please wait ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''} before requesting another verification email`;
          }
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Welcome back!",
        description: "Successfully logged in",
      });
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string, isLandlord: boolean, isAdmin: boolean = false) => {
    try {
      // Check if trying to register as admin with valid email
      if (isAdmin && !email.toLowerCase().endsWith('@sakany.com')) {
        throw new Error("Admin accounts must use a @sakany.com email address");
      }

      const { user } = await createUserWithEmailAndPassword(auth, email, password);

      // Set display name with proper roles
      const displayNameParts = [name];
      displayNameParts.push(isLandlord ? 'landlord' : 'user');
      if (isAdmin || email.toLowerCase().endsWith('@sakany.com')) {
        displayNameParts.push('admin');
      }

      await updateProfile(user, {
        displayName: displayNameParts.join('|')
      });

      // Create user document in Firestore
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: email,
        displayName: displayNameParts.join('|'),
        isLandlord: isLandlord,
        canListProperties: isLandlord,
        createdAt: new Date().toISOString()
      });

      // Send verification email
      await sendEmailVerification(user);

      toast({
        title: "Welcome to SAKANY!",
        description: "Please check your email to verify your account",
      });

      // If it's an admin account, log in as admin
      if (isAdmin || email.toLowerCase().endsWith('@sakany.com')) {
        await loginAsAdmin(email, password);
      }
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Logged out",
        description: "Come back soon!",
      });
    } catch (error: any) {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Password Reset Email Sent",
        description: "Check your email for instructions to reset your password",
      });
    } catch (error: any) {
      toast({
        title: "Password Reset Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateUserProfile = async (data: { displayName?: string; email?: string; password?: string }) => {
    if (!auth.currentUser) {
      throw new Error("No user is currently logged in");
    }

    try {
      const updates: Promise<void>[] = [];

      if (data.displayName) {
        // Preserve the user type (landlord/user) and admin status when updating the display name
        const currentDisplayName = auth.currentUser.displayName || "";
        const parts = currentDisplayName.split("|");
        const userType = parts[1] || "user";
        const isAdmin = parts.includes("admin");
        updates.push(updateProfile(auth.currentUser, {
          displayName: `${data.displayName}|${userType}${isAdmin ? '|admin' : ''}`
        }));
      }

      if (data.email) {
        updates.push(updateEmail(auth.currentUser, data.email));
      }

      if (data.password) {
        updates.push(updatePassword(auth.currentUser, data.password));
      }

      await Promise.all(updates);

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteAccount = async () => {
    if (!auth.currentUser) {
      throw new Error("No user is currently logged in");
    }

    try {
      await deleteUser(auth.currentUser);
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted",
      });
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const loginAsAdmin = async (email: string, password: string) => {
    try {
      if (!email.toLowerCase().endsWith('@sakany.com')) {
        throw new Error("This email is not authorized as admin");
      }
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Welcome Admin!",
        description: "Successfully logged in as administrator",
      });
    } catch (error: any) {
      toast({
        title: "Admin Login Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        register,
        logout,
        resetPassword,
        updateUserProfile,
        deleteAccount,
        isAdmin,
        loginAsAdmin,
        sendVerificationEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}