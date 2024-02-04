// "use client";
// import { useState } from "react";
// import  useCameraRecorder  from "~/app/hooks/useCameraRecorder";
// import { useOpenAISubmission } from "~/app/hooks/useOpenAISubmission";
// import { api } from "~/trpc/react";
// import useAudioRecorder from "~/app/hooks/useAudioRecorder";

// export default function Page() {
//   const { videoRef, canvasRef, captureImage } = useCameraRecorder();
//   const { addImage, submitToOpenAI, response, loading, error, setAudioContent } =
//     useOpenAISubmission();
//   const { recording, startRecording, stopRecording, audioBlob, audioUrl } =
//     useAudioRecorder();

//   const [counter, setCounter] = useState(0);

//   const handleCapture = async () => {
//     captureImage();
//     if (audioBlob == null) {
//       console.log("No audio buffer");
//       return;
//     }
//     const buffer = Buffer.from(await audioBlob.arrayBuffer());
//     const b = buffer.toString("base64");
//     setAudioContent(b);
//   };

//   api.openai.streamAudio.useSubscription(undefined, {
//     onData: (data) => {
//       setCounter((prev) => prev + 1);
//       console.log(counter);
//       console.log(data.chunk);
//     },
//     onError: (err) => {
//       console.error(err);
//     },
//     onStarted() {
//       console.log("stream started");
//     },
//   });

//   const handleSubmit = async () => {
//     await submitToOpenAI();
//   };

//   return (
//     <div>
//       <video ref={videoRef} style={{ display: "none" }}></video>
//       <canvas
//         ref={canvasRef}
//         style={{ display: "none" }}
//         width="640"
//         height="480"
//       ></canvas>
//       <button onClick={handleCapture}>Capture Image</button>
//       <button onClick={handleCapture} disabled={loading}>
//         Submit to OpenAI
//       </button>
//       {response && <div>Response: {JSON.stringify(response)}</div>}
//       {error && <div>Error: {error}</div>}

//       <div style={{ padding: "20px", textAlign: "center" }}>
//         <button
//           onMouseDown={startRecording}
//           onMouseUp={stopRecording}
//           onTouchStart={startRecording}
//           onTouchEnd={stopRecording}
//           style={{
//             padding: "10px 20px",
//             fontSize: "16px",
//             cursor: "pointer",
//             backgroundColor: recording ? "#ffaaaa" : "#aaffaa",
//             border: "none",
//             borderRadius: "5px",
//           }}
//         >
//           {recording ? "Recording... Release to stop" : "Hold to record"}
//         </button>
//         <button onClick={handleSubmit}>Test</button>
//         {audioUrl && (
//           <div>
//             <p>Recording Complete:</p>
//             <audio src={audioUrl} controls />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }