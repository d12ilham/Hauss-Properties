
import React from 'react';

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
    <div className="bg-slate-700 text-white p-8 rounded-lg mb-8 shadow-md flex justify-between items-start">
      <div>
        <h1 className="text-4xl font-light mb-2">{property.address}</h1>
        <p className="text-xl opacity-90">
          {property.suburb} {property.postcode} | {property.agency}
        </p>
      </div>
      {property.logo && (
        <div>
          <img src={property.logo} alt="Agency Logo" className="w-24 h-auto" />
        </div>
      )}
    </div>
  );
};

export default PropertyHeader;
