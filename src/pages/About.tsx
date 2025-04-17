
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const About = () => {
  const { user } = useAuth();

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen py-24">
      {/* Hero Section */}
      <section className="py-12 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                About <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">SLOT.</span>
              </h1>
              <p className="text-muted-foreground text-lg">
                We're revolutionizing the way people park by providing a seamless, 
                digital solution to one of urban life's most common challenges.
              </p>
              <Button asChild>
                <Link to={user ? "/book" : "/auth"}>
                  {user ? "Book a Slot" : "Join Us"}
                </Link>
              </Button>
            </div>
            <div className="rounded-xl overflow-hidden aspect-video bg-muted/30 border border-border flex items-center justify-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">SLOT.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold">Our Mission</h2>
            <p className="text-lg text-muted-foreground">
              To transform the parking experience through innovative technology, 
              making it more efficient, accessible, and environmentally friendly.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-12 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Innovation",
                description: "We're constantly exploring new technologies to improve the parking experience."
              },
              {
                title: "Sustainability",
                description: "We're committed to reducing carbon emissions by streamlining the parking process."
              },
              {
                title: "Customer-First",
                description: "Everything we do is designed with our users' needs and convenience in mind."
              }
            ].map((value, index) => (
              <div 
                key={index}
                className="bg-card border border-border/50 rounded-xl p-6 hover:shadow-lg transition-all hover:translate-y-[-5px]"
              >
                <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-12 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Meet Our Team</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: "Alex Johnson", role: "CEO & Founder" },
              { name: "Sarah Chen", role: "CTO" },
              { name: "Michael Rodriguez", role: "Head of Operations" },
              { name: "Priya Sharma", role: "Lead Developer" }
            ].map((member, index) => (
              <div 
                key={index}
                className="text-center space-y-3"
              >
                <div className="h-48 bg-muted rounded-xl flex items-center justify-center">
                  <span className="text-5xl text-muted-foreground/30">👤</span>
                </div>
                <h3 className="text-xl font-medium">{member.name}</h3>
                <p className="text-muted-foreground">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">Join the Parking Revolution</h2>
            <p className="text-lg text-muted-foreground">
              Experience the future of parking today.
            </p>
            <Button size="lg" asChild>
              <Link to={user ? "/book" : "/auth"}>
                {user ? "Book a Slot" : "Get Started"}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
