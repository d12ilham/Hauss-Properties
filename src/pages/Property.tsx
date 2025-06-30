
import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import PropertyHeader from '../components/PropertyHeader';
import PropertyImages from '../components/PropertyImages';
import PropertySpecs from '../components/PropertySpecs';
import PropertyDocuments from '../components/PropertyDocuments';
import PropertyDescription from '../components/PropertyDescription';
import PropertyFeatures from '../components/PropertyFeatures';
import LocationInfo from '../components/LocationInfo';
import LifestyleSection from '../components/LifestyleSection';
import AgentSection from '../components/AgentSection';
import { fetchPropertyData, seedPropertyData } from '../services/propertyService';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const Property = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  
  const { data: property, isLoading, error, refetch } = useQuery({
    queryKey: ['property', id],
    queryFn: () => fetchPropertyData(id!),
    enabled: !!id,
  });

  const handleSeedData = async () => {
    if (!id) return;
    
    const success = await seedPropertyData(id);
    if (success) {
      toast({
        title: "Success",
        description: "Property data has been seeded to Supabase database",
      });
      refetch(); // Refetch the property data to show the updated info
    } else {
      toast({
        title: "Error",
        description: "Failed to seed property data",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading property details...</div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">Error loading property details</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto p-5">
        <PropertyHeader property={property} />
        
        <div className="bg-white rounded-lg shadow-sm mb-5 p-8">
          <div className="mb-4 flex justify-end">
            <Button onClick={handleSeedData} variant="outline" size="sm">
              Seed Database with Sample Data
            </Button>
          </div>
          
          <PropertyImages images={property.images} />
          <PropertySpecs specs={property.specs} />
          <PropertyDocuments documents={property.documents} />
          
          <div className="bg-orange-100 border-l-4 border-orange-400 p-4 rounded-r-lg my-5">
            <strong className="text-gray-800">{property.highlight}</strong>
          </div>
          
          <PropertyDescription description={property.description} />
          <PropertyFeatures features={property.features} />
          <LocationInfo info={property.locationInfo} />
        </div>

        <LifestyleSection lifestyle={property.lifestyle} />
        <AgentSection agent={property.agent} />
      </div>
    </div>
  );
};

export default Property;
