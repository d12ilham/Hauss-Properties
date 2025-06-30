
import React from 'react';

interface AgentSectionProps {
  agent: {
    name: string;
    agency: string;
    applyUrl: string;
  };
}

const AgentSection: React.FC<AgentSectionProps> = ({ agent }) => {
  return (
    <div className="mt-10 p-8 bg-gray-100 rounded-lg">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-slate-700 font-semibold mb-1">
            Listing Agent: {agent.name}
          </h3>
          <p className="text-black">{agent.agency}</p>
        </div>
        <a
          href={agent.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-orange-400 text-white px-8 py-4 rounded-lg font-semibold text-base cursor-pointer transition-all duration-300 hover:bg-orange-500 hover:-translate-y-1 no-underline inline-block"
        >
          Apply For This Property
        </a>
      </div>
    </div>
  );
};

export default AgentSection;
