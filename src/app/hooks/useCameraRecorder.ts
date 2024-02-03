import { useEffect, useRef } from 'react';

// Define a custom hook called useVideoCapture
export function useVideoCapture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Function to capture an image from the video stream and log it
  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Convert the canvas image to a data URL and send it to OpenAI API or log it
        const imageDataUrl = canvas.toDataURL('image/jpeg');
        console.log(imageDataUrl); // Log the data URL or handle it as needed
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
        }
  
        // Set an interval to capture image every second
        const intervalId = setInterval(captureImage, 1000);
  
        // Clear interval on component unmount
        return () => clearInterval(intervalId);
      } catch (error) {
        console.error('Error accessing the camera: ', error);
      }
    };
  
    accessCamera().catch((error) => console.error('Error initializing camera: ', error));
  
    // Store the current value of the ref in a variable
    const currentVideo = videoRef.current;
  
    // Cleanup function to stop the video stream on component unmount
    return () => {
      if (currentVideo?.srcObject) {
        // Use the stored value of the video ref
        const tracks = (currentVideo.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []); // Empty dependency array means this effect runs only on mount and cleanup runs on unmount
  

  // Return the refs so they can be used in the component
  return { videoRef, canvasRef };
}
