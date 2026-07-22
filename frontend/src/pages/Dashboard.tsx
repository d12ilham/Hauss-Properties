import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiService, Property } from "@/services/apiService";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import clsx from "clsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Helper to parse inspection time string for sorting (soonest first)
const parseInspectionTime = (timeStr: string | null | undefined): number => {
  if (!timeStr || typeof timeStr !== "string") return Infinity;
  // Inspection times typically look like "25-Oct-2025 11:00am to 11:30am"
  const cleanStr = timeStr.split(" to ")[0].trim();
  const parts = cleanStr.split(/\s+/);
  if (parts.length < 2) return Infinity;
  const datePart = parts[0];
  const timePart = parts[1];

  const dateParts = datePart.split("-");
  if (dateParts.length !== 3) return Infinity;

  const day = parseInt(dateParts[0], 10);
  const monthStr = dateParts[1].toLowerCase().substring(0, 3);
  const year = parseInt(dateParts[2], 10);

  const months: Record<string, number> = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11,
  };

  if (!(monthStr in months)) return Infinity;
  const month = months[monthStr];

  const match = timePart.toLowerCase().match(/^(\d+):(\d+)(am|pm)$/);
  if (!match) return Infinity;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3];

  if (ampm === "pm" && hours < 12) hours += 12;
  if (ampm === "am" && hours === 12) hours = 0;

  try {
    const d = new Date(year, month, day, hours, minutes);
    return isNaN(d.getTime()) ? Infinity : d.getTime();
  } catch {
    return Infinity;
  }
};

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created-desc");

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
  }, [navigate, toast]);

  const handleLogout = () => {
    apiService.logout();
    navigate("/");
  };

  const downloadHighResQRCode = (
    base64: string,
    filename = "qr_code.png",
    scale = 4,
    propertyName: string,
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
        prop.id === propertyId ? { ...prop, active: !prop.active } : prop,
      ),
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

  // --- Filtering and Sorting Logic ---
  const searchedProperties = properties.filter((property) => {
    const subNumber = property.sub_number ? `${property.sub_number}/` : "";
    const address = `${subNumber}${property.street_number} ${property.street} ${property.suburb} ${property.state} ${property.postcode}`;
    return address.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredProperties = searchedProperties.filter((property) => {
    if (statusFilter === "active")
      return property.active === 1 || property.active === true;
    if (statusFilter === "inactive")
      return property.active === 0 || property.active === false;
    return true;
  });

  const sortedProperties = [...filteredProperties].sort((a, b) => {
    switch (sortBy) {
      case "address-asc": {
        const subA = a.sub_number ? `${a.sub_number}/` : "";
        const addrA = `${subA}${a.street_number} ${a.street}, ${a.suburb} ${a.state} ${a.postcode}`;
        const subB = b.sub_number ? `${b.sub_number}/` : "";
        const addrB = `${subB}${b.street_number} ${b.street}, ${b.suburb} ${b.state} ${b.postcode}`;
        return addrA.localeCompare(addrB);
      }
      case "address-desc": {
        const subA = a.sub_number ? `${a.sub_number}/` : "";
        const addrA = `${subA}${a.street_number} ${a.street}, ${a.suburb} ${a.state} ${a.postcode}`;
        const subB = b.sub_number ? `${b.sub_number}/` : "";
        const addrB = `${subB}${b.street_number} ${b.street}, ${b.suburb} ${b.state} ${b.postcode}`;
        return addrB.localeCompare(addrA);
      }
      case "suburb-asc": {
        const subA = a.suburb || "";
        const subB = b.suburb || "";
        return subA.localeCompare(subB);
      }
      case "inspection-soonest": {
        const timeA =
          a.inspection_times && a.inspection_times.length > 0
            ? a.inspection_times[0]
            : "";
        const timeB =
          b.inspection_times && b.inspection_times.length > 0
            ? b.inspection_times[0]
            : "";
        const valA = parseInspectionTime(timeA);
        const valB = parseInspectionTime(timeB);
        return valA - valB;
      }
      case "created-desc": {
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        return timeB - timeA;
      }
      case "created-asc": {
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        return timeA - timeB;
      }
      default:
        return 0;
    }
  });

  // --- Pagination Slice ---
  const ITEMS_PER_PAGE = 20;
  const totalItems = sortedProperties.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const activePage = Math.min(currentPage, Math.max(1, totalPages));
  const paginatedProperties = sortedProperties.slice(
    (activePage - 1) * ITEMS_PER_PAGE,
    activePage * ITEMS_PER_PAGE,
  );

  const startItem =
    totalItems === 0 ? 0 : (activePage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(totalItems, activePage * ITEMS_PER_PAGE);

  // Pagination page selector sliding window (max 5 buttons visible)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, activePage - 2);
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
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
          {/* Search bar */}
          <div className="my-4 px-3">
            <input
              type="text"
              placeholder="Search by address or suburb..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2.5 border border-gray-400 bg-customWhite placeholder-customNavy rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-customNavy focus:border-transparent"
            />
          </div>

          {/* Filters & Sorting Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 px-3">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-customNavy uppercase tracking-wider">
                  Status Filter
                </span>
                <Select
                  value={statusFilter}
                  onValueChange={(val) => {
                    setStatusFilter(val);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[180px] bg-white border-gray-400 rounded-xl text-customNavy focus:ring-customNavy font-medium">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-customNavy uppercase tracking-wider">
                  Sort By
                </span>
                <Select
                  value={sortBy}
                  onValueChange={(val) => {
                    setSortBy(val);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[240px] bg-white border-gray-400 rounded-xl text-customNavy focus:ring-customNavy font-medium">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    <SelectItem value="address-asc">Address (A-Z)</SelectItem>
                    <SelectItem value="address-desc">Address (Z-A)</SelectItem>
                    <SelectItem value="suburb-asc">Suburb (A-Z)</SelectItem>
                    <SelectItem value="inspection-soonest">
                      Next Inspection (Soonest)
                    </SelectItem>
                    <SelectItem value="created-desc">
                      Date Created (Newest first)
                    </SelectItem>
                    <SelectItem value="created-asc">
                      Date Created (Oldest first)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="text-sm text-customNavy self-start md:self-end bg-customWhite py-2 px-4 rounded-xl border border-gray-200">
              Showing {startItem}-{endItem} of {totalItems} properties
            </div>
          </div>

          {/* Property List */}
          <div className="px-3">
            {paginatedProperties.map((property) => {
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
                      <h3 className="font-medium text-customNavy">{address}</h3>
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
                          property.property_name,
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
                                : p,
                            );
                            setProperties(updatedProperties);
                            await apiService.updatePropertyStatus(
                              property.property_id,
                              checked,
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
                          "data-[state=unchecked]:bg-red-500",
                        )}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredProperties.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                No properties found
              </div>
            )}

            {/* Pagination UI Controls */}
            {totalPages > 1 && (
              <Pagination className="my-6">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (activePage > 1) setCurrentPage(activePage - 1);
                      }}
                      className={
                        activePage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>

                  {getPageNumbers().map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        href="#"
                        isActive={activePage === page}
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(page);
                        }}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (activePage < totalPages)
                          setCurrentPage(activePage + 1);
                      }}
                      className={
                        activePage === totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
