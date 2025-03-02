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
  multiFactor,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  MultiFactorError,
  getMultiFactorResolver,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: FirebaseUser | null;
  isLoading: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithMfaVerification: (verificationId: string, verificationCode: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string, isLandlord: boolean, isAdmin?: boolean) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: { displayName?: string; email?: string; password?: string }) => Promise<void>;
  deleteAccount: () => Promise<void>;
  isAdmin: boolean;
  loginAsAdmin: (email: string, password: string) => Promise<void>;
  mfaResolver: any;
  setMfaResolver: (resolver: any) => void;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mfaResolver, setMfaResolver] = useState<any>(null);
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

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Welcome back!",
        description: "Successfully logged in",
      });
    } catch (error: any) {
      // Handle MFA required error
      if (error.code === 'auth/multi-factor-auth-required') {
        const resolver = getMultiFactorResolver(auth, error);
        setMfaResolver(resolver);

        // Send verification code
        const phoneAuthProvider = new PhoneAuthProvider(auth);
        const verificationId = await phoneAuthProvider.verifyPhoneNumber(
          resolver.hints[0],
          resolver.session
        );

        toast({
          title: "2FA Required",
          description: "Please enter the verification code sent to your phone",
        });

        return; // Indicate MFA is required
      }

      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const loginWithMfaVerification = async (verificationId: string, verificationCode: string) => {
    if (!mfaResolver) return;

    try {
      const cred = PhoneAuthProvider.credential(verificationId, verificationCode);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
      await mfaResolver.resolveSignIn(multiFactorAssertion);

      setMfaResolver(null);

      toast({
        title: "Welcome back!",
        description: "Successfully logged in",
      });
    } catch (error: any) {
      toast({
        title: "Verification failed",
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

      // Add user type (landlord/user)
      displayNameParts.push(isLandlord ? 'landlord' : 'user');

      // Add admin status if applicable
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

      // If it's an admin account, log in as admin
      if (isAdmin || email.toLowerCase().endsWith('@sakany.com')) {
        await loginAsAdmin(email, password);
      }

      toast({
        title: "Welcome to SAKANY!",
        description: "Your account has been created successfully",
      });
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
        loginWithMfaVerification,
        register,
        logout,
        resetPassword,
        updateUserProfile,
        deleteAccount,
        isAdmin,
        loginAsAdmin,
        mfaResolver,
        setMfaResolver,
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