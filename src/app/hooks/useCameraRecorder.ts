import React, { useEffect, useRef, useState } from "react";

// Define a custom hook called useCameraRecorder
export default function useCameraRecorder() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // State to store the most recent image's data URL

  // Function to capture an image from the video stream
  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Convert the canvas image to a data URL
        const dataUrl = canvas.toDataURL("image/jpeg");

        // console.log("imageDataUrl", dataUrl);
        return dataUrl;
      }
    }
  };

  useEffect(() => {
    const accessCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
        }
      } catch (error) {
        console.error("Error accessing the camera: ", error);
      }
    };

    accessCamera().catch((error) =>
      console.error("Error initializing camera: ", error),
    );

    // Cleanup function to stop the video stream on component unmount
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []); // Empty dependency array means this effect runs only on mount and cleanup runs on unmount

  // Return the refs and the most recent image's data URL so they can be used in the component
  return { videoRef, canvasRef, captureImage };
}
