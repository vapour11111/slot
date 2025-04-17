
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
import { CalendarIcon, Loader2, Check } from "lucide-react";
import { toast } from "@/components/ui/sonner";

type Area = {
  area_id: string;
  area_name: string;
  latitude: number;
  longitude: number;
};

type ParkingSlot = {
  slot_id: string;
  area_id: string;
  status: string;
};

const Book = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [areas, setAreas] = useState<Area[]>([]);
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  // Fetch areas
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const { data, error } = await supabase.from("areas").select("*");
        if (error) throw error;
        setAreas(data || []);
      } catch (error) {
        console.error("Error fetching areas:", error);
        toast.error("Failed to load areas");
      }
    };

    fetchAreas();
  }, []);

  // Fetch slots based on selected area
  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedArea) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("parking_slots")
          .select("*")
          .eq("area_id", selectedArea)
          .eq("status", "available");
          
        if (error) throw error;
        setSlots(data || []);
      } catch (error) {
        console.error("Error fetching slots:", error);
        toast.error("Failed to load available slots");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSlots();
  }, [selectedArea]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedArea || !selectedSlot || !selectedDate || !vehicleNumber || !customerName || !contactNumber) {
      toast.error("Please fill in all fields");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // First, check if vehicle exists
      const { data: vehicleData, error: vehicleError } = await supabase
        .from("vehicles")
        .select("vehicle_number")
        .eq("vehicle_number", vehicleNumber);
      
      // If vehicle doesn't exist, create it
      if (!vehicleError && (!vehicleData || vehicleData.length === 0)) {
        const { error: insertError } = await supabase
          .from("vehicles")
          .insert([
            {
              vehicle_number: vehicleNumber,
              customer_name: customerName,
              contact_number: contactNumber,
            },
          ]);
        
        if (insertError) throw insertError;
      }
      
      // Create booking
      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .insert([
          {
            vehicle_number: vehicleNumber,
            slot_id: selectedSlot,
            entry_time: selectedDate.toISOString(),
            status: "booked",
          },
        ])
        .select();
      
      if (bookingError) throw bookingError;
      
      // Update slot status
      const { error: slotError } = await supabase
        .from("parking_slots")
        .update({ status: "booked" })
        .eq("slot_id", selectedSlot);
      
      if (slotError) throw slotError;
      
      toast.success("Booking successful!");
      navigate("/bookings");
    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error("Failed to create booking");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Book a Parking Slot</h1>
          
          <Card className="backdrop-blur-lg border border-border/50 shadow-lg">
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Parking Details</CardTitle>
                <CardDescription>
                  Enter your details to book a parking slot
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Area Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="area">Area</Label>
                    <Select 
                      value={selectedArea} 
                      onValueChange={setSelectedArea}
                    >
                      <SelectTrigger>
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
                  
                  {/* Slot Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="slot">Slot</Label>
                    <Select
                      value={selectedSlot}
                      onValueChange={setSelectedSlot}
                      disabled={!selectedArea || isLoading}
                    >
                      <SelectTrigger>
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Loading slots...</span>
                          </div>
                        ) : (
                          <SelectValue placeholder="Select a slot" />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {slots.map((slot) => (
                          <SelectItem key={slot.slot_id} value={slot.slot_id}>
                            Slot {slot.slot_id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Date Selection */}
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
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
                
                <div className="border-t border-border/50 pt-6">
                  <h3 className="text-lg font-medium mb-4">Vehicle Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="vehicleNumber">Vehicle Number</Label>
                      <Input
                        id="vehicleNumber"
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value)}
                        placeholder="e.g., ABC123"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customerName">Your Name</Label>
                      <Input
                        id="customerName"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Enter your name"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="contactNumber">Contact Number</Label>
                      <Input
                        id="contactNumber"
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                        placeholder="Enter your contact number"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : "Book Slot"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Book;
