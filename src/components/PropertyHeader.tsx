import React from "react";

interface PropertyHeaderProps {
  property: {
    address: string;
    suburb: string;
    postcode: string;
    agency: string;
    agencyNumber: string;
    logo?: string;
  };
}

const PropertyHeader: React.FC<PropertyHeaderProps> = ({ property }) => {
  return (
    <div className="bg-customNavy text-customWhite px-8 py-10 rounded-3xl mb-6 shadow-md flex flex-col items-center gap-3 border">
      <img
        src="/hauss-logo.png"
        alt="Agency Logo"
        className="w-20 h-auto md:w-28"
      />
      <h1 className="text-2xl md:text-4xl text-center md:text-left font-medium leading-[1.4em]">
        {property.address}
      </h1>
      <p className="leading-[1.5em] text-center md:text-left ">
        {property.agency} |{" "}
        <a href={`tel:${property.agencyNumber}`}>{property.agencyNumber}</a>
      </p>
    </div>
  );
};

export default PropertyHeader;
