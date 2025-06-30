
import React from 'react';

interface PropertyFeaturesProps {
  features: string[];
}

const PropertyFeatures: React.FC<PropertyFeaturesProps> = ({ features }) => {
  return (
    <div className="bg-gray-100 border-l-4 border-slate-700 p-5 my-5 rounded-r-lg">
      <h3 className="text-gray-800 text-xl font-semibold mb-4">Property Features</h3>
      <ul className="list-none p-0">
        {features.map((feature, index) => (
          <li
            key={index}
            className="py-2 border-b border-gray-300 last:border-b-0 relative pl-6 before:content-['✓'] before:text-orange-400 before:font-bold before:absolute before:left-0"
          >
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PropertyFeatures;
