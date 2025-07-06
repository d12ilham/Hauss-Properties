import React from "react";

interface LifestyleItem {
  title: string;
  description: string;
  type: "image" | "video";
  url: string;
}

interface LifestyleSectionProps {
  lifestyle: LifestyleItem[];
}

const LifestyleSection: React.FC<LifestyleSectionProps> = ({ lifestyle }) => {
  return (
    <div className="mt-10 px-8">
      <h2 className="text-xl font-medium uppercase mb-5 text-customNavy">
        Location & Lifestyle
      </h2>
      <div className="flex gap-5 overflow-x-auto pb-5 rounded-xl ">
        {lifestyle.map((item, index) => (
          <div
            key={index}
            className="min-w-[500px] bg-white rounded-xl overflow-hidden shadow-md flex-shrink-0"
          >
            <div className="w-full bg-customWhite">
              {item.type === "image" && (
                <img
                  src={item.url}
                  alt={item.title}
                  className="w-full h-52 object-cover"
                />
              )}
              {item.type === "video" && (
                <video
                  src={item.url}
                  className="w-full h-52 object-cover"
                  controls
                />
              )}
            </div>
            <div className="p-4">
              <div className="font-medium text-black mb-1">{item.title}</div>
              <div className="text-black text-sm">{item.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LifestyleSection;
