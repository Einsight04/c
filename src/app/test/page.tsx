"use client";

import React, { useEffect, useRef, useState } from "react";
import useAudioRecorder from "~/app/hooks/useAudioRecorder";
import useCameraRecorder from "~/app/hooks/useCameraRecorder";
import { useOpenAISubmission } from "~/app/hooks/useOpenAISubmission";
import { api } from "~/trpc/react";

const ContinuousCapturePage = () => {
  const { videoRef, canvasRef, captureImage } = useCameraRecorder();
  const { recording, startRecording, stopRecording, audioBlob } =
    useAudioRecorder();
  const { addImage, setAudioContent, submitToOpenAI, clearAll } =
    useOpenAISubmission();

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
    return () => window.removeEventListener("click", () => void resumeAudioContext());
  }, []);

  const playNextChunk = async () => {
    if (
      isPlayingRef.current ||
      audioQueue.current.length === 0 ||
      !audioContextRef.current
    )
      return;

    isPlayingRef.current = true;
    const audioChunk = audioQueue.current.shift();
    if (audioChunk === null) return;

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
      playNextChunk();
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

  useEffect(() => {
    const setAudio = async () => {
      if (!audioBlob) return;

      const buffer = Buffer.from(await audioBlob.arrayBuffer());
      const base64Audio = buffer.toString("base64");
      setAudioContent(base64Audio);
    };

    void setAudio();
  }, [audioBlob, setAudioContent]);

  // useEffect(() => {
  //   const imageCaptureInterval = setInterval(handleImage, 10000);
  //   return () => clearInterval(imageCaptureInterval);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  // useEffect(() => {
  //   const apiSubmissionInterval = setInterval(() => void sendToOpenAI(), 10000);
  //   return () => clearInterval(apiSubmissionInterval);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

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
        <button
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
