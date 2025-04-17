
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Check, ArrowRight, MapPin, Car, Building, Clock, CreditCard, Calendar as CalendarIcon2, User, Phone } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { motion } from "framer-motion";

type Area = {
  area_id: string;
  area_name: string;
  latitude: number | null;
  longitude: number | null;
};

type ParkingSlot = {
  slot_id: string;
  area_id: string;
  status: string | null;
};

const Book = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [areas, setAreas] = useState<Area[]>([]);
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingType, setBookingType] = useState<"reserve" | "immediate">("immediate");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [formErrors, setFormErrors] = useState({
    vehicleNumber: false,
    customerName: false,
    contactNumber: false
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  // Fetch all areas when component mounts
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const { data, error } = await supabase.from("areas").select("*");
        if (error) {
          console.error("Error fetching areas:", error);
          throw error;
        }
        if (data) {
          setAreas(data);
          console.log("Areas loaded:", data.length);
        } else {
          console.log("No areas found");
          setAreas([]);
        }
      } catch (error) {
        console.error("Error fetching areas:", error);
        toast.error("Failed to load areas");
      }
    };

    fetchAreas();
  }, []);

  // Fetch available slots when selected area changes
  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedArea) return;
      
      try {
        setLoadingSlots(true);
        const { data, error } = await supabase
          .from("parking_slots")
          .select("*")
          .eq("area_id", selectedArea)
          .eq("status", "available");
          
        if (error) {
          console.error("Error fetching slots:", error);
          throw error;
        }
        
        if (data) {
          setSlots(data);
          console.log("Available slots loaded:", data.length);
        } else {
          console.log("No available slots found");
          setSlots([]);
        }
      } catch (error) {
        console.error("Error fetching slots:", error);
        toast.error("Failed to load available slots");
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedArea]);

  const validateForm = () => {
    const errors = {
      vehicleNumber: !vehicleNumber.trim(),
      customerName: !customerName.trim(),
      contactNumber: !contactNumber.trim()
    };
    
    setFormErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !selectedArea) {
      toast.error("Please select an area");
      return;
    }
    
    if (currentStep === 2 && !selectedSlot) {
      toast.error("Please select a slot");
      return;
    }
    
    if (currentStep === 3 && !selectedDate) {
      toast.error("Please select a date");
      return;
    }
    
    if (currentStep === 4) {
      if (!validateForm()) {
        toast.error("Please fill in all required fields");
        return;
      }
    }
    
    setCurrentStep(currentStep + 1);
  };

  const handlePreviousStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    if (!selectedArea || !selectedSlot || !selectedDate) {
      toast.error("Missing booking information. Please start over.");
      setCurrentStep(1);
      return;
    }
    
    try {
      setIsLoading(true);
      console.log("Starting booking process...");
      
      const { data: existingVehicleData, error: vehicleQueryError } = await supabase
        .from("vehicles")
        .select("*")
        .eq("vehicle_number", vehicleNumber);
      
      if (vehicleQueryError) {
        console.error("Error checking vehicle:", vehicleQueryError);
        throw vehicleQueryError;
      }
      
      if (!existingVehicleData || existingVehicleData.length === 0) {
        console.log("Creating new vehicle record");
        const { error: insertVehicleError } = await supabase
          .from("vehicles")
          .insert([
            {
              vehicle_number: vehicleNumber,
              customer_name: customerName,
              contact_number: contactNumber,
            },
          ]);
        
        if (insertVehicleError) {
          console.error("Error creating vehicle:", insertVehicleError);
          throw insertVehicleError;
        }
      } else {
        console.log("Vehicle already exists");
      }
      
      console.log("Creating booking record");
      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .insert([
          {
            vehicle_number: vehicleNumber,
            slot_id: selectedSlot,
            entry_time: selectedDate.toISOString(),
            status: "booked",
            payment_status: "pending",
            amount_paid: 0
          },
        ])
        .select();
      
      if (bookingError) {
        console.error("Error creating booking:", bookingError);
        throw bookingError;
      }
      
      console.log("Updating slot status");
      const { error: slotError } = await supabase
        .from("parking_slots")
        .update({ status: "booked" })
        .eq("slot_id", selectedSlot);
      
      if (slotError) {
        console.error("Error updating slot status:", slotError);
        throw slotError;
      }
      
      console.log("Booking successful!");
      toast.success(`Booking ${bookingType === "immediate" ? "confirmed" : "reserved"}!`);
      
      // Add a small delay to show the success message before redirecting
      setTimeout(() => {
        navigate("/bookings");
      }, 1500);
      
    } catch (error: any) {
      console.error("Error creating booking:", error);
      toast.error(`Booking failed: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const SlotSelector = () => {
    if (loadingSlots) {
      return (
        <div className="flex items-center justify-center h-60">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    if (slots.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-60 text-center">
          <div className="text-4xl mb-3">😢</div>
          <h3 className="text-xl font-semibold">No slots available</h3>
          <p className="text-muted-foreground mt-2">Please select a different area or try again later.</p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {slots.map((slot) => (
          <motion.div
            key={slot.slot_id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.05 }}
            className="aspect-square"
          >
            <button
              type="button"
              onClick={() => setSelectedSlot(slot.slot_id)}
              className={cn(
                "w-full h-full rounded-lg border-2 transition-all duration-300 flex flex-col items-center justify-center",
                selectedSlot === slot.slot_id
                  ? "border-primary bg-primary/10 shadow-md shadow-primary/20"
                  : "border-border hover:border-primary/50 hover:bg-primary/5"
              )}
            >
              <Car className={cn("h-6 w-6 mb-1", selectedSlot === slot.slot_id ? "text-primary" : "")} />
              <span className={cn("font-medium", selectedSlot === slot.slot_id ? "text-primary" : "")}>
                {slot.slot_id.split("-").pop()}
              </span>
            </button>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                <Label htmlFor="area" className="text-lg">Select Parking Area</Label>
              </div>
              <p className="text-sm text-muted-foreground">Choose the parking area where you want to park your vehicle</p>
              <Select 
                value={selectedArea} 
                onValueChange={value => {
                  setSelectedArea(value);
                  setSelectedSlot("");
                }}
              >
                <SelectTrigger className="w-full h-12">
                  <SelectValue placeholder="Select an area" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((area) => (
                    <SelectItem key={area.area_id} value={area.area_id}>
                      {area.area_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="h-80 flex flex-col items-center justify-center gap-4 border border-border/50 rounded-lg bg-gradient-to-br from-background to-muted/30 p-6">
              {selectedArea ? (
                <>
                  <div className="bg-primary/10 p-4 rounded-full">
                    <MapPin className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">
                    {areas.find(area => area.area_id === selectedArea)?.area_name}
                  </h3>
                  <p className="text-muted-foreground text-center">
                    Please proceed to the next step to select a parking slot in this area.
                  </p>
                </>
              ) : (
                <>
                  <div className="bg-muted/50 p-4 rounded-full">
                    <MapPin className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold">No Area Selected</h3>
                  <p className="text-muted-foreground text-center">
                    Please select a parking area from the dropdown above.
                  </p>
                </>
              )}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-primary" />
                <Label className="text-lg">Select Parking Slot</Label>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Choose an available parking slot</p>
                <button 
                  type="button" 
                  className="text-xs text-primary hover:underline"
                  onClick={() => {
                    setSelectedSlot("");
                    const fetchSlots = async () => {
                      setLoadingSlots(true);
                      try {
                        const { data, error } = await supabase
                          .from("parking_slots")
                          .select("*")
                          .eq("area_id", selectedArea)
                          .eq("status", "available");
                          
                        if (error) throw error;
                        setSlots(data || []);
                      } catch (error) {
                        toast.error("Failed to refresh slots");
                      } finally {
                        setLoadingSlots(false);
                      }
                    };
                    fetchSlots();
                  }}
                >
                  Refresh
                </button>
              </div>
            </div>
            
            <div className="border border-border/50 rounded-lg p-6 min-h-80">
              <SlotSelector />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CalendarIcon2 className="h-5 w-5 text-primary" />
                <Label className="text-lg">Select Date & Time</Label>
              </div>
              <p className="text-sm text-muted-foreground">When do you want to park your vehicle?</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-12",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          initialFocus
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <div className="w-full space-y-2 mt-4">
                  <Label>Booking Type</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <button
                        type="button"
                        onClick={() => setBookingType("immediate")}
                        className={cn(
                          "w-full p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center",
                          bookingType === "immediate"
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className={cn(
                          "rounded-full p-2 mb-2",
                          bookingType === "immediate" ? "bg-primary/20" : "bg-muted"
                        )}>
                          <CreditCard className={cn(
                            "h-5 w-5",
                            bookingType === "immediate" ? "text-primary" : "text-muted-foreground"
                          )} />
                        </div>
                        <span className={cn(
                          "font-medium",
                          bookingType === "immediate" ? "text-primary" : ""
                        )}>
                          Immediate Booking
                        </span>
                        <span className="text-xs text-muted-foreground mt-1">
                          Book now and pay at the venue
                        </span>
                      </button>
                    </motion.div>
                    
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <button
                        type="button"
                        onClick={() => setBookingType("reserve")}
                        className={cn(
                          "w-full p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center",
                          bookingType === "reserve"
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className={cn(
                          "rounded-full p-2 mb-2",
                          bookingType === "reserve" ? "bg-primary/20" : "bg-muted"
                        )}>
                          <Clock className={cn(
                            "h-5 w-5",
                            bookingType === "reserve" ? "text-primary" : "text-muted-foreground"
                          )} />
                        </div>
                        <span className={cn(
                          "font-medium",
                          bookingType === "reserve" ? "text-primary" : ""
                        )}>
                          Reservation
                        </span>
                        <span className="text-xs text-muted-foreground mt-1">
                          Reserve now, pay later
                        </span>
                      </button>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <Label className="text-lg">Your Details</Label>
              </div>
              <p className="text-sm text-muted-foreground">Please provide your personal information</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleNumber">Vehicle Number</Label>
                <Input
                  id="vehicleNumber"
                  value={vehicleNumber}
                  onChange={(e) => {
                    setVehicleNumber(e.target.value);
                    if (e.target.value) {
                      setFormErrors(prev => ({ ...prev, vehicleNumber: false }));
                    }
                  }}
                  placeholder="e.g., ABC123"
                  className={cn("h-12", formErrors.vehicleNumber ? "border-red-500 focus-visible:ring-red-500" : "")}
                />
                {formErrors.vehicleNumber && (
                  <p className="text-sm text-red-500">Vehicle number is required</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerName">Your Name</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (e.target.value) {
                      setFormErrors(prev => ({ ...prev, customerName: false }));
                    }
                  }}
                  placeholder="Enter your name"
                  className={cn("h-12", formErrors.customerName ? "border-red-500 focus-visible:ring-red-500" : "")}
                />
                {formErrors.customerName && (
                  <p className="text-sm text-red-500">Your name is required</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactNumber">Contact Number</Label>
                <Input
                  id="contactNumber"
                  value={contactNumber}
                  onChange={(e) => {
                    setContactNumber(e.target.value);
                    if (e.target.value) {
                      setFormErrors(prev => ({ ...prev, contactNumber: false }));
                    }
                  }}
                  placeholder="Enter your contact number"
                  className={cn("h-12", formErrors.contactNumber ? "border-red-500 focus-visible:ring-red-500" : "")}
                />
                {formErrors.contactNumber && (
                  <p className="text-sm text-red-500">Contact number is required</p>
                )}
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-primary" />
                <Label className="text-lg">Confirm Your Booking</Label>
              </div>
              <p className="text-sm text-muted-foreground">Please review your booking details</p>
            </div>
            
            <div className="border border-border/50 rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Area</p>
                  <p className="font-medium">{areas.find(area => area.area_id === selectedArea)?.area_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Slot</p>
                  <p className="font-medium">{selectedSlot}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{selectedDate ? format(selectedDate, "PPP") : ""}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Booking Type</p>
                  <p className="font-medium capitalize">{bookingType}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Vehicle Number</p>
                  <p className="font-medium">{vehicleNumber}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Your Name</p>
                  <p className="font-medium">{customerName}</p>
                </div>
                <div className="md:col-span-2 space-y-1">
                  <p className="text-sm text-muted-foreground">Contact Number</p>
                  <p className="font-medium">{contactNumber}</p>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-border/50">
                <p className="text-center">
                  By proceeding, you agree to our terms and conditions for parking reservations.
                </p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen py-24">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">Book a Parking Slot</h1>
          
          <Card className="backdrop-blur-lg border border-border/50 shadow-lg">
            <form onSubmit={(e) => e.preventDefault()}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Booking Process</CardTitle>
                    <CardDescription>
                      Complete all steps to book your parking slot
                    </CardDescription>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Step {currentStep} of 5</span>
                  </div>
                </div>
                
                <div className="w-full h-2 bg-muted/50 rounded-full mt-4 overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: `${(currentStep - 1) * 20}%` }}
                    animate={{ width: `${currentStep * 20}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {renderStep()}
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row-reverse justify-between gap-4">
                {currentStep < 5 ? (
                  <Button 
                    type="button" 
                    onClick={handleNextStep}
                    className="w-full sm:w-auto"
                    disabled={
                      (currentStep === 1 && !selectedArea) || 
                      (currentStep === 2 && !selectedSlot) || 
                      (currentStep === 3 && !selectedDate)
                    }
                  >
                    Next Step <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    type="button" 
                    onClick={handleSubmit}
                    className="w-full sm:w-auto"
                    disabled={isLoading || !vehicleNumber || !customerName || !contactNumber}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>Confirm Booking</>
                    )}
                  </Button>
                )}
                
                {currentStep > 1 && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handlePreviousStep}
                    className="w-full sm:w-auto"
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                )}
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Book;
