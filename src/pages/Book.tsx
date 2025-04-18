
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
import { format, addHours } from "date-fns";
import { CalendarIcon, Loader2, Check, ArrowRight, MapPin, Car, Building, Clock, CreditCard, Calendar as CalendarIcon2, User, Phone } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { motion } from "framer-motion";
import GoogleMap from "@/components/GoogleMap";
import ExitTimeSelector from "@/components/ExitTimeSelector";
import { formatInIST, formatPriceINR } from "@/utils/timeAndPriceUtils";

// Type definitions
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

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

const staggerChildren = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
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
  const [exitTime, setExitTime] = useState<Date | null>(null);
  const [estimatedPrice, setEstimatedPrice] = useState<number>(0);
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

  const handleExitTimeChange = (time: Date, price: number) => {
    setExitTime(time);
    setEstimatedPrice(price);
  };

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
    
    if (currentStep === 3) {
      if (!selectedDate) {
        toast.error("Please select a date");
        return;
      }
      
      if (!exitTime) {
        toast.error("Please select an exit time");
        return;
      }
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
    
    if (!selectedArea || !selectedSlot || !selectedDate || !exitTime) {
      toast.error("Missing booking information. Please start over.");
      setCurrentStep(1);
      return;
    }
    
    try {
      setIsLoading(true);
      console.log("Starting booking process...");
      
      // Check if vehicle exists
      const { data: existingVehicleData, error: vehicleQueryError } = await supabase
        .from("vehicles")
        .select("*")
        .eq("vehicle_number", vehicleNumber);
      
      if (vehicleQueryError) {
        console.error("Error checking vehicle:", vehicleQueryError);
        throw vehicleQueryError;
      }
      
      // If vehicle doesn't exist, create it
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
      
      // Get area name for the booking record
      const { data: areaData, error: areaError } = await supabase
        .from("areas")
        .select("area_name")
        .eq("area_id", selectedArea)
        .single();
      
      if (areaError) {
        console.error("Error getting area:", areaError);
        throw areaError;
      }
      
      // Create booking record
      console.log("Creating booking record");
      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .insert([
          {
            vehicle_number: vehicleNumber,
            slot_id: selectedSlot,
            entry_time: selectedDate.toISOString(),
            exit_time: exitTime.toISOString(),
            status: "booked",
            payment_status: "pending",
            amount_paid: estimatedPrice
          },
        ])
        .select();
      
      if (bookingError) {
        console.error("Error creating booking:", bookingError);
        throw bookingError;
      }
      
      // Update slot status
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
      toast.success(`Booking ${bookingType === "immediate" ? "confirmed" : "reserved"}!`, {
        icon: <Check className="h-5 w-5 text-green-500" />,
      });
      
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
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          >
            <Loader2 className="h-8 w-8 text-primary" />
          </motion.div>
        </div>
      );
    }
    
    if (slots.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-60 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-4xl mb-3">😢</div>
            <h3 className="text-xl font-semibold">No slots available</h3>
            <p className="text-muted-foreground mt-2">Please select a different area or try again later.</p>
          </motion.div>
        </div>
      );
    }
    
    return (
      <motion.div 
        variants={staggerChildren}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
      >
        {slots.map((slot) => (
          <motion.div
            key={slot.slot_id}
            variants={fadeIn}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
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
      </motion.div>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div 
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
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

            {selectedArea ? (
              <GoogleMap 
                destinationLat={areas.find(area => area.area_id === selectedArea)?.latitude || null}
                destinationLng={areas.find(area => area.area_id === selectedArea)?.longitude || null}
                locationName={areas.find(area => area.area_id === selectedArea)?.area_name || "Selected Location"}
              />
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="h-80 flex flex-col items-center justify-center gap-4 border border-border/50 rounded-lg bg-gradient-to-br from-background to-muted/30 p-6"
              >
                <div className="bg-muted/50 p-4 rounded-full">
                  <MapPin className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold">No Area Selected</h3>
                <p className="text-muted-foreground text-center">
                  Please select a parking area from the dropdown above.
                </p>
              </motion.div>
            )}
          </motion.div>
        );
      case 2:
        return (
          <motion.div 
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-primary" />
                <Label className="text-lg">Select Parking Slot</Label>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Choose an available parking slot</p>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button" 
                  className="text-xs text-primary hover:underline flex items-center gap-1"
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 12a9 9 0 0 0 15 6.7L21 16"></path><path d="M21 16v6h-6"></path>
                  </svg>
                  Refresh
                </motion.button>
              </div>
            </div>
            
            <div className="border border-border/50 rounded-lg p-6 min-h-80">
              <SlotSelector />
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div 
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
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
                            "w-full justify-start text-left font-normal h-12 border-border/50",
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
                          onSelect={(date) => {
                            setSelectedDate(date);
                            setExitTime(null); // Reset exit time when date changes
                          }}
                          initialFocus
                          disabled={(date) => date < new Date()}
                          className="rounded-md border border-border/50"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                {selectedDate && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full space-y-2 mt-2"
                  >
                    <ExitTimeSelector
                      entryTime={selectedDate}
                      selectedExitTime={exitTime}
                      onExitTimeChange={handleExitTimeChange}
                    />
                  </motion.div>
                )}
                
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
          </motion.div>
        );
      case 4:
        return (
          <motion.div 
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
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
                  <motion.p 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }}
                    className="text-sm text-red-500"
                  >
                    Vehicle number is required
                  </motion.p>
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
                  <motion.p
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }}
                    className="text-sm text-red-500"
                  >
                    Your name is required
                  </motion.p>
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
                  <motion.p
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }}
                    className="text-sm text-red-500"
                  >
                    Contact number is required
                  </motion.p>
                )}
              </div>
            </div>
          </motion.div>
        );
      case 5:
        return (
          <motion.div 
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-primary" />
                <Label className="text-lg">Confirm Your Booking</Label>
              </div>
              <p className="text-sm text-muted-foreground">Please review your booking details</p>
            </div>
            
            <motion.div 
              className="border border-border/50 rounded-lg p-6 space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div 
                  className="space-y-1"
                  variants={fadeIn}
                  transition={{ delay: 0.1 }}
                >
                  <p className="text-sm text-muted-foreground">Area</p>
                  <p className="font-medium">{areas.find(area => area.area_id === selectedArea)?.area_name}</p>
                </motion.div>
                <motion.div 
                  className="space-y-1"
                  variants={fadeIn}
                  transition={{ delay: 0.2 }}
                >
                  <p className="text-sm text-muted-foreground">Slot</p>
                  <p className="font-medium">{selectedSlot}</p>
                </motion.div>
                <motion.div 
                  className="space-y-1"
                  variants={fadeIn}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-sm text-muted-foreground">Entry Time</p>
                  <p className="font-medium">{selectedDate ? formatInIST(selectedDate) : ""}</p>
                </motion.div>
                <motion.div 
                  className="space-y-1"
                  variants={fadeIn}
                  transition={{ delay: 0.4 }}
                >
                  <p className="text-sm text-muted-foreground">Exit Time</p>
                  <p className="font-medium">{exitTime ? formatInIST(exitTime) : ""}</p>
                </motion.div>
                <motion.div 
                  className="space-y-1"
                  variants={fadeIn}
                  transition={{ delay: 0.5 }}
                >
                  <p className="text-sm text-muted-foreground">Estimated Price</p>
                  <p className="font-medium text-primary">{formatPriceINR(estimatedPrice)}</p>
                </motion.div>
                <motion.div 
                  className="space-y-1"
                  variants={fadeIn}
                  transition={{ delay: 0.6 }}
                >
                  <p className="text-sm text-muted-foreground">Booking Type</p>
                  <p className="font-medium capitalize">{bookingType}</p>
                </motion.div>
                <motion.div 
                  className="space-y-1"
                  variants={fadeIn}
                  transition={{ delay: 0.7 }}
                >
                  <p className="text-sm text-muted-foreground">Vehicle Number</p>
                  <p className="font-medium">{vehicleNumber}</p>
                </motion.div>
                <motion.div 
                  className="space-y-1"
                  variants={fadeIn}
                  transition={{ delay: 0.8 }}
                >
                  <p className="text-sm text-muted-foreground">Your Name</p>
                  <p className="font-medium">{customerName}</p>
                </motion.div>
                <motion.div 
                  className="md:col-span-2 space-y-1"
                  variants={fadeIn}
                  transition={{ delay: 0.9 }}
                >
                  <p className="text-sm text-muted-foreground">Contact Number</p>
                  <p className="font-medium">{contactNumber}</p>
                </motion.div>
              </div>
              
              <motion.div 
                className="mt-6 pt-4 border-t border-border/50"
                variants={fadeIn}
                transition={{ delay: 1.0 }}
              >
                <p className="text-center">
                  By proceeding, you agree to our terms and conditions for parking reservations.
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen py-24 relative overflow-hidden">
      {/* Enhanced background elements */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-primary/5 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-blue-500/5 rounded-full blur-3xl transform translate-x-1/3 translate-y-1/3"></div>
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-green-500/5 rounded-full blur-3xl"></div>
        
        {/* Additional decorative elements */}
        <div className="absolute top-1/3 left-1/4 w-40 h-40 bg-purple-500/5 rounded-full blur-2xl"></div>
        <div className="absolute bottom-1/4 left-1/5 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl"></div>
        
        {/* Animated background particles */}
        <div className="absolute top-20 right-40 w-3 h-3 bg-primary/30 rounded-full animate-float"></div>
        <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-blue-500/30 rounded-full animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-40 left-1/3 w-4 h-4 bg-green-500/30 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/3 left-40 w-2 h-2 bg-purple-500/30 rounded-full animate-float" style={{animationDelay: '3s'}}></div>
      </div>
      
      <div className="container mx-auto px-4 max-w-4xl relative">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-4xl font-bold mb-8 text-center">Book a Parking Slot</h1>
          
          <Card className="backdrop-blur-lg border border-border/50 shadow-lg glassmorphism">
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
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                      type="button" 
                      onClick={handleNextStep}
                      className="w-full sm:w-auto"
                      disabled={
                        (currentStep === 1 && !selectedArea) || 
                        (currentStep === 2 && !selectedSlot) || 
                        (currentStep === 3 && (!selectedDate || !exitTime))
                      }
                    >
                      Next Step <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
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
                  </motion.div>
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
        </motion.div>
      </div>
    </div>
  );
};

export default Book;
