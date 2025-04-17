
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { Menu, X, ChevronDown } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "./ui/navigation-menu";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const { user, signOut } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About Us", href: "/about" },
    { name: "Book Now", href: "/book", authRequired: true },
    { name: "Past Bookings", href: "/bookings", authRequired: true },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-background/60 backdrop-blur-xl border-b border-border/20 shadow-lg"
          : "bg-transparent"
      )}
    >
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <span className="font-bold text-2xl bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent transition-all duration-300 group-hover:scale-105">
            SLOT.
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          <div className="flex items-center">
            {navLinks.map((link) => {
              // Skip auth required links if not logged in
              if (link.authRequired && !user) return null;
              
              return (
                <Link 
                  key={link.name} 
                  to={link.href}
                  className={cn(
                    "px-4 py-2 mx-1 rounded-md font-medium transition-all duration-300",
                    location.pathname === link.href 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-primary/5"
                  )}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          <div className="ml-4 flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <Button 
                onClick={() => signOut()} 
                variant="outline" 
                className="ml-2 transition-all duration-300 hover:bg-destructive/10 hover:text-destructive"
              >
                Sign Out
              </Button>
            ) : (
              <Button asChild variant="default" className="ml-2 transition-all duration-300">
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
          </div>
        </nav>

        {/* Mobile Navigation Trigger */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
            className="transition-all duration-300 hover:bg-primary/10"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border/20 animate-in slide-in-from-top-5 duration-300">
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
            {navLinks.map((link) => {
              // Skip auth required links if not logged in
              if (link.authRequired && !user) return null;
              
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  className={cn(
                    "py-2 px-4 rounded-md transition-all duration-300",
                    location.pathname === link.href 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-primary/5"
                  )}
                >
                  {link.name}
                </Link>
              );
            })}

            {user ? (
              <Button 
                onClick={() => signOut()} 
                className="w-full justify-start" 
                variant="destructive"
              >
                Sign Out
              </Button>
            ) : (
              <Button asChild className="w-full" variant="default">
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
