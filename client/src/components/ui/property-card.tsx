import { Property } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Bed, Bath, Square, MapPin } from "lucide-react";

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="p-0">
        <AspectRatio ratio={16/9}>
          <img 
            src={property.images?.[0] || "https://placehold.co/600x400/e5e7eb/a3a3a3?text=No+Image"}
            alt={property.title}
            className="object-cover w-full h-full"
          />
        </AspectRatio>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold">{property.title}</h3>
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            {property.price.toLocaleString()} SAR
          </Badge>
        </div>

        <div className="flex items-center text-muted-foreground mb-2">
          <MapPin size={16} className="mr-1" />
          <span className="text-sm">{property.location}</span>
        </div>

        <div className="flex gap-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Bed size={16} className="mr-1" />
            <span>{property.bedrooms} beds</span>
          </div>
          <div className="flex items-center">
            <Bath size={16} className="mr-1" />
            <span>{property.bathrooms} baths</span>
          </div>
          <div className="flex items-center">
            <Square size={16} className="mr-1" />
            <span>{property.area} m²</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}