"use client";
import React, { useRef, useEffect, useState } from "react";

import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";

import { CreatePost } from "~/app/_components/create-post";
import { api } from "~/trpc/react";
import useAudioRecorder from "./hooks/useAudioRecorder";
import { createClient } from "@deepgram/sdk";

import Map, { GeolocateControl } from "react-map-gl";
import { env } from "~/env";

export default function Home() {
  noStore();

  // const mapContainer = useRef<string | HTMLElement>("");
  // const map = useRef<Map | null>(null);
  // const [lng, setLng] = useState(-70.9);
  // const [lat, setLat] = useState(42.35);
  // const [zoom, setZoom] = useState(9);

  // useEffect(() => {
  //   if (map.current) return;

  //   map.current = new mapboxgl.Map({
  //     container: mapContainer.current,
  //     style: "mapbox://styles/mapbox/dark-v11",
  //     center: [-24, 42],
  //     zoom: 1,
  //     attributionControl: false,
  //   });

  //   geolocateControl.current = new mapboxgl.GeolocateControl({
  //     positionOptions: {
  //       enableHighAccuracy: true,
  //     },
  //     trackUserLocation: true,
  //     showUserHeading: true,
  //   });

  //   map.current.addControl(geolocateControl.current);

  //   // Trigger the geolocation control when the map loads
  //   map.current.on("load", () => {
  //     geolocateControl.current.trigger();
  //   });
  // }, []);

  // return (
  //   <div>
  //     <div
  //       ref={mapContainer}
  //       className="map-container"
  //       style={{ height: "600px" }}
  //     />
  //   </div>
  // );

  const geoControlRef = useRef<mapboxgl.GeolocateControl>(null);

  useEffect(() => {
    setTimeout(() => geoControlRef.current?.trigger(), 1000);
  }, []);

  return (
    <Map
      mapboxAccessToken={env.NEXT_PUBLIC_MAPBOX_API_KEY}
      initialViewState={{
        longitude: -122.4,
        latitude: 37.8,
        zoom: 14,
      }}
      style={{ width: 600, height: 400 }}
      mapStyle="mapbox://styles/mapbox/dark-v11"
    >
      <GeolocateControl
        ref={geoControlRef}
        trackUserLocation={true}
        positionOptions={{ enableHighAccuracy: true }}
      />
    </Map>
  );
}
