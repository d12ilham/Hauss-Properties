import React from "react";

interface PropertyImagesProps {
  images: { url: string }[];
}

const PropertyImages: React.FC<PropertyImagesProps> = ({ images }) => {
  return (
    <div className="w-full overflow-x-auto">
      <div className="flex gap-4 mb-6 justify-start px-4">
        {images.map((image, index) => (
          <img
            key={index}
            src={image.url}
            alt={`Property view ${index + 1}`}
            className="flex-shrink-0 min-w-[300px] max-w-[400px] h-64 object-cover rounded-lg shadow-md transition-transform duration-300 hover:scale-105 cursor-pointer"
          />
        ))}
      </div>
    </div>
  );
};

export default PropertyImages;
