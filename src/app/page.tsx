"use client";
import { FaMicrophone } from "react-icons/fa";

import { unstable_noStore as noStore } from "next/cache";
import React, { useEffect, useRef, useState } from "react";
import useAudioRecorder from "~/app/hooks/useAudioRecorder";
import useCameraRecorder from "~/app/hooks/useCameraRecorder";
import { useOpenAISubmission } from "~/app/hooks/useOpenAISubmission";
import { api } from "~/trpc/react";

import Map, { GeolocateControl } from "react-map-gl";
import { env } from "~/env";
import { useBayun } from "./auth/bayun-client";
import { useRouter } from "next/navigation";

type Base64Image = {
  id: string;
  data: string;
};

const ContinuousCapturePage = () => {
  const { videoRef, canvasRef, captureImage } = useCameraRecorder();
  const { recording, startRecording, stopRecording, audioBlob } =
    useAudioRecorder();

  const sendTextAndImages = api.openai.sendTextAndImages.useMutation();

  const [audio, setAudio] = useState<string>("");
  const [images, setImages] = useState<Base64Image[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { isSignedIn, isLoading, signOut } = useBayun();
  const router = useRouter();

  const geoControlRef = useRef<mapboxgl.GeolocateControl>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

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

  const clearAll = () => {
    setAudio("");
    setImages([]);
    setLoading(false);
    setError(null);
  };

  const addImage = (base64Data: string) => {
    const newImage: Base64Image = {
      id: Date.now().toString(),
      data: base64Data,
    };
    setImages((currentImages) => [...currentImages.slice(-1), newImage]);
  };

  const submitToOpenAI = async () => {
    setLoading(true);
    setError(null);

    try {
      await sendTextAndImages.mutateAsync({
        audioBase64: audio,
        imagesBase64: images.map(({ data }) => data),
      });
    } catch (error) {
      console.error("Error submitting to OpenAI:", error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const doThing = async () => {
      if (!audio) return;

      await submitToOpenAI();
      clearAll();
    };

    void doThing();
  }, [audio]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueue = useRef<Array<string>>([]);
  const isPlayingRef = useRef<boolean>(false);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext ||
      window.AudioContext)();

    const resumeAudioContext = async () => {
      await audioContextRef.current?.resume();
    };

    window.addEventListener("click", () => void resumeAudioContext());
    return () =>
      window.removeEventListener("click", () => void resumeAudioContext());
  }, []);

  const playNextChunk = async () => {
    if (
      isPlayingRef.current ||
      audioQueue.current.length === 0 ||
      !audioContextRef.current
    )
      return;

    const audioChunk = audioQueue.current.shift();
    if (audioChunk === null) return;
    isPlayingRef.current = true;

    // TODO: THIS SHIT MIGHT BE WRONG
    if (!audioChunk) {
      console.error("Audio chunk is undefined or null.");
      return;
    }

    const response = await fetch(`data:audio/mp3;base64,${audioChunk}`);
    const arrayBuffer = await response.arrayBuffer();
    console.log("ARRAY BUFFER", arrayBuffer);

    audioContextRef.current.decodeAudioData(
      arrayBuffer,
      (audioBuffer) => {
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.start();
        source.onended = () => {
          isPlayingRef.current = false;
          playNextChunk(); // Play the next audio chunk after the current one finishes
        };
      },
      (err) => console.error("Error with decoding audio data", err),
    );
  };

  // Subscription to the streamAudio endpoint
  api.openai.streamAudio.useSubscription(undefined, {
    onData: (data) => {
      audioQueue.current.push(data.chunk);
      void playNextChunk();
    },
    onError: (error) => {
      console.error("Error receiving audio chunk: ", error);
    },
  });

  useEffect(() => {
    const setupProcess = async () => {
      if (!audioBlob) return;

      const buffer = Buffer.from(await audioBlob.arrayBuffer());
      const base64Audio = buffer.toString("base64");
      setAudio(base64Audio);
    };

    void setupProcess();
  }, [audioBlob, setAudio]);

  useEffect(() => {
    const handleImage = () => {
      const dataUrl = captureImage();
      if (dataUrl) addImage(dataUrl);
    };

    const imageCaptureInterval = setInterval(handleImage, 2000);

    return () => clearInterval(imageCaptureInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    router.push("/auth");
  }

  return (
    <>
      <div className="flex h-screen flex-col">
        <video ref={videoRef} style={{ display: "none" }} />
        <canvas
          ref={canvasRef}
          style={{ display: "none" }}
          width="640"
          height="480"
        />
        <div className="flex-grow">
          <Map
            mapboxAccessToken={env.NEXT_PUBLIC_MAPBOX_API_KEY}
            initialViewState={{
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
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          style={{
            backgroundColor: recording ? "#1f2937" : "#030712",
          }}
        >
          <FaMicrophone
            className="mr-2 h-6 w-6" // Adjust the size as necessary
          />
          Hold to Prompt
        </button>
      </div>
    </>
  );
};

export default ContinuousCapturePage;
