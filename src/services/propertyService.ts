import { apiService, Property } from "./apiService";

export interface PropertyData {
  id: string;
  address: string;
  suburb: string;
  postcode: string;
  agency: string;
  agencyNumber: string;
  images: { url: string }[];
  specs: {
    bedrooms: number;
    bathrooms: number;
    parking: number;
    landSize: string;
  };
  active: boolean;
  documents: Array<{
    title: string;
    url: string;
  }>;
  highlight: string;
  description: string[];
  features: PropertyFeatures;

  locationInfo: string;
  lifestyle: Array<{
    url: string;
    title: string;
    description: string;
    type: "image" | "video";
  }>;
  agent: {
    name: string;
    agency: string;
    agencyNumber: string;
    applyUrl: string;
  };
}

interface PropertyFeatures {
  bedrooms?: number;
  bathrooms?: number;
  garages?: number;
}

// Transform API property data to match the expected PropertyData interface
const transformPropertyData = (property: Property): PropertyData => {
  const subNumber = property.sub_number ? `${property.sub_number}/` : "";
  const address = `${subNumber}${property.street_number} ${property.street}, ${property.suburb}`;
  const postcode = `${property.state} ${property.postcode}`;

  const features = property.features as PropertyFeatures;

  return {
    id: property.property_id,
    address,
    suburb: property.suburb,
    postcode,
    active: property.active,
    agency: property.listing_agent || "Unknown Agency",
    agencyNumber: property.contact_agent || "Unknown Agent",
    images: property.gallery || [],
    specs: {
      bedrooms: features?.bedrooms,
      bathrooms: features?.bathrooms,
      parking: features?.garages,
      landSize: property.land_area
        ? `${property.land_area} ${
            property.land_area_unit == "squareMeter" ? "SQM" : ""
          }`
        : "",
    },
    documents: property?.property_documents || [
      { title: "Property Report", url: "#" },
      { title: "Building Inspection", url: "#" },
      { title: "Pest Control Report", url: "#" },
      { title: "Contract of Sale", url: "#" },
      { title: "Floor Plan", url: "#" },
      { title: "Title Deed", url: "#" },
    ],
    highlight: property.property_name || "Beautiful Property",
    description: property.description
      ? [property.description]
      : ["Beautiful property with great potential."],
    features,
    locationInfo:
      "Great location with excellent amenities and transport links.",
    lifestyle: property.lifestyle_assets || [
      {
        image:
          "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=500&q=80",
        title: "Local Park",
        description: "Beautiful green space for walks and recreation",
      },
      {
        image:
          "https://images.unsplash.com/photo-1489599904593-130ba0eba1cd?auto=format&fit=crop&w=500&q=80",
        title: "Local Cinema",
        description: "Premium movie experience with latest releases",
      },
    ],
    agent: {
      name: property.listing_agent || "Property Agent",
      agency: property.listing_agent || "Real Estate Agency",
      agencyNumber: property.contact_agent,
      applyUrl: "#",
    },
  };
};

export const fetchPropertyData = async (
  propertyId: string
): Promise<PropertyData> => {
  console.log("Fetching property data for ID:", propertyId);

  try {
    const property = await apiService.getProperty(propertyId);

    console.log("property fetched", property);
    return transformPropertyData(property);
  } catch (error) {
    console.error("Error fetching property data:", error);
    throw error;
  }
};

export const fetchAllProperties = async (): Promise<Property[]> => {
  try {
    return await apiService.getAllProperties();
  } catch (error) {
    console.error("Error fetching all properties:", error);
    throw error;
  }
};
