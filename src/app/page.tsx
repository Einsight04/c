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

  const geoControlRef = useRef<mapboxgl.GeolocateControl>(null);

  useEffect(() => {
    setTimeout(() => geoControlRef.current?.trigger(), 1000);
  }, []);

  return (
    <div className="flex h-screen flex-col">
      <div className="flex-grow">
        <Map
          mapboxAccessToken={env.NEXT_PUBLIC_MAPBOX_API_KEY}
          initialViewState={{
            longitude: -122.4,
            latitude: 37.8,
            zoom: 14,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/streets-v11"
        >
          <GeolocateControl
            ref={geoControlRef}
            trackUserLocation={true}
            positionOptions={{ enableHighAccuracy: true }}
          />
        </Map>
      </div>
      <button
        className="flex h-1/3 items-center justify-between rounded-tl-3xl rounded-tr-3xl bg-slate-800 p-4 text-2xl text-white"
        onClick={() => {
          /* Define your onClick event handler here */
        }}
      >
        {"Hold to speak"}
      </button>
    </div>
  );
}
