"use client";
import React, { useRef, useEffect, useState } from "react";
import { FaMicrophone } from "react-icons/fa";

import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";

import { CreatePost } from "~/app/_components/create-post";
import { api } from "~/trpc/react";
import useAudioRecorder from "./hooks/useAudioRecorder";
import { createClient } from "@deepgram/sdk";

import Map, { GeolocateControl } from "react-map-gl";
import { env } from "~/env";
import { useBayun } from "./auth/bayun-client";
import { useRouter } from "next/navigation";

export default function Home() {
  noStore();

  const { isSignedIn } = useBayun();
  const router = useRouter();

  const geoControlRef = useRef<mapboxgl.GeolocateControl>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    if (!isSignedIn()) router.push("/auth");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isMapLoaded) {
      setTimeout(() => {
        if (geoControlRef.current) {
          geoControlRef.current.trigger();
          console.log("Geolocating");
        }
      }, 1000);
    }
  }, [isMapLoaded]);
  
  // In your Map component's onLoad event handler
  const handleMapLoad = () => {
    setIsMapLoaded(true);
    // Other map initialization code
  };

  return (
    <div className="flex h-screen flex-col">
      <div className="flex-grow">
        <Map
          mapboxAccessToken={env.NEXT_PUBLIC_MAPBOX_API_KEY}
          initialViewState={{
            // longitude: geoControlRef.current?.position?.coords.longitude,
            // latitude: geoControlRef.current?.position?.coords.latitude,
            // zoom: 14,
            longitude: -122.4,
            latitude: 37.8,
            zoom: 14,
          }}
          onLoad={handleMapLoad}
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/dark-v11"
        >
          <GeolocateControl
            ref={geoControlRef}
            trackUserLocation={true}
            positionOptions={{ enableHighAccuracy: true }}
          />
        </Map>
      </div>
      <button
        className="absolute bottom-[-1rem] left-0 right-0 z-10 flex h-1/3 items-center justify-center rounded-tl-3xl rounded-tr-3xl bg-gray-950 p-4 text-2xl text-white"
        onClick={() => {
          /* Define your onClick event handler here */
        }}
      >
        <FaMicrophone
          className="mr-2 h-6 w-6" // Adjust the size as necessary
        />
        Hold to Prompt
      </button>
    </div>
  );
}
