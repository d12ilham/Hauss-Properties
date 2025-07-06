import React from "react";

interface PropertyHeaderProps {
  property: {
    address: string;
    suburb: string;
    postcode: string;
    agency: string;
    logo?: string;
  };
}

const PropertyHeader: React.FC<PropertyHeaderProps> = ({ property }) => {
  return (
    <div className="bg-customNavy text-customWhite px-8 py-12 rounded-xl mb-6 shadow-md flex justify-between items-start">
      <div>
        <h1 className="text-4xl mb-2 font-medium">{property.address}</h1>
        <p className="mt-4">
          {property.suburb} {property.postcode} | {property.agency}
        </p>
      </div>
      <img src="/hauss-logo.png" alt="Agency Logo" className="w-24 h-auto" />
    </div>
  );
};

export default PropertyHeader;
