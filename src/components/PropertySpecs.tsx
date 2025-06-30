
import React from 'react';

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
    <div className="flex gap-3 mb-3 p-3 flex-wrap">
      <div className="flex items-center gap-2 font-medium text-slate-700">
        <div className="w-6 h-6">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 14c1.66 0 3-1.34 3-3S8.66 8 7 8s-3 1.34-3 3 1.34 3 3 3zm0-4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm12-3h-8v8H3V5H1v15h2v-3h18v3h2v-9c0-1.1-.9-2-2-2z"/>
          </svg>
        </div>
        <span>{specs.bedrooms}</span>
      </div>
      
      <div className="flex items-center gap-2 font-medium text-slate-700">
        <div className="w-6 h-6">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <span>{specs.bathrooms}</span>
      </div>
      
      <div className="flex items-center gap-2 font-medium text-slate-700">
        <div className="w-6 h-6">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
          </svg>
        </div>
        <span>{specs.parking}</span>
      </div>
      
      <div className="flex items-center gap-2 font-medium text-slate-700">
        <span><strong>Land Size:</strong> {specs.landSize}</span>
      </div>
    </div>
  );
};

export default PropertySpecs;
