
import React from 'react';

interface PropertyDocumentsProps {
  documents: Array<{
    name: string;
    url: string;
  }>;
}

const PropertyDocuments: React.FC<PropertyDocumentsProps> = ({ documents }) => {
  return (
    <div className="bg-gray-50 p-6 rounded-lg mb-6 border border-gray-200">
      <h3 className="text-gray-800 text-xl font-semibold mb-5">Property Documents</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc, index) => (
          <a
            key={index}
            href={doc.url}
            className="flex items-center p-3 bg-white border border-gray-300 rounded-md text-gray-800 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-md"
          >
            <span className="text-lg mr-3 text-red-600">📄</span>
            <span className="font-medium text-sm">{doc.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
};

export default PropertyDocuments;
