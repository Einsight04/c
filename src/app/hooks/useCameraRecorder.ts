import React, { useEffect, useRef, useState } from 'react';

// Define a custom hook called useCameraRecorder
export function useCameraRecorder() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // State to store the most recent image's data URL
  const [imageDataUrl, setImageDataUrl] = useState<string>('');

  // Function to capture an image from the video stream
  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Convert the canvas image to a data URL
        const dataUrl = canvas.toDataURL('image/jpeg');
        // Update the state with the new image data URL
        setImageDataUrl(dataUrl);
      }
    }
  };

  useEffect(() => {
    const accessCamera = async () => {
      try {
        const constraints = { video: true };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();

          // Set an interval to capture an image every second
          const intervalId = setInterval(captureImage, 1000);

          // Clear interval on component unmount
          return () => clearInterval(intervalId);
        }
      } catch (error) {
        console.error('Error accessing the camera: ', error);
      }
    };

    accessCamera().catch((error) => console.error('Error initializing camera: ', error));

    // Cleanup function to stop the video stream on component unmount
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []); // Empty dependency array means this effect runs only on mount and cleanup runs on unmount

  // Return the refs and the most recent image's data URL so they can be used in the component
  return { videoRef, canvasRef, imageDataUrl };
}
