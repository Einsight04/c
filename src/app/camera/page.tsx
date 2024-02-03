"use client"

import React, { useEffect, useRef } from "react";
import { useVideoCapture } from "~/app/hooks/useCameraRecorder";

export default function Page() {
  const { videoRef, canvasRef } = useVideoCapture(); 


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
