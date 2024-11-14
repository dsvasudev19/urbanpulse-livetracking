
import { useState, useEffect, useRef } from "react"
import MapLibreGlDirections, {
  LoadingIndicatorControl,
} from "@maplibre/maplibre-gl-directions";
import { Map as MapLibreMap, NavigationControl, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// Define locations array at the top level
const locations = [
  {lat: 8.5333493, lng: 76.8824581},
  {lat: 8.5320122, lng: 76.8833443},
  {lat: 8.5313615, lng: 76.8839826},
  {lat: 8.5303163, lng: 76.884987},
  {lat: 8.5301181, lng: 76.8851691},
  {lat: 8.5300311, lng: 76.8852647},
  {lat: 8.5298078, lng: 76.8854618},
  {lat: 8.5296006, lng: 76.8856596},
  {lat: 8.5294755, lng: 76.8859054},
  {lat: 8.5295279, lng: 76.8861407},
  {lat: 8.5295322, lng: 76.8863562},
  {lat: 8.529521, lng: 76.8865022},
  {lat: 8.5295036, lng: 76.8867225},
  {lat: 8.5294964, lng: 76.8869452},
  {lat: 8.5294927, lng: 76.8871547},
  {lat: 8.5294953, lng: 76.8873584},
  {lat: 8.5294975, lng: 76.887519},
  {lat: 8.5294892, lng: 76.8877506},
  {lat: 8.5294635, lng: 76.8879753},
  {lat: 8.5294404, lng: 76.8881771},
  {lat: 8.5295538, lng: 76.8883683},
  {lat: 8.5297606, lng: 76.8885872},
  {lat: 8.5299334, lng: 76.888767},
  {lat: 8.5300564, lng: 76.8888893},
  {lat: 8.5302106, lng: 76.8890336},
  {lat: 8.5304158, lng: 76.8892233},
  {lat: 8.5309131, lng: 76.8896487},
  {lat: 8.53121, lng: 76.8898691},
  {lat: 8.5315965, lng: 76.8900913},
  {lat: 8.5320215, lng: 76.8902969},
  {lat: 8.5323169, lng: 76.890448}
];

function App() {
  const [mapReady, setMapReady] = useState(false);
  const [userLocation, setUserLocation] = useState();
  const [busId, setBusId] = useState();
  const mapInstance = useRef(null);
  const busMarkerRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!mapReady || !locations || locations.length === 0) return;

    try {
      const map = new MapLibreMap({
        container: "central-map",
        center: [locations[0].lng, locations[0].lat], // Center on first location
        zoom: 15,
        style: "https://api.olamaps.io/styleEditor/v1/styleEdit/styles/0eeb0df2-97bb-467a-b82d-0ed76b8bbc4b/capstone",
        transformRequest: (url, resourceType) => {
          url = url.replace("app.olamaps.io", "api.olamaps.io");
          if (url.includes("?")) {
            url = url + "&api_key=CoX9oENjiQuISlA9j8X7rQhy9SmrwpuCZotfvRdy";
          } else {
            url = url + "?api_key=CoX9oENjiQuISlA9j8X7rQhy9SmrwpuCZotfvRdy";
          }
          return { url, resourceType };
        },
      });

      mapInstance.current = map;

      const nav = new NavigationControl({
        visualizePitch: false,
        showCompass: true,
      });

      map.addControl(nav, "top-left");

      // Create the bus marker once the map is loaded
      map.on('load', () => {
        // Initialize the bus marker
        busMarkerRef.current = new Marker({
          element: createCustomMarkerElement('/bus-lane.png')
        })
        .setLngLat([locations[locations.length-1].lng, locations[locations.length-1].lat])
        .addTo(map);

        // Start the animation
        startBusAnimation();
      });

      // Get user location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation([longitude, latitude]);
            
            new Marker({color:"red"}).setLngLat([longitude, latitude]).addTo(map);

            map.flyTo({
              center: [longitude, latitude],
              zoom: 12,
            });
          },
          (error) => {
            console.error("Error getting location", error);
          }
        );
      } else {
        console.warn("Geolocation is not supported by this browser.");
      }

      // Cleanup function
      return () => {
        if (animationRef.current) {
          clearInterval(animationRef.current);
        }
        map.remove();
      };
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  }, [mapReady]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const busIdFound = urlParams.get("bus");
    if (busIdFound) {
      setBusId(busIdFound);
    }
  }, []);

  const startBusAnimation = () => {
    if (!locations || locations.length === 0) return;

    let currentIndex = locations.length-1;

    const updateMarkerPosition = () => {
      if (!busMarkerRef.current || !mapInstance.current) return;

      const currentLocation = locations[currentIndex];
      
      busMarkerRef.current.setLngLat([currentLocation.lng, currentLocation.lat]);
      
      mapInstance.current.panTo([currentLocation.lng, currentLocation.lat], {
        duration: 2000,
        essential: true
      });

      currentIndex = (currentIndex - 1) % locations.length;
    };

    // Clear any existing interval
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }

    // Start new interval
    updateMarkerPosition(); // Initial position
    animationRef.current = setInterval(updateMarkerPosition, 3000);
  };

  const createCustomMarkerElement = (imageUrl) => {
    const markerElement = document.createElement("div");
    markerElement.style.backgroundImage = `url(${imageUrl})`;
    markerElement.style.width = "40px";
    markerElement.style.height = "40px";
    markerElement.style.backgroundSize = "cover";
    markerElement.style.borderRadius = "50%";
    return markerElement;
  };

  return (
    <>
      <div
        style={{ width: "100vw", height: "100vh", overflow: "hidden" }}
        ref={() => setMapReady(true)}
        id="central-map"
      />
    </>
  );
}

export default App;