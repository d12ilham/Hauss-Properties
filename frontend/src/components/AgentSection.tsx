import React from "react";

interface AgentSectionProps {
  agent: {
    name: string;
    agency: string;
    agencyNumber: string;
    applyUrl: string;
  };
}

const AgentSection: React.FC<AgentSectionProps> = ({ agent }) => {
  return (
    <div className="mt-5 md:mt-10 px-8 py-12 bg-customWhite rounded-xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
        <div>
          <h3 className="text-customNavy font-medium mb-2 text-lg">
            Listing Agent: {agent.name}
          </h3>
          <h4>
            Mobile:{" "}
            <a href={`tel:${agent.agencyNumber}`}>{agent.agencyNumber}</a>
          </h4>
          <p className="text-black">Hauss Realty</p>
        </div>
        <a
          href="https://www.hauss.com.au/expression-of-interest/"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-customOrange text-white text-center w-full md:w-auto px-8 py-4 rounded-lg font-medium text-base cursor-pointer transition-all duration-300 hover:bg-customNavy hover:-translate-y-1 no-underline inline-block"
        >
          Submit an offer
        </a>
      </div>
    </div>
  );
};

export default AgentSection;
