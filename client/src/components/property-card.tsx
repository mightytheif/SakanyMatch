import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Property } from "@shared/schema";
import { MapPin, Bed, Bath, Move } from "lucide-react";

interface PropertyCardProps {
  property: Property;
  onClick?: () => void;
}

export function PropertyCard({ property, onClick }: PropertyCardProps) {
  // Default placeholder image if no images are available
  const imageUrl = property.images?.[0] || "https://placehold.co/600x400/orange/white?text=No+Image";

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" 
      onClick={onClick}
    >
      <div className="relative">
        <AspectRatio ratio={16/9}>
          <img
            src={imageUrl}
            alt={property.title}
            className="object-cover w-full h-full rounded-t-lg"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              e.currentTarget.src = "https://placehold.co/600x400/orange/white?text=Error+Loading+Image";
            }}
          />
        </AspectRatio>
      </div>
      
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-2">{property.title}</h3>
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <MapPin className="h-4 w-4" />
          <span>{property.location}</span>
        </div>
        <p className="text-xl font-bold mb-4">
          {new Intl.NumberFormat('ar-SA', {
            style: 'currency',
            currency: 'SAR',
          }).format(property.price)}
        </p>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Bed className="h-4 w-4" />
            <span>{property.bedrooms} beds</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="h-4 w-4" />
            <span>{property.bathrooms} baths</span>
          </div>
          <div className="flex items-center gap-1">
            <Move className="h-4 w-4" />
            <span>{property.area} m²</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
