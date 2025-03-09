import { useQuery, useMutation } from "@tanstack/react-query";
import { Property } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function PropertyApprovals() {
  const { toast } = useToast();
  const [rejectionNote, setRejectionNote] = useState("");

  const { data: pendingProperties, isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties/pending"],
  });

  const approveMutation = useMutation({
    mutationFn: async (propertyId: number) => {
      const response = await fetch(`/api/properties/${propertyId}/approve`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to approve property");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties/pending"] });
      toast({
        title: "Success",
        description: "Property has been approved",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ propertyId, note }: { propertyId: number; note: string }) => {
      const response = await fetch(`/api/properties/${propertyId}/reject`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ note }),
      });
      if (!response.ok) throw new Error("Failed to reject property");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties/pending"] });
      setRejectionNote("");
      toast({
        title: "Success",
        description: "Property has been rejected",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Property Approval Queue</h1>
      <div className="grid gap-6">
        {pendingProperties?.map((property) => (
          <Card key={property.id}>
            <CardHeader>
              <CardTitle>{property.title}</CardTitle>
              <CardDescription>{property.location}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">{property.description}</p>
                <p className="mt-2">
                  {property.bedrooms} beds • {property.bathrooms} baths • {property.area} m²
                </p>
                <p className="font-semibold mt-2">{property.price.toLocaleString()} SAR</p>
              </div>
              <div className="flex gap-4">
                <Button
                  onClick={() => approveMutation.mutate(property.id)}
                  disabled={approveMutation.isPending}
                >
                  Approve
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Reject</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reject Property</AlertDialogTitle>
                      <AlertDialogDescription>
                        Please provide a reason for rejecting this property listing.
                        This will be visible to the property owner.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Textarea
                      value={rejectionNote}
                      onChange={(e) => setRejectionNote(e.target.value)}
                      placeholder="Enter rejection reason..."
                      className="my-4"
                    />
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          if (!rejectionNote.trim()) {
                            toast({
                              title: "Error",
                              description: "Please provide a rejection reason",
                              variant: "destructive",
                            });
                            return;
                          }
                          rejectMutation.mutate({
                            propertyId: property.id,
                            note: rejectionNote,
                          });
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Reject
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
        {pendingProperties?.length === 0 && (
          <p className="text-center text-muted-foreground">No pending properties to review</p>
        )}
      </div>
    </div>
  );
}
