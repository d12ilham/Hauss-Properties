import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import PropertyHeader from "../components/PropertyHeader";
import PropertyImages from "../components/PropertyImages";
import PropertySpecs from "../components/PropertySpecs";
import PropertyDocuments from "../components/PropertyDocuments";
import PropertyDescription from "../components/PropertyDescription";
import PropertyFeatures from "../components/PropertyFeatures";
import LocationInfo from "../components/LocationInfo";
import LifestyleSection from "../components/LifestyleSection";
import AgentSection from "../components/AgentSection";
import { fetchPropertyData } from "../services/propertyService";

const Property = () => {
  const { id } = useParams<{ id: string }>();
  const [propertyFeatures, setPropertyFeatures] = React.useState<string[]>([]);
  const [locationInfo, setLocationInfo] = React.useState<string>();

  const {
    data: property,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["property", id],
    queryFn: () => fetchPropertyData(id!),
    enabled: !!id,
  });

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
        <div className="text-lg text-red-600">
          Error loading property details
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-customWhite">
      {property?.active ? (
        <div className="max-w-7xl mx-auto p-5">
          <PropertyHeader property={property} />

          <div className="bg-white rounded-3xl shadow-sm mb-5 p-5 md:p-8 border">
            <PropertyImages images={property.images} />
            <PropertySpecs specs={property.specs} />

            {property?.documents.length > 0 && (
              <PropertyDocuments documents={property.documents} />
            )}

            <div className="bg-customPutty border-l-4 border-customOrange p-4 rounded-lg mb-5 font-medium text-customNavy">
              {property.highlight}
            </div>

            <PropertyDescription
              description={property.description.join("\n")}
              setPropertyFeatures={setPropertyFeatures}
              setLocationInfo={setLocationInfo}
            />
            {propertyFeatures.length > 0 && (
              <PropertyFeatures features={propertyFeatures} />
            )}
            <LocationInfo info={locationInfo} />

            {property?.lifestyle.length > 0 && (
              <LifestyleSection lifestyle={property.lifestyle} />
            )}

            <AgentSection agent={property.agent} />
          </div>
        </div>
      ) : (
        <div className="min-h-screen flex items-center justify-center">
          Property is not active
        </div>
      )}
    </div>
  );
};

export default Property;
