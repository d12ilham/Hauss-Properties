
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Property {
  id: string;
  address: string;
  inspectionDate: string;
  enabled: boolean;
}

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([
    { id: '1', address: '123 Oak Street, Melbourne VIC 3000', inspectionDate: 'June 25, 2025', enabled: true },
    { id: '2', address: '456 Pine Avenue, Sydney NSW 2000', inspectionDate: 'July 2, 2025', enabled: false },
    { id: '3', address: '789 Maple Road, Brisbane QLD 4000', inspectionDate: 'June 30, 2025', enabled: true },
    { id: '4', address: '321 Cedar Lane, Perth WA 6000', inspectionDate: 'July 5, 2025', enabled: true },
    { id: '5', address: '654 Birch Street, Adelaide SA 5000', inspectionDate: 'July 8, 2025', enabled: false },
    { id: '6', address: '987 Elm Court, Hobart TAS 7000', inspectionDate: 'July 12, 2025', enabled: true },
  ]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }
      
      setUser(session.user);
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const downloadQR = (address: string) => {
    const qrText = encodeURIComponent(`Property: ${address}`);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrText}`;
    
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `QR_${address.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Success",
      description: `QR code downloaded for ${address}`,
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

  const toggleStatus = (propertyId: string) => {
    setProperties(prev => 
      prev.map(prop => 
        prop.id === propertyId 
          ? { ...prop, enabled: !prop.enabled }
          : prop
      )
    );
    
    const property = properties.find(p => p.id === propertyId);
    const newStatus = !property?.enabled;
    
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
          {properties.map((property) => (
            <div 
              key={property.id}
              className="p-6 hover:bg-gray-50 transition-colors duration-300 flex items-center justify-between gap-5"
            >
              <div className="flex items-center gap-5 flex-1">
                <div className="w-80">
                  <h3 className="text-lg font-semibold text-black truncate">
                    {property.address}
                  </h3>
                </div>
                <div className="w-48">
                  <p className="text-black text-sm">
                    Next Inspection: {property.inspectionDate}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 w-96 justify-end">
                <Button
                  onClick={() => downloadQR(property.address)}
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
                    property.enabled 
                      ? 'bg-black text-white hover:bg-white hover:text-black' 
                      : 'bg-white text-black hover:bg-black hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <span 
                      className={`w-2 h-2 rounded-full ${
                        property.enabled ? 'bg-white' : 'bg-black border border-black'
                      }`}
                    />
                    {property.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
