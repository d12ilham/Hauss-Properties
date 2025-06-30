
import React from 'react';
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-4xl font-bold mb-4 text-slate-700">Home Sight Finder</h1>
        <p className="text-xl text-gray-600 mb-8">Find your perfect property</p>
        
        <div className="space-y-4">
          <Link
            to="/property/1"
            className="block bg-orange-400 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-orange-500 transition-colors duration-300 no-underline"
          >
            View Sample Property
          </Link>
          
          <p className="text-gray-500 text-sm">
            Connect to Supabase to manage properties and lifestyle data
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
