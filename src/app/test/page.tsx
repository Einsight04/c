"use client";

import React, { useEffect, useRef, useState } from "react";
import useAudioRecorder from "~/app/hooks/useAudioRecorder";
import useCameraRecorder from "~/app/hooks/useCameraRecorder";
import { useOpenAISubmission } from "~/app/hooks/useOpenAISubmission";
import { api } from "~/trpc/react";

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

    const response = await fetch(`data:audio/mp3;base64,${audioChunk}`);
    const arrayBuffer = await response.arrayBuffer();
    console.log("ARRAY BUFFER", arrayBuffer);

    isPlayingRef.current = true;
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

  return (
    <div>
      <video ref={videoRef} style={{ display: "none" }} />
      <canvas
        ref={canvasRef}
        style={{ display: "none" }}
        width="640"
        height="480"
      />
      <div style={{ padding: "20px", textAlign: "center" }}>
        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
            backgroundColor: recording ? "#ffaaaa" : "#aaffaa",
            border: "none",
            borderRadius: "5px",
          }}
        >
          {recording ? "Recording... Release to stop" : "Hold to record"}
        </button>
        {/* <button
          onClick={sendToOpenAI}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
            backgroundColor: recording ? "#ffaaaa" : "#aaffaa",
            border: "none",
            borderRadius: "5px",
          }}
        >
          {" Send to OpenAI "}
        </button> */}
      </div>
      {audioBlob && (
        <div>
          <p>Recording Complete:</p>
          <audio controls>
            <source src={URL.createObjectURL(audioBlob)} type="audio/mp3" />
          </audio>
        </div>
      )}
    </div>
  );
};

export default ContinuousCapturePage;
