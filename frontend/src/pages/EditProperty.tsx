import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { BedDouble, Bath, CarFront, X, Upload, MoveLeft } from "lucide-react";
import { apiService } from "../services/apiService";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import clsx from "clsx";

const MAX_LIFESTYLE_ASSETS = 10; // Set your max file limit here
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB max file size
const ACCEPTED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "video/mp4",
  "video/quicktime",
];

const EditProperty = () => {
  const { id } = useParams();
  const [galleryImages, setGalleryImages] = useState([]);
  const [lifestyleAssets, setLifestyleAssets] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [isActive, setIsActive] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const baseURL = import.meta.env.VITE_BACKEND_URL;

  const form = useForm({
    defaultValues: {
      property_name: "",
      sub_number: "",
      street_number: "",
      street: "",
      suburb: "",
      state: "",
      postcode: "",
      country: "Australia",
      description: "",
      listing_agent: "",
      contact_agent: "",
      land_area: "",
      land_area_unit: "squareMeter",
      bedrooms: 0,
      bathrooms: 0,
      garages: 0,
      active: true,
    },
  });

  const {
    data: property,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["property", id],
    queryFn: () => apiService.getProperty(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (property) {
      form.reset({
        property_name: property.property_name || "",
        sub_number: property.sub_number || "N/A",
        street_number: property.street_number || "",
        street: property.street || "",
        suburb: property.suburb || "",
        state: property.state || "",
        postcode: property.postcode || "",
        country: property.country || "Australia",
        description: property.description || "",
        listing_agent: property.listing_agent || "",
        contact_agent: property.contact_agent || "",
        land_area: property.land_area?.toString() || "",
        land_area_unit: property.land_area_unit || "squareMeter",
        bedrooms: property.features?.bedrooms || 0,
        bathrooms: property.features?.bathrooms || 0,
        garages: property.features?.garages || 0,
        active: property.active !== false,
      });
      setGalleryImages(property.gallery || []);
      setLifestyleAssets(
        property.lifestyle_assets?.map((asset) => ({
          ...asset,
          file: null,
          id: asset.id || `${Date.now()}-${Math.random()}`,
        })) || []
      );
    }
  }, [property, form]);

  useEffect(() => {
    if (property?.active !== undefined) {
      setIsActive(property.active === 1);
    }
  }, [property]);

  const changeStatus = async (checked: boolean) => {
    try {
      await apiService.updatePropertyStatus(
        property.property_id,
        checked ? 1 : 0
      );
      toast({
        title: "Status updated",
        description: `Property is now ${checked ? "active" : "inactive"}.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update status.",
        variant: "destructive",
      });
      setIsActive((prev) => !prev);
    }
  };

  const handleImageUpload = (event, type) => {
    setUploadError(""); // Clear previous errors

    const files = Array.from(event.target.files);

    // Check if adding these files would exceed the max limit
    if (lifestyleAssets.length + files.length > MAX_LIFESTYLE_ASSETS) {
      setUploadError(
        `You can upload a maximum of ${MAX_LIFESTYLE_ASSETS} files in total.`
      );
      return;
    }

    // Validate each file
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(
          `File ${file.name} exceeds the maximum size of ${
            MAX_FILE_SIZE / 1024 / 1024
          }MB`
        );
        return;
      }

      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        setUploadError(
          `File ${file.name} has an unsupported file type. Only images (JPEG, PNG, GIF) and videos (MP4, MOV) are allowed.`
        );
        return;
      }
    }

    // Process valid files
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newItem = {
          id: `${Date.now()}-${Math.random()}`,
          url: e.target.result,
          type: file.type.startsWith("video/") ? "video" : "image",
          title: "",
          description: "",
          file: file,
        };

        setLifestyleAssets((prev) => [...prev, newItem]);
      };
      reader.readAsDataURL(file);
    });

    // Clear the file input
    event.target.value = null;
  };

  const removeItem = (index) => {
    setLifestyleAssets((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLifestyleAsset = (index, field, value) => {
    setLifestyleAssets((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const onSubmit = async (data) => {
    // if (lifestyleAssets.length === 0) {
    //   setUploadError("Please upload at least one lifestyle asset");
    //   return;
    // }

    setIsSubmitting(true);

    try {
      const formData = new FormData();

      property?.lifestyle_assets?.forEach((originalAsset) => {
        const matchingAsset = lifestyleAssets.find(
          (a) => a.id === originalAsset.id && !a.file
        );

        const keep = !!matchingAsset;
        formData.append(
          `keep_asset_${originalAsset.id}`,
          keep ? "true" : "false"
        );

        if (keep) {
          formData.append(
            `existing_title_${originalAsset.id}`,
            matchingAsset.title || ""
          );
          formData.append(
            `existing_description_${originalAsset.id}`,
            matchingAsset.description || ""
          );
        }
      });

      let uploadIndex = 0;
      lifestyleAssets.forEach((asset) => {
        if (asset.file) {
          formData.append("assets", asset.file);
          formData.append(`new_title_${uploadIndex}`, asset.title || "");
          formData.append(
            `new_description_${uploadIndex}`,
            asset.description || ""
          );
          uploadIndex++;
        }
      });

      await apiService.updateProperty(id, formData);

      toast({
        title: "Success",
        description: "Property lifestyle assets updated successfully!",
      });

      window.location.reload();
    } catch (error) {
      console.error("Error updating property:", error);
      toast({
        title: "Error",
        description: "Failed to update property. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-customWhite">
        <div className="text-lg">Loading property details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-customWhite">
        <div className="text-lg text-red-600">
          Error loading property details
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-customWhite">
      <div className="max-w-7xl mx-auto p-5">
        <div className="bg-customNavy text-customWhite px-8 py-12 rounded-3xl mb-6 shadow-md flex justify-between items-center gap-10">
          <div>
            <Link to="/dashboard/" className="mb-5 flex gap-2 items-center">
              <MoveLeft /> Back
            </Link>

            <h1 className="text-4xl mb-2 font-medium leading-[1.4em]">
              {property?.property_name}
            </h1>
            <p className="my-4">Update lifestyle assets for this property</p>
            <a
              href={`/property/${property?.property_id}`}
              className="text-customOrange hover:underline inline-block font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              View Property
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={isActive}
              onCheckedChange={async (checked) => {
                setIsActive(checked);
                await changeStatus(checked);
              }}
              className={clsx(
                "data-[state=checked]:bg-green-500",
                "data-[state=unchecked]:bg-red-500"
              )}
            />
            <span>{isActive ? "Active" : "Inactive"}</span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information - Disabled */}
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle className="text-customNavy font-medium">
                  Basic Information (Read Only)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="property_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Name</FormLabel>
                      <FormControl>
                        <Input {...field} disabled className="bg-gray-100" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="listing_agent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Listing Agent</FormLabel>
                      <FormControl>
                        <Input {...field} disabled className="bg-gray-100" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_agent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agent Contact</FormLabel>
                      <FormControl>
                        <Input {...field} disabled className="bg-gray-100" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={4}
                          disabled
                          className="bg-gray-100"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Address Information - Disabled */}
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle className="text-customNavy font-medium">
                  Address (Read Only)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="sub_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apartment Number</FormLabel>
                        <FormControl>
                          <Input {...field} disabled className="bg-gray-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="street_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Number</FormLabel>
                        <FormControl>
                          <Input {...field} disabled className="bg-gray-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street</FormLabel>
                        <FormControl>
                          <Input {...field} disabled className="bg-gray-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="suburb"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Suburb</FormLabel>
                        <FormControl>
                          <Input {...field} disabled className="bg-gray-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input {...field} disabled className="bg-gray-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="postcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postcode</FormLabel>
                        <FormControl>
                          <Input {...field} disabled className="bg-gray-100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input {...field} disabled className="bg-gray-100" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Property Specifications - Disabled */}
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle className="text-customNavy font-medium">
                  Property Specifications (Read Only)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="bedrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <BedDouble className="w-4 h-4" />
                          Bedrooms
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            disabled
                            className="bg-gray-100"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bathrooms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Bath className="w-4 h-4" />
                          Bathrooms
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            disabled
                            className="bg-gray-100"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="garages"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <CarFront className="w-4 h-4" />
                          Garages
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            disabled
                            className="bg-gray-100"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="land_area"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Land Area</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            disabled
                            className="bg-gray-100"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="land_area_unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Land Area Unit</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled
                        >
                          <FormControl>
                            <SelectTrigger className="bg-gray-100">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="squareMeter">
                              Square Meters
                            </SelectItem>
                            <SelectItem value="acre">Acres</SelectItem>
                            <SelectItem value="hectare">Hectares</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Gallery Images - Read Only with Vertical Scroll */}
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle className="text-customNavy font-medium">
                  Gallery Images (Read Only)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto">
                  <div className="flex gap-4 mb-6 justify-start px-4">
                    {galleryImages.map((image, index) => (
                      <img
                        key={index}
                        src={image.url}
                        alt={`Property view ${index + 1}`}
                        className="flex-shrink-0 min-w-[300px] max-w-[400px] h-64 object-cover rounded-lg shadow-md transition-transform duration-300 hover:scale-105 cursor-pointer"
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lifestyle Assets - Editable */}
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle className="text-customNavy font-medium">
                  Lifestyle Assets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="lifestyle-upload"
                      className="cursor-pointer"
                    >
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-customOrange transition-colors">
                        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-sm text-gray-600">
                          Click to upload lifestyle images/videos (Max{" "}
                          {MAX_LIFESTYLE_ASSETS} files)
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Supported formats: JPEG, PNG, GIF, MP4, MOV (Max{" "}
                          {MAX_FILE_SIZE / 1024 / 1024}MB each)
                        </p>
                      </div>
                    </Label>
                    <input
                      id="lifestyle-upload"
                      type="file"
                      multiple
                      accept={ACCEPTED_FILE_TYPES.join(",")}
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, "lifestyle")}
                    />
                    {uploadError && (
                      <p className="text-red-500 text-sm mt-2">{uploadError}</p>
                    )}
                    <div className="text-sm text-gray-500 mt-2">
                      {lifestyleAssets.length} of {MAX_LIFESTYLE_ASSETS} files
                      uploaded
                    </div>
                  </div>

                  <div className="space-y-4">
                    {lifestyleAssets.map((asset, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex gap-4 flex-col md:flex-row">
                          <div className="flex-shrink-0">
                            {asset.type === "video" ? (
                              <video
                                src={
                                  asset.url.startsWith("data")
                                    ? asset.url
                                    : baseURL + asset.url
                                }
                                className="w-32 h-24 object-cover rounded"
                                controls
                              />
                            ) : (
                              <img
                                src={
                                  asset.url.startsWith("data")
                                    ? asset.url
                                    : baseURL + asset.url
                                }
                                alt={asset.title}
                                className="w-32 h-24 object-cover rounded"
                              />
                            )}
                          </div>
                          <div className="flex-1 space-y-3">
                            <div>
                              <Label>Title</Label>
                              <Input
                                value={asset.title || ""}
                                onChange={(e) =>
                                  updateLifestyleAsset(
                                    index,
                                    "title",
                                    e.target.value
                                  )
                                }
                                placeholder="Enter title"
                              />
                            </div>
                            <div>
                              <Label>Description</Label>
                              <Textarea
                                value={asset.description || ""}
                                onChange={(e) =>
                                  updateLifestyleAsset(
                                    index,
                                    "description",
                                    e.target.value
                                  )
                                }
                                placeholder="Enter description"
                                rows={2}
                              />
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="h-8 w-8"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                className="bg-customNavy hover:bg-customNavy/90 text-white px-8 h-12 rounded-xl"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Update Property"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default EditProperty;
