import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/ui/property-card";
import { useQuery } from "@tanstack/react-query";
import { Property } from "@shared/schema";
import { Link } from "wouter";

export default function Home() {
  const { data: featuredProperties } = useQuery<Property[]>({
    queryKey: ["/api/properties/featured"],
  });

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-orange-50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold mb-4">
              Find Your Perfect Home Match
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Discover properties tailored to your lifestyle and preferences
            </p>
            <div className="flex gap-4">
              <Link href="/search">
                <Button size="lg">Browse Properties</Button>
              </Link>
              <Link href="/lifestyle">
                <Button size="lg" variant="outline">
                  Take Lifestyle Quiz
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-semibold mb-8">Featured Properties</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProperties?.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
