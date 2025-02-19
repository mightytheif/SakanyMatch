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
  const [isLoading, setIsLoading] = useState(true);

  // Placeholder image URL with branded design
  const placeholderImage = "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=500&auto=format";

  // Get the first image or use placeholder
  const imageUrl = (!imageError && property.images?.[0]) || placeholderImage;

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  return (
    <Card 
      className="group overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer" 
      onClick={onClick}
    >
      <div className="relative w-full">
        <AspectRatio ratio={16/9} className="bg-muted">
          <div className="absolute inset-0 overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <div className="animate-pulse bg-primary/10 w-full h-full" />
              </div>
            )}
            <img
              src={imageUrl}
              alt={property.title}
              className={`w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300 ${
                isLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onError={handleImageError}
              onLoad={handleImageLoad}
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