import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { Loader2, Search, Calendar, MapPin, Car, Clock } from "lucide-react";
import { format } from "date-fns";

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
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const { data: vehicleData, error: vehicleError } = await supabase
          .from("vehicles")
          .select("vehicle_number");
        
        if (vehicleError) throw vehicleError;
        
        if (!vehicleData || vehicleData.length === 0) {
          setBookings([]);
          return;
        }
        
        const vehicleNumbers = vehicleData.map(v => v.vehicle_number);
        
        const { data, error } = await supabase
          .from("bookings")
          .select("*")
          .in("vehicle_number", vehicleNumbers)
          .order("entry_time", { ascending: false });
        
        if (error) throw error;
        setBookings(data || []);
        setFilteredBookings(data || []);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        toast.error("Failed to load bookings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredBookings(bookings);
      return;
    }
    
    const filtered = bookings.filter((booking) => 
      booking.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.slot_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredBookings(filtered);
  }, [searchTerm, bookings]);

  if (!user) return null;

  return (
    <div className="min-h-screen py-24">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
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
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[30vh]">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p>Loading your bookings...</p>
            </div>
          </div>
        ) : filteredBookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBookings.map((booking) => (
              <Card 
                key={booking.booking_id} 
                className="overflow-hidden hover:shadow-lg transition-shadow bg-card border border-border/50"
              >
                <div className={`h-2 w-full ${getStatusColor(booking.status)}`} />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Booking #{booking.booking_id}</CardTitle>
                    <Badge className={`${getStatusColor(booking.status)} capitalize`}>
                      {booking.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
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
                      {format(new Date(booking.entry_time), "PPP p")}
                    </p>
                  </div>
                  
                  {booking.exit_time && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" /> Exit Time
                      </p>
                      <p className="font-medium">
                        {format(new Date(booking.exit_time), "PPP p")}
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
                  
                  {(booking.status === "booked") && (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        toast.info("This feature is coming soon!");
                      }}
                    >
                      Cancel Booking
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[30vh] bg-muted/30 rounded-lg p-8">
            <div className="text-6xl mb-4">🅿️</div>
            <h3 className="text-2xl font-bold mb-2">No bookings found</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              {searchTerm 
                ? "No bookings match your search criteria. Try a different search."
                : "You haven't made any bookings yet. Book your first parking slot now!"}
            </p>
            <Button asChild>
              <Link to="/book">Book a Slot</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookings;
