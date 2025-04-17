
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { Loader2, Search, Calendar, MapPin, Car, Clock, CreditCard, Filter, ChevronDown, X, CircleCheck, CircleAlert } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type Booking = {
  booking_id: number;
  vehicle_number: string;
  slot_id: string;
  entry_time: string;
  exit_time: string | null;
  amount_paid: number;
  payment_status: string;
  status: string;
};

type PastBooking = {
  id: string;
  booking_id: number;
  vehicle_number: string;
  slot_id: string;
  entry_time: string;
  exit_time: string | null;
  amount_paid: number;
  payment_status: string;
  status: string;
  area_name: string;
  customer_name: string;
  contact_number: string;
  cancelled_at: string | null;
  created_at: string | null;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-500/20 text-green-700 border-green-500/50";
    case "booked":
      return "bg-blue-500/20 text-blue-700 border-blue-500/50";
    case "cancelled":
      return "bg-red-500/20 text-red-700 border-red-500/50";
    case "active":
      return "bg-yellow-500/20 text-yellow-700 border-yellow-500/50";
    default:
      return "bg-gray-500/20 text-gray-700 border-gray-500/50";
  }
};

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case "paid":
      return "bg-green-500/20 text-green-700 border-green-500/50";
    case "pending":
      return "bg-yellow-500/20 text-yellow-700 border-yellow-500/50";
    case "failed":
      return "bg-red-500/20 text-red-700 border-red-500/50";
    default:
      return "bg-gray-500/20 text-gray-700 border-gray-500/50";
  }
};

const Bookings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeBookings, setActiveBookings] = useState<Booking[]>([]);
  const [pastBookings, setPastBookings] = useState<PastBooking[]>([]);
  const [filteredActiveBookings, setFilteredActiveBookings] = useState<Booking[]>([]);
  const [filteredPastBookings, setFilteredPastBookings] = useState<PastBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("active");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      
      // Fetch active bookings
      const { data: activeData, error: activeError } = await supabase
        .from("bookings")
        .select("*")
        .in("status", ["booked", "active"])
        .order("entry_time", { ascending: false });
      
      if (activeError) throw activeError;
      setActiveBookings(activeData || []);
      setFilteredActiveBookings(activeData || []);
      
      // Fetch past bookings
      const { data: pastData, error: pastError } = await supabase
        .from("past_booking")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (pastError) throw pastError;
      setPastBookings(pastData || []);
      setFilteredPastBookings(pastData || []);
      
    } catch (error: any) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  };

  const filterBookings = () => {
    // Filter active bookings
    let filteredActive = [...activeBookings];
    
    if (searchTerm.trim()) {
      filteredActive = filteredActive.filter((booking) => 
        booking.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.slot_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.status.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredActiveBookings(filteredActive);
    
    // Filter past bookings
    let filteredPast = [...pastBookings];
    
    if (searchTerm.trim()) {
      filteredPast = filteredPast.filter((booking) => 
        booking.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.slot_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.area_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== "all") {
      filteredPast = filteredPast.filter(booking => booking.status === statusFilter);
    }
    
    setFilteredPastBookings(filteredPast);
  };

  useEffect(() => {
    filterBookings();
  }, [searchTerm, statusFilter, activeBookings, pastBookings]);

  const handleCancelBooking = async () => {
    if (!bookingToCancel) return;
    
    try {
      setIsCancelling(true);
      
      // Get the booking details from the bookings table
      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .select("*, vehicles(customer_name, contact_number), parking_slots(area_id)")
        .eq("booking_id", bookingToCancel.booking_id)
        .single();
      
      if (bookingError) throw bookingError;
      
      if (!bookingData) {
        throw new Error("Booking not found");
      }
      
      // Get the area name
      const { data: areaData, error: areaError } = await supabase
        .from("areas")
        .select("area_name")
        .eq("area_id", bookingData.parking_slots?.area_id)
        .single();
      
      if (areaError) throw areaError;
      
      // Create entry in past_booking table
      const { error: pastError } = await supabase
        .from("past_booking")
        .insert([
          {
            booking_id: bookingToCancel.booking_id,
            vehicle_number: bookingToCancel.vehicle_number,
            slot_id: bookingToCancel.slot_id,
            area_name: areaData?.area_name || "Unknown",
            entry_time: bookingToCancel.entry_time,
            exit_time: bookingToCancel.exit_time,
            status: "cancelled",
            amount_paid: bookingToCancel.amount_paid,
            payment_status: bookingToCancel.payment_status,
            customer_name: bookingData.vehicles?.customer_name || "Unknown",
            contact_number: bookingData.vehicles?.contact_number || "Unknown",
            cancelled_at: new Date().toISOString(),
          }
        ]);
      
      if (pastError) throw pastError;
      
      // Update the parking slot to available
      const { error: slotError } = await supabase
        .from("parking_slots")
        .update({ status: "available" })
        .eq("slot_id", bookingToCancel.slot_id);
      
      if (slotError) throw slotError;
      
      // Delete the booking from bookings table
      const { error: deleteError } = await supabase
        .from("bookings")
        .delete()
        .eq("booking_id", bookingToCancel.booking_id);
      
      if (deleteError) throw deleteError;
      
      toast.success("Booking cancelled successfully");
      setCancelDialogOpen(false);
      fetchBookings(); // Refresh the data
      
    } catch (error: any) {
      console.error("Error cancelling booking:", error);
      toast.error(`Failed to cancel booking: ${error.message || 'Unknown error'}`);
    } finally {
      setIsCancelling(false);
    }
  };

  const ActiveBookingsView = () => (
    <>
      {filteredActiveBookings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActiveBookings.map((booking, index) => (
            <motion.div
              key={booking.booking_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 bg-card border border-border/50 h-full flex flex-col">
                <div className={`h-2 w-full ${getStatusColor(booking.status)}`} />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle>Booking #{booking.booking_id}</CardTitle>
                    <Badge className={`${getStatusColor(booking.status)} capitalize`}>
                      {booking.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    {format(parseISO(booking.entry_time), "PPP")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 flex-grow">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Car className="h-4 w-4" /> Vehicle
                      </p>
                      <p className="font-medium">{booking.vehicle_number}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> Slot
                      </p>
                      <p className="font-medium">{booking.slot_id}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> Entry Time
                    </p>
                    <p className="font-medium">
                      {format(parseISO(booking.entry_time), "p")}
                    </p>
                  </div>
                  
                  {booking.exit_time && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" /> Exit Time
                      </p>
                      <p className="font-medium">
                        {format(parseISO(booking.exit_time), "p")}
                      </p>
                    </div>
                  )}
                  
                  <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                    <div>
                      <span className="text-sm text-muted-foreground">Amount:</span>
                      <span className="ml-2 font-semibold">
                        ${booking.amount_paid.toFixed(2)}
                      </span>
                    </div>
                    <Badge className={`${getPaymentStatusColor(booking.payment_status)} capitalize`}>
                      {booking.payment_status}
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter>
                  {booking.status === "booked" && (
                    <Button 
                      variant="destructive" 
                      className="w-full hover:bg-destructive/90"
                      onClick={() => {
                        setBookingToCancel(booking);
                        setCancelDialogOpen(true);
                      }}
                    >
                      Cancel Booking
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState 
          message={searchTerm 
            ? "No active bookings match your search criteria" 
            : "No active bookings found"}
        />
      )}
    </>
  );

  const PastBookingsView = () => (
    <>
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-muted/30 p-4 rounded-lg">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Filter Past Bookings</h3>
        </div>
        
        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto justify-between">
              {statusFilter === "all" ? "All Statuses" : 
                <span className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusDotColor(statusFilter)}`}></div>
                  {capitalizeFirstLetter(statusFilter)}
                </span>
              }
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2">
            <div className="space-y-1">
              <Button
                variant="ghost"
                className={cn("w-full justify-start", statusFilter === "all" && "bg-primary/10")}
                onClick={() => {
                  setStatusFilter("all");
                  setFilterOpen(false);
                }}
              >
                All Statuses
              </Button>
              {["completed", "cancelled"].map((status) => (
                <Button
                  key={status}
                  variant="ghost"
                  className={cn("w-full justify-start", statusFilter === status && "bg-primary/10")}
                  onClick={() => {
                    setStatusFilter(status);
                    setFilterOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusDotColor(status)}`}></div>
                    {capitalizeFirstLetter(status)}
                  </div>
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    
      {filteredPastBookings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPastBookings.map((booking, index) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 bg-card border border-border/50 h-full flex flex-col">
                <div className={`h-2 w-full ${getStatusColor(booking.status)}`} />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle>Booking #{booking.booking_id}</CardTitle>
                    <Badge className={`${getStatusColor(booking.status)} capitalize`}>
                      {booking.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    {booking.created_at ? format(parseISO(booking.created_at), "PPP") : 'Unknown date'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 flex-grow">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Customer</p>
                    <p className="font-medium">{booking.customer_name}</p>
                  </div>
                
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Car className="h-4 w-4" /> Vehicle
                      </p>
                      <p className="font-medium">{booking.vehicle_number}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> Area
                      </p>
                      <p className="font-medium">{booking.area_name}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" /> Entry
                      </p>
                      <p className="font-medium">
                        {format(parseISO(booking.entry_time), "p")}
                      </p>
                    </div>
                    
                    {booking.exit_time && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Clock className="h-4 w-4" /> Exit
                        </p>
                        <p className="font-medium">
                          {format(parseISO(booking.exit_time), "p")}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {booking.cancelled_at && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Cancelled on</p>
                      <p className="font-medium">
                        {format(parseISO(booking.cancelled_at), "PPP p")}
                      </p>
                    </div>
                  )}
                  
                  <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                    <div>
                      <span className="text-sm text-muted-foreground">Amount:</span>
                      <span className="ml-2 font-semibold">
                        ${Number(booking.amount_paid).toFixed(2)}
                      </span>
                    </div>
                    <Badge className={`${getPaymentStatusColor(booking.payment_status)} capitalize`}>
                      {booking.payment_status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState 
          message={searchTerm || statusFilter !== "all"
            ? "No bookings match your filter criteria" 
            : "No past bookings found"}
        />
      )}
    </>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center min-h-[30vh] bg-muted/30 rounded-lg p-8"
    >
      <div className="text-6xl mb-4">🅿️</div>
      <h3 className="text-2xl font-bold mb-2">No bookings found</h3>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        {message}
      </p>
      <Button asChild>
        <Link to="/book">Book a Slot</Link>
      </Button>
    </motion.div>
  );

  const LoadingState = () => (
    <div className="flex items-center justify-center min-h-[30vh]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-4"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <Loader2 className="h-8 w-8 text-primary" />
        </motion.div>
        <p className="text-lg">Loading your bookings...</p>
      </motion.div>
    </div>
  );

  function getStatusDotColor(status: string): string {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  }

  function capitalizeFirstLetter(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  if (!user) return null;

  return (
    <div className="min-h-screen py-24">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold">Your Bookings</h1>
            <p className="text-muted-foreground mt-2">
              View all your past and upcoming bookings
            </p>
          </div>
          
          <div className="w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search bookings..."
                className="pl-10 bg-background border-border/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </motion.div>
        
        <Tabs 
          defaultValue="active" 
          value={selectedTab} 
          onValueChange={setSelectedTab}
          className="space-y-6"
        >
          <TabsList className="w-full sm:w-auto grid grid-cols-2 h-auto p-1 bg-muted/50">
            <TabsTrigger 
              value="active" 
              className="data-[state=active]:text-primary data-[state=active]:shadow-sm py-2"
            >
              Active Bookings
            </TabsTrigger>
            <TabsTrigger 
              value="past" 
              className="data-[state=active]:text-primary data-[state=active]:shadow-sm py-2"
            >
              Past Bookings
            </TabsTrigger>
          </TabsList>
          
          {isLoading ? (
            <LoadingState />
          ) : (
            <>
              <TabsContent value="active" className="space-y-6 mt-6">
                <ActiveBookingsView />
              </TabsContent>
              
              <TabsContent value="past" className="space-y-6 mt-6">
                <PastBookingsView />
              </TabsContent>
            </>
          )}
        </Tabs>
        
        {/* Cancel Booking Dialog */}
        <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Cancel Booking</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel this booking? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            {bookingToCancel && (
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="font-medium">Booking ID</span>
                  <span>#{bookingToCancel.booking_id}</span>
                </div>
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="font-medium">Vehicle</span>
                  <span>{bookingToCancel.vehicle_number}</span>
                </div>
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="font-medium">Parking Slot</span>
                  <span>{bookingToCancel.slot_id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Date</span>
                  <span>{format(parseISO(bookingToCancel.entry_time), "PPP")}</span>
                </div>
              </div>
            )}
            
            <DialogFooter className="flex sm:justify-between gap-4">
              <Button 
                variant="outline" 
                onClick={() => setCancelDialogOpen(false)}
                className="w-full sm:w-auto"
              >
                <X className="mr-2 h-4 w-4" />
                Keep Booking
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleCancelBooking}
                className="w-full sm:w-auto"
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                    Cancelling...
                  </>
                ) : (
                  <>
                    <CircleAlert className="mr-2 h-4 w-4" /> 
                    Cancel Booking
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Bookings;
