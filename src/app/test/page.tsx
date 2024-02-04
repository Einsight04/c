"use client";

import React, { useEffect, useRef, useState } from "react";
import useAudioRecorder from "~/app/hooks/useAudioRecorder";
import useCameraRecorder from "~/app/hooks/useCameraRecorder";
import { useOpenAISubmission } from "~/app/hooks/useOpenAISubmission";
import { api } from "~/trpc/react";

const ContinuousCapturePage = () => {
  const { videoRef, canvasRef, captureImage } = useCameraRecorder();
  const { recording, startRecording, stopRecording, audioBlob, audioUrl } =
    useAudioRecorder();
  const { addImage, setAudioContent, submitToOpenAI, clearAll } =
    useOpenAISubmission();

  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Initialize AudioContext
    audioContextRef.current = new (window.AudioContext ||
      window.AudioContext)();

    // Ensure audio context is resumed after user interaction, as some browsers
    // require user interaction to play audio
    const resumeAudioContext = async () => {
      await audioContextRef.current?.resume();
    };

    window.addEventListener("click", () => void resumeAudioContext());
    return () => window.removeEventListener("click", () => void resumeAudioContext());
  }, []);

  // Subscription to the streamAudio endpoint
  api.openai.streamAudio.useSubscription(undefined, {
    onData: async (data) => {
      if (!audioContextRef.current) return;
      const audioChunk = data.chunk; // Base64 encoded audio chunk
      const arrayBuffer = await fetch(
        `data:audio/mp3;base64,${audioChunk}`,
      ).then((res) => res.arrayBuffer());
      audioContextRef.current.decodeAudioData(
        arrayBuffer,
        (audioBuffer) => {
          const source = audioContextRef.current!.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContextRef.current!.destination);
          source.start();
        },
        (e) => console.error("Error decoding audio data", e),
      );
    },
    onError: (error) => {
      console.error("Error receiving audio chunk: ", error);
    },
  });

  const handleImage = () => {
    const dataUrl = captureImage();
    if (dataUrl) addImage(dataUrl);
  };

  const sendToOpenAI = async () => {
    await submitToOpenAI();
    clearAll();
  };

  const onAudioButtonRelease = async () => {
    stopRecording();

    if (audioBlob) {
      const buffer = Buffer.from(await audioBlob.arrayBuffer());
      const base64Audio = buffer.toString("base64");

      setAudioContent(base64Audio);
    }
  };

  useEffect(() => {
    const imageCaptureInterval = setInterval(handleImage, 5000);
    return () => clearInterval(imageCaptureInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const apiSubmissionInterval = setInterval(() => void sendToOpenAI(), 10000);
    return () => clearInterval(apiSubmissionInterval);
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
          onMouseUp={onAudioButtonRelease}
          onTouchStart={startRecording}
          onTouchEnd={onAudioButtonRelease}
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
