import { useQuery } from "@tanstack/react-query";
import { Property } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bed, Bath, Square, MapPin, Check } from "lucide-react";

export default function PropertyPage({ params: { id } }: { params: { id: string } }) {
  const { data: property, isLoading } = useQuery<Property>({
    queryKey: [`/api/properties/${id}`],
  });

  if (isLoading) return <div>Loading...</div>;
  if (!property) return <div>Property not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-bold mb-4">{property.title}</h1>

          <div className="flex items-center gap-2 mb-6">
            <MapPin className="text-muted-foreground" />
            <span>{property.location}</span>
            <Badge variant="secondary" className="ml-auto">
              {property.price.toLocaleString()} SAR
            </Badge>
          </div>

          <div className="aspect-[16/9] mb-6 overflow-hidden rounded-lg">
            <img
              src={property.images?.[0] || "https://placehold.co/1200x800"}
              alt={property.title}
              className="w-full h-full object-cover"
            />
          </div>

          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Property Details</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Bed /> {property.bedrooms} Bedrooms
                </div>
                <div className="flex items-center gap-2">
                  <Bath /> {property.bathrooms} Bathrooms
                </div>
                <div className="flex items-center gap-2">
                  <Square /> {property.area} m²
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="prose max-w-none">
            <h2>Description</h2>
            <p>{property.description}</p>
          </div>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Contact Agent</h3>
              <Button className="w-full">Request Information</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}