import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card, CardContent } from "@/components/ui/card";
import { Property } from "@shared/schema";
import { MapPin, Bed, Bath, Move } from "lucide-react";
import { useState } from "react";

interface PropertyCardProps {
  property: Property;
  onClick?: () => void;
}

export function PropertyCard({ property, onClick }: PropertyCardProps) {
  const [imageError, setImageError] = useState(false);

  // Placeholder image URL with branded design
  const placeholderImage = "https://placehold.co/600x400/FF9F40/FFFFFF?text=SAKANY";

  // Get the first image or use placeholder
  const imageUrl = (!imageError && property.images?.[0]) || placeholderImage;

  return (
    <Card 
      className="group overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer" 
      onClick={onClick}
    >
      <div className="relative w-full">
        <AspectRatio ratio={16/9} className="bg-muted">
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={imageUrl}
              alt={property.title}
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          </div>
        </AspectRatio>
      </div>

      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-2 line-clamp-2">{property.title}</h3>
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="truncate">{property.location}</span>
        </div>
        <p className="text-xl font-bold mb-4 text-primary">
          {new Intl.NumberFormat('ar-SA', {
            style: 'currency',
            currency: 'SAR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(property.price)}
        </p>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Bed className="h-4 w-4 shrink-0" />
            <span>{property.bedrooms} beds</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="h-4 w-4 shrink-0" />
            <span>{property.bathrooms} baths</span>
          </div>
          <div className="flex items-center gap-1">
            <Move className="h-4 w-4 shrink-0" />
            <span>{property.area} m²</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}