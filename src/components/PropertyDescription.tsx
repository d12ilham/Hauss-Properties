import React, { useEffect, useState } from "react";

interface PropertyDescriptionProps {
  description: string;
  setPropertyFeatures: (features: string[]) => void;
  setLocationInfo: (location: string) => void;
}

const PropertyDescription: React.FC<PropertyDescriptionProps> = ({
  description,
  setPropertyFeatures,
  setLocationInfo,
}) => {
  const [cleanedDescription, setCleanedDescription] = useState<string[]>([]);

  useEffect(() => {
    const lines = description.split(/\r?\n/).map((line) => line.trim());

    const features: string[] = [];
    const paragraphs: string[] = [];

    for (const line of lines) {
      if (line.startsWith("•")) {
        features.push(line.replace(/^•\s*/, ""));
      } else if (line !== "") {
        paragraphs.push(line);
      }
    }

    // Extract the last paragraph as location info
    const locationInfo = paragraphs.pop(); // removes and returns last item

    setPropertyFeatures(features);
    if (locationInfo) {
      setLocationInfo(locationInfo);
    }
    setCleanedDescription(paragraphs);
  }, [description, setPropertyFeatures, setLocationInfo]);

  return (
    <div className="leading-relaxed mb-8 space-y-4 text-black">
      {cleanedDescription.map((paragraph, index) => (
        <p key={index} className="whitespace-pre-line">
          {paragraph}
        </p>
      ))}
    </div>
  );
};

export default PropertyDescription;
