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
      console.log(data.chunk);
      // const binary = atob(data.chunk);

      // const byteArr = new Uint8Array(binary.length);
      // for (let i = 0; i < binary.length; i++) {
      //   byteArr[i] = binary.charCodeAt(i);
      // }

      // const audioBlob = new Blob([byteArr], { type: "audio/mp3" });
      // const audioUrl = URL.createObjectURL(audioBlob);
      // console.log(audioUrl);

      //   const audioElement = new Audio(audioUrl);
      //   audioElement
      //     .play()
      //     .then(() => {
      //       // Audio playback started
      //     })
      //     .catch((error) => {
      //       console.error("Error playing audio:", error);
      //     });

      //   // Optional: Revoke the Object URL to free up resources once it's no longer needed
      //   audioElement.onended = () => {
      //     URL.revokeObjectURL(audioUrl);
      //   };
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
      console.log("audioBlob is not undefined");
      const buffer = Buffer.from(await audioBlob.arrayBuffer());
      const base64 = buffer.toString("base64");
      setAudioContent(base64);
    }
  };

  useEffect(() => {
    const captureInterval = setInterval(handleImage, 5000);
    return () => clearInterval(captureInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendToOpenAI = async () => {
    await submitToOpenAI();
    clearAll();
  };

  useEffect(() => {
    const submitInterval = setInterval(() => void sendToOpenAI(), 10000);
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
