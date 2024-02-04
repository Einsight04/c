import React, { useRef, useEffect, useState } from 'react';

import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";

import { CreatePost } from "~/app/_components/create-post";
import { api } from "~/trpc/react";
import useAudioRecorder from "./hooks/useAudioRecorder";
import { createClient } from "@deepgram/sdk";

import mapboxgl from 'mapbox-gl';
import { env } from '~/env';

mapboxgl.accessToken = env.NEXT_PUBLIC_MAPBOX_API_KEY;

export default function Home() {
  noStore();

  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(-70.9);
  const [lat, setLat] = useState(42.35);
  const [zoom, setZoom] = useState(9);

  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-24, 42],
      zoom: 1,
      attributionControl: false
    });

    geolocateControl.current = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true
    });

    map.current.addControl(geolocateControl.current);

    // Trigger the geolocation control when the map loads
    map.current.on('load', () => {
      geolocateControl.current.trigger();
    });
  }, []);
  
  return (
    <div>
      <div ref={mapContainer} className="map-container" style={{height: '600px'}} />
    </div>
  );

  

  // const { recording, startRecording, stopRecording, audioUrl, audioBlob } =
  //   useAudioRecorder();
  // const [transcription, setTranscription] = useState<string | null>(null);
  // const deepgram = api.transcribe.transcribe.useMutation();
  // const sendTextAndImages = api.openai.sendTextAndImages.useMutation();
  // const [counter, setCounter] = useState(0);

  // api.openai.streamAudio.useSubscription(undefined, {
  //   onData: (data) => {
  //     setCounter((prev) => prev + 1);
  //     console.log(counter);
  //     // console.log(data.chunk);
  //   },
  //   onError: (err) => {
  //     console.error(err);
  //   },
  //   onStarted() {
  //     console.log("stream started");
  //   },
  // });

  // const testEndToEndShitMinusDeepgram = async () => {
  //   await sendTextAndImages.mutateAsync({
  //     text: "hello world",
  //     images: [],
  //   });
  // };

  // async function transcribeAudio() {
  //   const buff = Buffer.from(await audioBlob!!.arrayBuffer());

  //   const { result } = await deepgram.mutateAsync(buff.toString("base64"));
  //   setTranscription(result);
  // }

  // useEffect(() => {
  //   if (recording === false && audioBlob) {
  //     transcribeAudio();
  //   }
  // }, [audioBlob]);

  // return (
  //   <div style={{ padding: "20px", textAlign: "center", position: "absolute", top: "40px" }}>
  //     <button
  //       onMouseDown={startRecording}
  //       onMouseUp={stopRecording}
  //       onTouchStart={startRecording}
  //       onTouchEnd={stopRecording}
  //       style={{
  //         padding: "10px 20px",
  //         fontSize: "16px",
  //         cursor: "pointer",
  //         backgroundColor: recording ? "#ffaaaa" : "#aaffaa",
  //         border: "none",
  //         borderRadius: "15px",
  //       }}
  //     >
  //       {recording ? "Cum... Release to stop" : "Tit Balls"}
  //     </button>
  //     <button onClick={testEndToEndShitMinusDeepgram}>Test</button>
  //     {audioUrl && (
  //       <div>
  //         <p>Recording Complete:</p>
  //         <audio src={audioUrl} controls />
  //         {transcription && <p>Transcription: {transcription}</p>}
  //       </div>
  //     )}
  //   </div>
  // );
}
