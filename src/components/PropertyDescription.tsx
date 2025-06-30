
import React from 'react';

interface PropertyDescriptionProps {
  description: string[];
}

const PropertyDescription: React.FC<PropertyDescriptionProps> = ({ description }) => {
  return (
    <div className="text-lg leading-relaxed mb-8">
      {description.map((paragraph, index) => (
        <p key={index} className="mb-4">
          {paragraph}
        </p>
      ))}
    </div>
  );
};

export default PropertyDescription;
