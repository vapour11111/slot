
import { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowDown, Car, MapPin, CalendarClock, Shield } from "lucide-react";

const Home = () => {
  const { user } = useAuth();
  const featuresRef = useRef<HTMLDivElement>(null);
  
  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center text-center px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5 z-0"></div>
        <div className="absolute inset-0 bg-[url('/placeholder.svg')] bg-cover opacity-10 z-0"></div>
        
        <div className="container mx-auto z-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter">
            The Future of <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">Parking</span>
          </h1>
          
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg md:text-xl">
            Book your parking slot in advance and save time. 
            Smart, efficient, and hassle-free parking solution.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Button size="lg" asChild className="h-12 px-8 animate-in fade-in slide-in-from-left-4 duration-700 delay-150">
              <Link to={user ? "/book" : "/auth"}>
                {user ? "Book a Slot" : "Get Started"}
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="h-12 px-8 animate-in fade-in slide-in-from-right-4 duration-700 delay-150"
              onClick={scrollToFeatures}
            >
              Learn More
            </Button>
          </div>
        </div>
        
        <button 
          onClick={scrollToFeatures}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce"
          aria-label="Scroll to features"
        >
          <ArrowDown className="h-8 w-8 text-muted-foreground" />
        </button>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose SLOT?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our platform offers a seamless parking experience with state-of-the-art technology
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Car className="h-10 w-10" />,
                title: "Easy Booking",
                description: "Book your parking slot in just a few clicks"
              },
              {
                icon: <MapPin className="h-10 w-10" />,
                title: "Multiple Locations",
                description: "Find parking slots across multiple locations"
              },
              {
                icon: <CalendarClock className="h-10 w-10" />,
                title: "Advance Booking",
                description: "Book your slot in advance to avoid last-minute hassle"
              },
              {
                icon: <Shield className="h-10 w-10" />,
                title: "Secure Payments",
                description: "Our payment system is secure and transparent"
              }
            ].map((feature, index) => (
              <div 
                key={index} 
                className="bg-card border border-border/50 p-6 rounded-xl shadow-md hover:shadow-lg transition-all hover:translate-y-[-5px] hover:border-primary/50"
              >
                <div className="mb-4 text-primary">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to experience the future of parking?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Join thousands of users who have simplified their parking experience with SLOT.
          </p>
          <Button size="lg" asChild className="h-12 px-8">
            <Link to={user ? "/book" : "/auth"}>
              {user ? "Book Now" : "Get Started"}
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Home;
