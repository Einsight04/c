"use client";

import { useCameraRecorder } from "~/app/hooks/useCameraRecorder";
import { useOpenAISubmission } from "~/app/hooks/useOpenAISubmission";
import useAudioRecorder from "~/app/hooks/useAudioRecorder";

export default function Page() {
  const { videoRef, canvasRef } = useCameraRecorder();
  const { addImage, submitToOpenAI, response, loading, error, setTextContent } =
    useOpenAISubmission();
  const { recording, startRecording, stopRecording, audioBlob } =
    useAudioRecorder();

  const handleCapture = () => {
    const canvas = canvasRef.current;
    setTextContent(audioBlob);
    if (canvas) {
      const context = canvas.getContext("2d");
      const video = videoRef.current;
      if (context && video) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL("image/jpeg");
        console.log("imageDataUrl", imageDataUrl);
        addImage(imageDataUrl); // Using the addImage function from useOpenAISubmission
      }
    }
  };

  const handleSubmit = async () => {
    await submitToOpenAI();
  };

  return (
    <div>
      <video ref={videoRef} style={{ display: "none" }}></video>
      <canvas
        ref={canvasRef}
        style={{ display: "none" }}
        width="640"
        height="480"
      ></canvas>
      <button onClick={handleCapture}>Capture Image</button>
      <button onClick={handleSubmit} disabled={loading}>
        Submit to OpenAI
      </button>
      {response && <div>Response: {JSON.stringify(response)}</div>}
      {error && <div>Error: {error}</div>}

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
        <button onClick={handleSubmit}>Test</button>
        {audioBlob && (
          <div>
            <p>Recording Complete:</p>
            <audio src={audioBlob} controls />
            {transcription && <p>Transcription: {transcription}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
