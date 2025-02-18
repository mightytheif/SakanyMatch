import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Property } from "@shared/schema";
import { PropertyCard } from "@/components/ui/property-card";
import { SearchFilters } from "@/components/ui/search-filters";

export default function Search() {
  const [filters, setFilters] = useState({});
  
  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties", filters],
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <SearchFilters onFilter={setFilters} />
        </div>
        
        <div className="lg:col-span-3">
          <h1 className="text-2xl font-semibold mb-6">Properties</h1>
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {properties?.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
