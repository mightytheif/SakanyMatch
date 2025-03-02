import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { collection, getDocs, doc, updateDoc, deleteDoc, getDoc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle } from "lucide-react";

interface User {
  uid: string;
  email: string;
  displayName: string;
  canListProperties: boolean;
  isLandlord: boolean;
  createdAt?: string;
}

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      return;
    }

    const fetchUsers = async () => {
      try {
        setError(null);
        const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(usersQuery);
        const userData = snapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        } as User));
        setUsers(userData);
      } catch (error: any) {
        console.error("Error fetching users:", error);
        let errorMessage = "Failed to fetch users";

        if (error.code === "permission-denied") {
          errorMessage = "You don't have permission to access user data. Please verify your admin privileges and ensure Firestore rules are properly configured.";
        }

        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isAdmin, navigate, toast]);

  const togglePropertyListing = async (userId: string, currentValue: boolean) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        canListProperties: !currentValue
      });

      setUsers(users.map(user => 
        user.uid === userId 
          ? { ...user, canListProperties: !currentValue }
          : user
      ));

      toast({
        title: "Success",
        description: `Property listing permission ${!currentValue ? 'granted' : 'revoked'}`,
      });
    } catch (error: any) {
      console.error("Error updating user permissions:", error);
      let errorMessage = "Failed to update user permissions";

      if (error.code === "permission-denied") {
        errorMessage = "You don't have permission to update user permissions. Please verify your admin privileges.";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const userRef = doc(db, "users", userId);

      // Get the user document to check if it exists
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        throw new Error("User not found");
      }

      // Delete the user document from Firestore
      await deleteDoc(userRef);

      // Update the local state
      setUsers(users.filter(user => user.uid !== userId));

      toast({
        title: "Success",
        description: "User has been deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting user:", error);
      let errorMessage = "Failed to delete user";

      if (error.code === "permission-denied") {
        errorMessage = "You don't have permission to delete users. Please verify your admin privileges.";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 p-4 rounded-md bg-destructive/10 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>User Type</TableHead>
              <TableHead>Can List Properties</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.uid}>
                <TableCell>{user.displayName?.split('|')[0]}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.displayName?.includes('admin') 
                    ? "Administrator" 
                    : user.isLandlord 
                    ? "Landlord" 
                    : "Regular User"}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={user.canListProperties}
                    onCheckedChange={() => togglePropertyListing(user.uid, user.canListProperties)}
                  />
                </TableCell>
                <TableCell>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        Delete User
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this user? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteUser(user.uid)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}