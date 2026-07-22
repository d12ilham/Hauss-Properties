import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiService, Property } from "@/services/apiService";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import clsx from "clsx";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      if (!apiService.isAuthenticated()) {
        navigate("/auth");
        return;
      }

      const currentUser = apiService.getCurrentUser();
      setUser(currentUser);

      try {
        const fetchedProperties = await apiService.getAllProperties();
        console.log("fetchedProperties", fetchedProperties);
        setProperties(fetchedProperties);
      } catch (error) {
        console.error("Failed to fetch properties", error);
        toast({ title: "Error fetching properties" });
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = () => {
    apiService.logout();
    navigate("/");
  };

  const downloadHighResQRCode = (
    base64: string,
    filename = "qr_code.png",
    scale = 4,
    propertyName: string
  ) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const width = img.width * scale;
      const height = img.height * scale;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Disable image smoothing for sharp edges
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, width, height);

      const highResDataUrl = canvas.toDataURL("image/png");

      const link = document.createElement("a");
      link.href = highResDataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: `QR code downloaded successfully`,
      });
    };
  };

  const toggleStatus = (propertyId: number) => {
    setProperties((prev) =>
      prev.map((prop) =>
        prop.id === propertyId ? { ...prop, active: !prop.active } : prop
      )
    );

    const property = properties.find((p) => p.id === propertyId);
    const newStatus = !property?.active;

    toast({
      title: "Status Updated",
      description: `Property ${
        newStatus ? "enabled" : "disabled"
      } successfully`,
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
    <div className="h-screen bg-customPutty flex p-2 gap-3">
      <div className="w-full bg-white overflow-y-auto rounded-3xl">
        <div className="bg-customNavy text-white p-10 text-center rounded-3xl">
          <div className="flex justify-between items-center flex-col md:flex-row gap-5">
            <div>
              <img
                src="/hauss-logo.png"
                alt="Logo"
                className="w-full h-16 object-contain rounded-full"
              />
            </div>
            <div>
              <h1 className="text-2xl font-medium mb-2">
                Property Management Dashboard
              </h1>
              <span>{user?.email}</span>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="bg-customOrange text-wh hover:bg-gray-100 py-2 px-7 rounded-lg transition-colors duration-300 flex-grow-0"
            >
              Logout
            </Button>
          </div>
        </div>
        <div>
          <div className="my-4 px-3">
            <input
              type="text"
              placeholder="Search by address or suburb..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-400 bg-customWhite placeholder-customNavy rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-customNavy focus:border-transparent"
            />
          </div>

          <div className="px-3">
            {properties
              .filter((property) => {
                const address = `${property.sub_number} ${property.street_number} ${property.street} ${property.suburb} ${property.state} ${property.postcode}`;
                return address.toLowerCase().includes(searchTerm.toLowerCase());
              })
              .map((property) => {
                const subNumber = property.sub_number
                  ? `${property.sub_number}/`
                  : "";
                const address = `${subNumber}${property.street_number} ${property.street}, ${property.suburb} ${property.state} ${property.postcode}`;
                const nextInspection =
                  property.inspection_times &&
                  property.inspection_times.length > 0
                    ? property.inspection_times[0]
                    : "TBA";

                return (
                  <div
                    key={property.id}
                    className="p-4 hover:bg-gray-50 transition-colors duration-300 my-3 flex flex-col md:flex-row md:items-center items-stretch justify-between gap-5 bg-customWhite rounded-xl"
                  >
                    <div className="flex items-center gap-5">
                      {property?.gallery?.[0]?.url && (
                        <img
                          src={property.gallery[0].url}
                          alt="Property preview"
                          className="w-32 h-24 object-contain rounded-xl shadow-md bg-white"
                        />
                      )}
                      <div>
                        <h3 className="font-medium text-customNavy">
                          {address}
                        </h3>
                        <p className="text-black text-sm mt-2">
                          Next Inspection:
                          <br /> {nextInspection}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end items-center flex-wrap">
                      <a
                        href={`/property/${property.property_id}`}
                        target="_blank"
                        className="border border-customNavy text-customNavy hover:bg-customNavy hover:text-customWhite px-6 py-2 rounded-lg transition-colors duration-300 font-medium bg-white text-sm"
                      >
                        View
                      </a>
                      <a
                        href={`/dashboard/property/${property.property_id}`}
                        className="border border-customNavy text-customNavy hover:bg-customNavy hover:text-customWhite px-6 py-2 rounded-lg transition-colors duration-300 font-medium bg-white text-sm"
                      >
                        Edit
                      </a>
                      <Button
                        onClick={() =>
                          downloadHighResQRCode(
                            property.qr_code,
                            `${
                              property.street_number +
                              "_" +
                              property.street +
                              "_" +
                              property.suburb
                            }_qr.png`,
                            6,
                            property.property_name
                          )
                        }
                        variant="outline"
                        size="sm"
                        className="border border-customNavy text-customNavy hover:bg-customNavy hover:text-customWhite px-4 py-2 rounded-lg transition-colors duration-300 font-medium bg-white text-sm"
                      >
                        Download QR
                      </Button>

                      <div className="flex items-center gap-2 w-16 justify-end">
                        <Switch
                          checked={property.active === 1}
                          onCheckedChange={async (checked) => {
                            try {
                              const updatedProperties = properties.map((p) =>
                                p.id === property.id
                                  ? { ...p, active: checked ? 1 : 0 }
                                  : p
                              );
                              setProperties(updatedProperties);
                              await apiService.updatePropertyStatus(
                                property.property_id,
                                checked
                              );
                              toast({
                                title: "Success",
                                description: `Property is now ${
                                  checked ? "Active" : "Inactive"
                                }`,
                              });
                            } catch (err) {
                              toast({
                                title: "Error",
                                description: "Failed to update property status",
                              });
                              console.error("Status update failed", err);
                            }
                          }}
                          className={clsx(
                            "shrink-0",
                            "data-[state=checked]:bg-green-500",
                            "data-[state=unchecked]:bg-red-500"
                          )}
                        />
                      </div>
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
    </div>
  );
};

export default Dashboard;
