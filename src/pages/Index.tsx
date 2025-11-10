import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BarChart3, MapPin, TrendingUp, Upload, Zap, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const features = [
    {
      icon: Upload,
      title: "Easy Data Upload",
      description: "Upload CSV files instantly and start analyzing your sales data in seconds",
    },
    {
      icon: BarChart3,
      title: "Visual Analytics",
      description: "Beautiful, interactive charts showing sales trends, categories, and top products",
    },
    {
      icon: MapPin,
      title: "Store Locator",
      description: "Find nearby supermarkets with integrated Google Maps and location services",
    },
    {
      icon: TrendingUp,
      title: "Real-time Insights",
      description: "Get instant insights on sales performance and customer behavior patterns",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Process thousands of sales records in milliseconds with optimized algorithms",
    },
    {
      icon: ShieldCheck,
      title: "Secure & Private",
      description: "Your data stays in your browser - no server uploads, complete privacy",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center animate-fade-in">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Zap className="h-4 w-4" />
              Modern Analytics Platform
            </div>
            <h1 className="mb-6 text-5xl font-bold leading-tight sm:text-6xl lg:text-7xl">
              Supermarket Sales{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Analytics
              </span>
            </h1>
            <p className="mb-8 text-xl text-muted-foreground">
              Transform your sales data into actionable insights with powerful analytics
              and intelligent visualizations. Find stores, track trends, and make
              data-driven decisions.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="gap-2">
                <Link to="/dashboard">
                  <BarChart3 className="h-5 w-5" />
                  Open Dashboard
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2">
                <Link to="/map">
                  <MapPin className="h-5 w-5" />
                  Find Stores
                </Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Decorative gradient orbs */}
        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-20 bottom-20 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Powerful Features</h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to analyze and understand your sales data
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="p-6 transition-all hover:shadow-lg animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-accent">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-2xl text-primary-foreground">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Ready to Analyze Your Data?
            </h2>
            <p className="mb-8 text-lg opacity-90">
              Start exploring your sales data today with our powerful analytics tools
            </p>
            <Button asChild size="lg" variant="secondary">
              <Link to="/dashboard">
                Get Started Now
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
