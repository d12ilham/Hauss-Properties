import React from "react";

interface PropertyFeaturesProps {
  features: string[];
}

const PropertyFeatures: React.FC<PropertyFeaturesProps> = ({ features }) => {
  return (
    <div className="bg-customWhite border-l-4 border-customNavy px-5 py-10 my-5 rounded-r-xl">
      <h3 className="text-customNavy text-xl font-medium mb-4 uppercase">
        Property Features
      </h3>
      <ul className="list-none p-0">
        {features.map((feature, index) => (
          <li
            key={index}
            className="text-black py-2 border-b border-[#e9ecef] last:border-b-0 relative pl-6 before:content-['✓'] before:text-customOrange before:font-bold before:absolute before:left-0"
          >
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PropertyFeatures;
