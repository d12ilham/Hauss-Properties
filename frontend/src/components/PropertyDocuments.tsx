import React, { useState } from "react";

interface PropertyDocumentsProps {
  documents: Array<{
    title: string;
    url: string;
  }>;
}

const PropertyDocuments: React.FC<PropertyDocumentsProps> = ({ documents }) => {
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);

  const baseURL = import.meta.env.VITE_BACKEND_URL;

  const openModal = (url: string) => {
    if (url.startsWith("https://")) {
      setSelectedPdf(url);
    } else {
      setSelectedPdf(baseURL + url);
    }
  };

  const closeModal = () => {
    setSelectedPdf(null);
  };

  return (
    <div className="bg-customWhite p-6 rounded-lg mb-6 border border-gray-200">
      <h3 className="text-customNavy text-xl font-medium mb-5 uppercase">
        Property Documents
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc, index) => (
          <>
            <button
              key={index}
              onClick={() => openModal(doc.url)}
              className="hidden md:flex items-center p-3 w-full text-left bg-white border border-gray-300 rounded-md text-black hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-md"
            >
              <span className="text-lg mr-3 text-red-600">📄</span>
              <span className="text-sm text-black">
                {doc.title.split(" - ")[0]}
              </span>
            </button>
            <a
              key={index}
              target="_blank"
              href={
                doc.url.startsWith("https://")
                  ? doc.url + "#toolbar=0"
                  : baseURL + doc.url + "#toolbar=0"
              }
              className="flex md:hidden items-center p-3 w-full text-left bg-white border border-gray-300 rounded-md text-black hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-md"
            >
              <span className="text-lg mr-3 text-red-600">📄</span>
              <span className="text-sm text-black">
                {doc.title.split(" - ")[0]}
              </span>
            </a>
          </>
        ))}
      </div>

      {/* Modal for displaying PDF */}
      {selectedPdf && (
        <div className="fixed inset-0 bg-customNavy bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg overflow-hidden w-[90%] h-[90%] relative shadow-lg pt-14 pb-5">
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 bg-customOrange text-white px-3 py-1 rounded hover:bg-customNavy z-20"
            >
              X
            </button>

            <iframe
              src={selectedPdf + "#toolbar=0"}
              className="w-full h-full"
              title="PDF Viewer"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDocuments;
