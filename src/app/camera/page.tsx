"use client"

import React, { useEffect, useRef } from "react";

export default function Page() {
  // Specify the types for the refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Function to capture image from the video stream
  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Here you can convert the canvas image to a data URL and send it to OpenAI API
        const imageDataUrl = canvas.toDataURL("image/jpeg");
        console.log(imageDataUrl); // Log the data URL or send it to OpenAI
      }
    }
  };

  useEffect(() => {
    (async () => {
      const accessCamera = async () => {
        try {
          const constraints = { video: true };
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          const video = videoRef.current;
          if (video) {
            video.srcObject = stream;
            await video.play();
          }

          // Set an interval to capture image every second
          const intervalId = setInterval(captureImage, 1000);

          // Clear interval on component unmount
          return () => clearInterval(intervalId);
        } catch (error) {
          console.error("Error accessing the camera: ", error);
        }
      };

      await accessCamera();
    })().catch((error) => console.error("Error accessing the camera: ", error));
  }, []);

  return (
    <div>
      <h1>Hello, Home page!</h1>
      <video ref={videoRef} style={{ display: "none" }}></video>
      <canvas
        ref={canvasRef}
        style={{ display: "none" }}
        width="640"
        height="480"
      ></canvas>
    </div>
  );
}
