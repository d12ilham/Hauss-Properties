
import React from 'react';

interface LifestyleItem {
  image: string;
  title: string;
  description: string;
}

interface LifestyleSectionProps {
  lifestyle: LifestyleItem[];
}

const LifestyleSection: React.FC<LifestyleSectionProps> = ({ lifestyle }) => {
  return (
    <div className="mt-10 px-10">
      <h2 className="text-2xl font-semibold mb-5 text-gray-800">Location & Lifestyle</h2>
      <div className="flex gap-5 overflow-x-auto pb-5">
        {lifestyle.map((item, index) => (
          <div
            key={index}
            className="min-w-[500px] bg-white rounded-lg overflow-hidden shadow-md flex-shrink-0"
          >
            <div className="w-full bg-gray-100">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-48 object-cover"
              />
            </div>
            <div className="p-4">
              <div className="font-semibold text-slate-700 mb-1">{item.title}</div>
              <div className="text-black text-sm">{item.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LifestyleSection;
