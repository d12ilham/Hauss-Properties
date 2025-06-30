
import React from 'react';

interface LocationInfoProps {
  info: string;
}

const LocationInfo: React.FC<LocationInfoProps> = ({ info }) => {
  return (
    <div className="bg-orange-50 p-6 rounded-lg mt-5 border border-green-200">
      <h3 className="text-gray-800 text-xl font-semibold mb-4">Location & Lifestyle</h3>
      <p>{info}</p>
    </div>
  );
};

export default LocationInfo;
