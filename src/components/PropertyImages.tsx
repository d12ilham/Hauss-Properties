
import React from 'react';

interface PropertyImagesProps {
  images: string[];
}

const PropertyImages: React.FC<PropertyImagesProps> = ({ images }) => {
  return (
    <div className="flex gap-4 mb-6 overflow-x-auto justify-center">
      {images.map((image, index) => (
        <img
          key={index}
          src={image}
          alt={`Property view ${index + 1}`}
          className="flex-shrink-0 min-w-[300px] max-w-[400px] h-64 object-cover rounded-lg shadow-md transition-transform duration-300 hover:scale-105 cursor-pointer"
        />
      ))}
    </div>
  );
};

export default PropertyImages;
