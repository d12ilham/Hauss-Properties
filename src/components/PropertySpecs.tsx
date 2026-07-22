import React from "react";

import { Bath, BedDouble, CarFront } from "lucide-react";

interface PropertySpecsProps {
  specs: {
    bedrooms: number;
    bathrooms: number;
    parking: number;
    landSize: string;
  };
}

const PropertySpecs: React.FC<PropertySpecsProps> = ({ specs }) => {
  return (
    <div className="py-10 flex flex-col gap-4">
      <div className="flex gap-10 flex-wrap">
        <div className="flex items-end gap-3 text-black">
          <BedDouble className="w-7 h-7" />

          <p>{specs.bedrooms}</p>
        </div>
        <div className="flex items-end gap-3 text-black">
          <Bath className="w-7 h-7" />

          <p>{specs.bathrooms}</p>
        </div>
        <div className="flex items-end gap-3 text-black">
          <CarFront className="w-7 h-7" />

          <p>{specs.parking}</p>
        </div>
      </div>

      {specs.landSize && (
        <div className="flex items-center gap-2 text-black ">
          <span className="font-medium">Land Size:</span>
          <span>{specs.landSize}</span>
        </div>
      )}
    </div>
  );
};

export default PropertySpecs;
