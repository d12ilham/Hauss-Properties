
import { apiService, Property } from './apiService';

export interface PropertyData {
  id: string;
  address: string;
  suburb: string;
  postcode: string;
  agency: string;
  logo?: string;
  images: string[];
  specs: {
    bedrooms: number;
    bathrooms: number;
    parking: number;
    landSize: string;
  };
  documents: Array<{
    name: string;
    url: string;
  }>;
  highlight: string;
  description: string[];
  features: string[];
  locationInfo: string;
  lifestyle: Array<{
    image: string;
    title: string;
    description: string;
  }>;
  agent: {
    name: string;
    agency: string;
    applyUrl: string;
  };
}

// Transform API property data to match the expected PropertyData interface
const transformPropertyData = (property: Property): PropertyData => {
  const address = `${property.street_number} ${property.street}, ${property.suburb}`;
  const postcode = `${property.state} ${property.postcode}`;
  
  return {
    id: property.property_id,
    address,
    suburb: property.suburb,
    postcode,
    agency: property.listing_agent || 'Unknown Agency',
    images: property.gallery || [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=800&q=80"
    ],
    specs: {
      bedrooms: 3, // Default values since not in API
      bathrooms: 2,
      parking: 2,
      landSize: property.land_area ? `${property.land_area} ${property.land_area_unit || 'SQM'}` : '450 SQM'
    },
    documents: property.property_documents || [
      { name: "Property Report", url: "#" },
      { name: "Building Inspection", url: "#" },
      { name: "Pest Control Report", url: "#" },
      { name: "Contract of Sale", url: "#" },
      { name: "Floor Plan", url: "#" },
      { name: "Title Deed", url: "#" }
    ],
    highlight: property.property_name || "Beautiful Property",
    description: property.description ? [property.description] : ["Beautiful property with great potential."],
    features: property.features || [
      "Beautiful location",
      "Great investment opportunity",
      "Close to amenities"
    ],
    locationInfo: "Great location with excellent amenities and transport links.",
    lifestyle: property.lifestyle_assets || [
      {
        image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=500&q=80",
        title: "Local Park",
        description: "Beautiful green space for walks and recreation"
      },
      {
        image: "https://images.unsplash.com/photo-1489599904593-130ba0eba1cd?auto=format&fit=crop&w=500&q=80",
        title: "Local Cinema",
        description: "Premium movie experience with latest releases"
      }
    ],
    agent: {
      name: property.listing_agent || "Property Agent",
      agency: property.listing_agent || "Real Estate Agency",
      applyUrl: "#"
    }
  };
};

export const fetchPropertyData = async (propertyId: string): Promise<PropertyData> => {
  console.log('Fetching property data for ID:', propertyId);
  
  try {
    const property = await apiService.getProperty(propertyId);
    return transformPropertyData(property);
  } catch (error) {
    console.error('Error fetching property data:', error);
    throw error;
  }
};

export const fetchAllProperties = async (): Promise<Property[]> => {
  try {
    return await apiService.getAllProperties();
  } catch (error) {
    console.error('Error fetching all properties:', error);
    throw error;
  }
};
