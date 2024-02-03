"use client";

import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";

import { CreatePost } from "~/app/_components/create-post";
import { api } from "~/trpc/server";
import useAudioRecorder from "./hooks/useAudioRecorder";

export default function Home() {
  noStore();

  const { recording, startRecording, stopRecording, audioUrl } =
    useAudioRecorder();

  return (
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
      {audioUrl && (
        <div>
          <p>Recording Complete:</p>
          <audio src={audioUrl} controls />
        </div>
      )}
    </div>
  );
}
