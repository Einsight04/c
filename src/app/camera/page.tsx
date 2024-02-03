"use client";

import { useCameraRecorder } from "~/app/hooks/useCameraRecorder";
import { useOpenAISubmission } from "~/app/hooks/useOpenAISubmission";

export default function Page() {
  const { videoRef, canvasRef } = useCameraRecorder();
  const { addImage, submitToOpenAI, response, loading, error, setTextContent } =
    useOpenAISubmission();

  const handleCapture = () => {
    const canvas = canvasRef.current;
    setTextContent("Do you see this image?");
    if (canvas) {
      const context = canvas.getContext("2d");
      const video = videoRef.current;
      if (context && video) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL("image/jpeg");
        console.log("imageDataUrl", imageDataUrl)
        addImage(imageDataUrl); // Using the addImage function from useOpenAISubmission
      }
    }
  };

  const handleSubmit = async () => {
    await submitToOpenAI();
  };

  return (
    <div>
    <video ref={videoRef} style={{ display: 'none' }}></video>
    <canvas ref={canvasRef} style={{ display: 'none' }} width="640" height="480"></canvas>
    <button onClick={handleCapture}>Capture Image</button>
    <button onClick={handleSubmit} disabled={loading}>Submit to OpenAI</button>
    {response && <div>Response: {JSON.stringify(response)}</div>}
    {error && <div>Error: {error}</div>}
  </div>
  );
}
