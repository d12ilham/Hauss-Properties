
// Mock API service to simulate fetching property data
// In a real application, this would make actual API calls

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

// Mock data that simulates API response
const mockPropertyData: PropertyData = {
  id: "1",
  address: "36 Tweedale Street, Graceville",
  suburb: "Graceville",
  postcode: "QLD 4075",
  agency: "Hauss Realty",
  images: [
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=800&q=80"
  ],
  specs: {
    bedrooms: 3,
    bathrooms: 2,
    parking: 2,
    landSize: "450 SQM"
  },
  documents: [
    { name: "Property Report", url: "#" },
    { name: "Building Inspection", url: "#" },
    { name: "Pest Control Report", url: "#" },
    { name: "Contract of Sale", url: "#" },
    { name: "Floor Plan", url: "#" },
    { name: "Title Deed", url: "#" },
    { name: "Survey Report", url: "#" },
    { name: "Council Rates", url: "#" },
    { name: "Drainage Report", url: "#" },
    { name: "Energy Certificate", url: "#" },
    { name: "Insurance Valuation", url: "#" },
    { name: "Strata Documents", url: "#" }
  ],
  highlight: "Post-war Cottage Packed with Potential",
  description: [
    "Welcome to 36 Tweedale Street—an easy living Graceville gem with loads of charm and even more potential. Situated on a 506m² block with side access, this sweet post-war cottage is neat as a pin and full of character, from the polished timber floors to the big backyard with space to play or unwind. Whether you're just starting out, looking to downsize or seeking a solid foundation to create your dream residence (STCA) this property delivers endless possibilities.",
    "Step inside to find a light-filled air-conditioned living area, perfect for relaxing or entertaining and there's even a study space for working from home. The contemporary galley style kitchen has everything you need —a gas cooktop and electric oven plus a dishwasher and lots of storage. Two bedrooms, each one with built-in robes and ceiling fans are cleverly separated by the bathroom and the laundry has a handy second toilet. Out the back, you'll find a large covered patio, lush lawns and established trees and gardens, the extra wide single garage with room for storage or a workbench."
  ],
  features: [
    "Charming post-war cottage on a 506m² block",
    "Beautiful polished timber floors throughout",
    "Air-conditioned living area with study space",
    "Upgraded galley kitchen with gas cooktop and generous storage",
    "Two good-sized bedrooms with ceiling fans and built-in robes",
    "Covered outdoor patio and large backyard with established gardens",
    "Side access to single remote garage with power, lighting and storage space",
    "Rinnai hot water system; laundry with 2nd toilet"
  ],
  locationInfo: "Embrace the vibrant and welcoming way of life that Graceville has to offer. Take a stroll to your choice of lush greenspaces including the ever-popular Graceville Riverside Parklands. Local schools are an easy walk or cycle from your door and St Aidan's Anglican Girls' School and Christ the King Primary are both a short drive away. This central address also places you just moments from a diverse selection of restaurant, cafes and boutique shopping with major retailers at Indooroopilly Shopping Centre less than 4km from home.",
  lifestyle: [
    {
      image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=500&q=80",
      title: "Local Park",
      description: "Sherwood Arboretum - Beautiful green space for walks and recreation"
    },
    {
      image: "https://images.unsplash.com/photo-1489599904593-130ba0eba1cd?auto=format&fit=crop&w=500&q=80",
      title: "Local Cinema",
      description: "Regent Cinemas - Premium movie experience with latest releases"
    },
    {
      image: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=500&q=80",
      title: "Local Café",
      description: "Hunter & Scout - Artisan coffee and delicious brunch options"
    },
    {
      image: "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=500&q=80",
      title: "Sports Club",
      description: "Western Suburbs District Cricket Club - Local cricket and community"
    }
  ],
  agent: {
    name: "Charles Wiggett",
    agency: "Hauss Realty",
    applyUrl: "https://www.hauss.com.au/expression-of-interest/"
  }
};

export const fetchPropertyData = async (id: string): Promise<PropertyData> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  console.log(`Fetching property data for ID: ${id}`);
  
  // In a real application, this would fetch from your API
  // For now, return mock data regardless of ID
  return mockPropertyData;
};

// This function would integrate with Supabase to fetch Location & Lifestyle data
export const fetchSupabaseData = async (propertyId: string) => {
  // This is where you would connect to Supabase
  // For now, returning mock data
  console.log(`Would fetch Supabase data for property: ${propertyId}`);
  
  return {
    location: {
      suburb: "Graceville",
      postcode: "QLD 4075"
    },
    lifestyle: [
      {
        title: "Local Park",
        description: "Sherwood Arboretum - Beautiful green space"
      }
    ]
  };
};
