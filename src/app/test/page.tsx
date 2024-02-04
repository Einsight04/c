"use client";

import React, { useEffect, useState } from "react";
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

  // Subscription to the streamAudio endpoint
  api.openai.streamAudio.useSubscription(undefined, {
    onData: (data) => {
      // Assuming data.chunk is a base64-encoded audio string
      // convert from base64 to a Blob
    },
    onError: (error) => {
      console.error("Error receiving audio chunk: ", error);
    },
  });

  const handleImage = () => {
    const dataUrl = captureImage();
    if (dataUrl != undefined) {
      addImage(dataUrl);
    } else {
      console.log("dataUrl is undefined");
    }
  };

  const onAudioButtonRelease = async () => {
    stopRecording();

    if (audioBlob) {
      const buffer = Buffer.from(await audioBlob.arrayBuffer());
      const base64 = buffer.toString("base64");
      setAudioContent(base64);
    }
  };

  useEffect(() => {
    const captureInterval = setInterval(handleImage, 1000);
    return () => clearInterval(captureInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendToOpenAI = async () => {
    console.log("test")
    await submitToOpenAI();
    clearAll();
  };

  useEffect(() => {
    const submitInterval = setInterval(() => void sendToOpenAI(), 1000);
    return () => clearInterval(submitInterval);
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
