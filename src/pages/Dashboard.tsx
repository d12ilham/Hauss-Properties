
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, Property } from '@/services/apiService';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      if (!apiService.isAuthenticated()) {
        navigate('/auth');
        return;
      }
      
      const currentUser = apiService.getCurrentUser();
      setUser(currentUser);
      
      try {
        // Fetch properties from API
        const fetchedProperties = await apiService.getAllProperties();
        setProperties(fetchedProperties);
      } catch (error) {
        console.error('Error fetching properties:', error);
        toast({
          title: "Error",
          description: "Failed to load properties",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate, toast]);

  const handleLogout = () => {
    apiService.logout();
    navigate('/');
  };

  const downloadQR = (propertyName: string) => {
    const qrText = encodeURIComponent(`Property: ${propertyName}`);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrText}`;
    
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `QR_${propertyName.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Success",
      description: `QR code downloaded for ${propertyName}`,
    });
  };

  const uploadDocument = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.pdf,.doc,.docx,.jpg,.png';
    
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        const fileNames = Array.from(files).map(f => f.name).join(', ');
        toast({
          title: "Files Selected",
          description: `${files.length} document(s) selected: ${fileNames}`,
        });
      }
    };
    
    input.click();
  };

  const toggleStatus = (propertyId: number) => {
    setProperties(prev => 
      prev.map(prop => 
        prop.id === propertyId 
          ? { ...prop, active: !prop.active }
          : prop
      )
    );
    
    const property = properties.find(p => p.id === propertyId);
    const newStatus = !property?.active;
    
    toast({
      title: "Status Updated",
      description: `Property ${newStatus ? 'enabled' : 'disabled'} successfully`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-5">
      <div className="max-w-6xl mx-auto bg-white border border-black">
        <div className="bg-black text-white p-8 text-center">
          <div className="flex justify-between items-center mb-4">
            <div></div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Property Management Dashboard</h1>
              <p className="text-lg opacity-90">Manage inspections, documents, and property status</p>
            </div>
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="bg-white text-black hover:bg-gray-100"
            >
              Logout
            </Button>
          </div>
        </div>
        
        <div className="divide-y divide-black">
          {properties.map((property) => {
            const address = `${property.street_number} ${property.street}, ${property.suburb} ${property.state} ${property.postcode}`;
            const nextInspection = property.inspection_times && property.inspection_times.length > 0 
              ? property.inspection_times[0] 
              : 'TBA';
            
            return (
              <div 
                key={property.id}
                className="p-6 hover:bg-gray-50 transition-colors duration-300 flex items-center justify-between gap-5"
              >
                <div className="flex items-center gap-5 flex-1">
                  <div className="w-80">
                    <h3 className="text-lg font-semibold text-black truncate">
                      {address}
                    </h3>
                  </div>
                  <div className="w-48">
                    <p className="text-black text-sm">
                      Next Inspection: {nextInspection}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3 w-96 justify-end">
                  <Button
                    onClick={() => downloadQR(property.property_name)}
                    variant="outline"
                    size="sm"
                    className="border-black text-black hover:bg-black hover:text-white w-28"
                  >
                    Download QR
                  </Button>
                  
                  <Button
                    onClick={uploadDocument}
                    variant="outline"
                    size="sm"
                    className="border-black text-black hover:bg-black hover:text-white w-32"
                  >
                    Add Location & Lifestyle
                  </Button>
                  
                  <Button
                    onClick={() => toggleStatus(property.id)}
                    variant="outline"
                    size="sm"
                    className={`border-black w-24 transition-all ${
                      property.active 
                        ? 'bg-black text-white hover:bg-white hover:text-black' 
                        : 'bg-white text-black hover:bg-black hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      <span 
                        className={`w-2 h-2 rounded-full ${
                          property.active ? 'bg-white' : 'bg-black border border-black'
                        }`}
                      />
                      {property.active ? 'Enabled' : 'Disabled'}
                    </span>
                  </Button>
                </div>
              </div>
            );
          })}
          
          {properties.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              No properties found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
