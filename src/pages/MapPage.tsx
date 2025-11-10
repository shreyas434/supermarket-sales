import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Search, Navigation, Clock } from "lucide-react";
import { toast } from "sonner";

// Declare google as a global variable
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

interface Supermarket {
  name: string;
  lat: number;
  lng: number;
  address?: string;
  rating?: number;
  isOpen?: boolean;
  placeId?: string;
}

const MapPage = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    console.log("API_KEY from env:", API_KEY ? "✓ Key present" : "✗ Key missing");
    console.log("Environment variables loaded:", import.meta.env);
    
    if (!API_KEY || API_KEY === 'your_api_key_here') {
      console.error("Google Maps API key not configured");
      toast.error("Please restart the dev server (Ctrl+C, then 'npm run dev') to load the API key from .env file");
      setIsLoading(false);
      return;
    }
    
    let initAttempts = 0;
    const maxAttempts = 10;

    const initMap = () => {
      console.log("initMap called, attempt:", initAttempts + 1);
      console.log("mapRef.current:", mapRef.current);
      console.log("window.google:", window.google);
      
      if (!mapRef.current) {
        console.warn("Map container ref not found, will retry...");
        initAttempts++;
        if (initAttempts < maxAttempts) {
          // Retry after a short delay
          setTimeout(initMap, 100);
        } else {
          console.error("Map container ref not found after multiple attempts");
          setIsLoading(false);
          toast.error("Failed to initialize map container");
        }
        return;
      }

      if (!window.google || !window.google.maps) {
        console.error("Google Maps API not loaded");
        toast.error("Google Maps API is not available");
        setIsLoading(false);
        return;
      }

      try {
        console.log("Creating map instance...");
        
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center: { lat: 40.7580, lng: -73.9855 }, // Default to NYC
          zoom: 13,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        });

        console.log("Map instance created:", mapInstance);
        
        // Check if Places API is available
        if (!window.google.maps.places) {
          console.warn("Places API not loaded - nearby search will not work");
          toast.warning("Places API not available. Some features may not work.");
        } else {
          console.log("Places API is available");
        }

        setMap(mapInstance);
        setIsLoading(false);
        toast.success("Map loaded successfully!");
        console.log("Map initialized successfully");
      } catch (error) {
        console.error("Error initializing map:", error);
        setIsLoading(false);
        toast.error(`Failed to initialize map: ${error}`);
      }
    };

    const loadGoogleMapsScript = () => {
      // Check if script is already loaded
      if (window.google && window.google.maps) {
        console.log("Google Maps already loaded, initializing...");
        initMap();
        return;
      }

      console.log("Loading Google Maps script...");
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log("Google Maps script loaded successfully");
        // Wait a bit for React to finish rendering
        setTimeout(initMap, 100);
      };
      script.onerror = (error) => {
        console.error("Failed to load Google Maps script:", error);
        toast.error("Failed to load Google Maps. Please check your API key and internet connection.");
        setIsLoading(false);
      };
      document.head.appendChild(script);
    };

    loadGoogleMapsScript();
  }, []);

  const handleSearch = () => {
    if (!map || !searchQuery || !window.google) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: searchQuery }, (results: any, status: string) => {
      if (status === "OK" && results?.[0]) {
        map.setCenter(results[0].geometry.location);
        map.setZoom(14);
        toast.success(`Found: ${searchQuery}`);
      } else {
        toast.error("Location not found");
      }
    });
  };

  const clearMarkers = () => {
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
  };

  const searchNearbySupermarkets = (location: {lat: number, lng: number}) => {
    if (!map || !window.google) {
      console.error("Map or Google API not loaded");
      toast.error("Map not ready. Please try again.", { id: "search" });
      return;
    }

    console.log("Searching for supermarkets near:", location);
    toast.loading("Searching for nearby supermarkets...", { id: "search" });

    // Set a timeout for the search
    const searchTimeout = setTimeout(() => {
      console.warn("Search timed out after 10 seconds");
      toast.error("Search is taking too long. Your API key may not have Places API enabled or you may have hit quota limits.", { id: "search" });
    }, 10000);

    const service = new window.google.maps.places.PlacesService(map);
    const request = {
      location: new window.google.maps.LatLng(location.lat, location.lng),
      radius: 3000, // Reduced to 3km for faster results
      keyword: 'supermarket grocery store',
    };

    console.log("Making Places API request with:", request);

    service.nearbySearch(request, (results: any, status: any) => {
      clearTimeout(searchTimeout); // Clear the timeout
      console.log("Places API response:", { status, results });
      console.log("Status code:", window.google.maps.places.PlacesServiceStatus);
      
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        clearMarkers();
        
        const stores: Supermarket[] = results.slice(0, 10).map((place: any) => ({
          name: place.name,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          address: place.vicinity,
          rating: place.rating,
          isOpen: place.opening_hours?.open_now,
          placeId: place.place_id,
        }));

        setSupermarkets(stores);

        // Add markers for supermarkets
        stores.forEach((store) => {
          const marker = new window.google.maps.Marker({
            position: { lat: store.lat, lng: store.lng },
            map: map,
            title: store.name,
            icon: {
              url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="12" fill="#16a34a" stroke="white" stroke-width="2"/>
                  <path d="M16 10 L16 22 M10 16 L22 16" stroke="white" stroke-width="2"/>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(32, 32),
            },
          });

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 8px;">
                <h3 style="font-weight: bold; margin-bottom: 4px;">${store.name}</h3>
                <p style="font-size: 12px; color: #666;">${store.address || ''}</p>
                ${store.rating ? `<p style="font-size: 12px;">⭐ ${store.rating}</p>` : ''}
                ${store.isOpen !== undefined ? `<p style="font-size: 12px; color: ${store.isOpen ? 'green' : 'red'};">${store.isOpen ? 'Open now' : 'Closed'}</p>` : ''}
              </div>
            `,
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });

          markersRef.current.push(marker);
        });

        toast.success(`Found ${stores.length} supermarkets nearby!`, { id: "search" });
      } else {
        console.error("Places API error status:", status);
        let errorMessage = "Error searching for supermarkets";
        
        // Provide specific error messages based on status
        if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          errorMessage = "No supermarkets found in this area. Try zooming out or searching a different location.";
        } else if (status === window.google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
          errorMessage = "Places API request denied. Please enable Places API in Google Cloud Console and check your API key restrictions.";
        } else if (status === window.google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
          errorMessage = "Query limit exceeded. You may need to enable billing or wait a moment before trying again.";
        } else if (status === window.google.maps.places.PlacesServiceStatus.INVALID_REQUEST) {
          errorMessage = "Invalid request. Please check the console for details.";
        } else if (status === window.google.maps.places.PlacesServiceStatus.UNKNOWN_ERROR) {
          errorMessage = "Unknown error. Please try again in a moment.";
        } else {
          errorMessage = `Error: ${status}`;
        }
        
        toast.error(errorMessage, { id: "search", duration: 8000 });
      }
    });
  };

  const handleLocateMe = () => {
    if (!map || !window.google) {
      console.error("Map not ready");
      toast.error("Map is not ready yet. Please wait a moment and try again.");
      return;
    }

    if (navigator.geolocation) {
      console.log("Requesting user location with high accuracy...");
      toast.loading("Getting your location...", { id: "location" });
      
      // Use high accuracy mode for better location precision
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          const accuracy = position.coords.accuracy;
          console.log("User location obtained:", pos);
          console.log("Location accuracy:", accuracy, "meters");
          
          if (accuracy > 1000) {
            toast.warning("Location accuracy is low. Results may not be precise.", { id: "location" });
          } else {
            toast.success(`Location found! (±${Math.round(accuracy)}m accuracy)`, { id: "location" });
          }
          
          setUserLocation(pos);
          map.setCenter(pos);
          map.setZoom(15);
          
          // Clear existing markers and add user location marker
          clearMarkers();
          
          const userMarker = new window.google.maps.Marker({
            position: pos,
            map: map,
            title: "Your Location",
            icon: {
              url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="8" fill="#ea580c" stroke="white" stroke-width="2"/>
                  <circle cx="16" cy="16" r="4" fill="white"/>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(32, 32),
            },
          });
          
          // Add accuracy circle
          new window.google.maps.Circle({
            map: map,
            center: pos,
            radius: accuracy,
            fillColor: '#ea580c',
            fillOpacity: 0.1,
            strokeColor: '#ea580c',
            strokeOpacity: 0.3,
            strokeWeight: 1,
          });
          
          markersRef.current.push(userMarker);
          
          // Search for nearby supermarkets
          searchNearbySupermarkets(pos);
        },
        (error) => {
          console.error("Geolocation error:", error);
          let errorMessage = "Unable to get your location";
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location permission denied. Please allow location access in your browser settings.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable. Please check your device's location settings.";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out. Please try again.";
              break;
          }
          toast.error(errorMessage, { id: "location" });
        },
        options
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 animate-fade-in">
          <h1 className="mb-2 text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Find Nearby Stores
          </h1>
          <p className="text-muted-foreground">
            Locate supermarkets near you or search for specific locations
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 animate-fade-in">
          <div className="space-y-4 lg:col-span-1">
            <Card className="p-4">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                  <Button onClick={handleSearch} size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                <Button onClick={handleLocateMe} className="w-full" variant="outline">
                  <Navigation className="mr-2 h-4 w-4" />
                  Use My Location
                </Button>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="mb-3 font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Nearby Stores
              </h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {supermarkets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Click "Use My Location" to find nearby supermarkets</p>
                  </div>
                ) : (
                  supermarkets.map((store, index) => (
                    <button
                      key={store.placeId || index}
                      onClick={() => {
                        if (map) {
                          map.setCenter({ lat: store.lat, lng: store.lng });
                          map.setZoom(16);
                        }
                      }}
                      className="w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted"
                    >
                      <p className="font-medium mb-1">{store.name}</p>
                      {store.address && (
                        <p className="text-xs text-muted-foreground mb-1">
                          {store.address}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs">
                        {store.rating && (
                          <span className="flex items-center gap-1">
                            ⭐ {store.rating}
                          </span>
                        )}
                        {store.isOpen !== undefined && (
                          <span className={`flex items-center gap-1 ${store.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                            <Clock className="h-3 w-3" />
                            {store.isOpen ? 'Open' : 'Closed'}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </Card>
          </div>

          <Card className="lg:col-span-2 overflow-hidden relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                <div className="text-center">
                  <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="text-muted-foreground">Loading map...</p>
                </div>
              </div>
            )}
            <div ref={mapRef} className="h-[600px] w-full" />
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mt-6">
          <Card className="p-4 bg-muted/50">
            <h3 className="mb-2 font-semibold">How to use:</h3>
            <ol className="space-y-1 text-sm text-muted-foreground list-decimal list-inside">
              <li>Click "Use My Location" to enable location services and find nearby supermarkets</li>
              <li>Search for any location using the search bar to explore different areas</li>
              <li>Click on store markers to view details like ratings and opening hours</li>
              <li>Click on store cards in the sidebar to zoom to specific locations</li>
            </ol>
          </Card>

          <Card className="p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <h3 className="mb-2 font-semibold text-amber-900 dark:text-amber-100">⚠️ Troubleshooting</h3>
            <div className="space-y-2 text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium">If the map isn't loading:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li><strong>Enable Required APIs:</strong>
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li><a href="https://console.cloud.google.com/apis/library/maps-backend.googleapis.com" target="_blank" rel="noopener noreferrer" className="underline">Maps JavaScript API</a></li>
                    <li><a href="https://console.cloud.google.com/apis/library/places-backend.googleapis.com" target="_blank" rel="noopener noreferrer" className="underline">Places API</a></li>
                  </ul>
                </li>
                <li><strong>Check API Key Restrictions:</strong>
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="underline">API Credentials</a></li>
                    <li>Ensure HTTP referrers allow <code>localhost</code> or remove restrictions for testing</li>
                  </ul>
                </li>
                <li><strong>Enable Billing:</strong> Google Maps requires a billing account (free tier available)</li>
                <li><strong>Check Console:</strong> Press F12 to see detailed error messages</li>
              </ol>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
