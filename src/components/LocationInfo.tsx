import React from "react";

interface LocationInfoProps {
  info: string;
}

const LocationInfo: React.FC<LocationInfoProps> = ({ info }) => {
  return (
    <div className="bg-customPutty p-8 rounded-xl mt-5 border border-[#d4edda]">
      <h3 className="text-customNavy text-xl font-medium mb-4 uppercase">
        Location & Lifestyle
      </h3>
      <p>{info}</p>
    </div>
  );
};

export default LocationInfo;
