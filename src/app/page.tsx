"use client";

import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";

import { CreatePost } from "~/app/_components/create-post";
import { api } from "~/trpc/react";
import useAudioRecorder from "./hooks/useAudioRecorder";
import { createClient } from "@deepgram/sdk";
import { useEffect, useState } from "react";

export default function Home() {
  noStore();

  const { recording, startRecording, stopRecording, audioUrl, audioBlob } =
    useAudioRecorder();
  const sendTextAndImages = api.openai.sendTextAndImages.useMutation();
  const [counter, setCounter] = useState(0);

  api.openai.streamAudio.useSubscription(undefined, {
    onData: (data) => {
      setCounter((prev) => prev + 1);
      console.log(counter);
      // console.log(data.chunk);
    },
    onError: (err) => {
      console.error(err);
    },
    onStarted() {
      console.log("stream started");
    },
  });

  const testEndToEndShitMinusDeepgram = async () => {
    await sendTextAndImages.mutateAsync({
      audioBase64: "hello world",
      imagesBase64: [],
    });
  };

  // async function transcribeAudio() {
  //   const buff = Buffer.from(await audioBlob!!.arrayBuffer());

  //   const { result } = await deepgram.mutateAsync(buff.toString("base64"));
  //   setTranscription(result);
  // }

  // useEffect(() => {
  //   if (recording === false && audioBlob) {
  //     transcribeAudio();
  //   }
  // }, [audioBlob]);

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
      <button onClick={testEndToEndShitMinusDeepgram}>Test</button>
      {audioUrl && (
        <div>
          <p>Recording Complete:</p>
          <audio src={audioUrl} controls />
          {transcription && <p>Transcription: {transcription}</p>}
        </div>
      )}
    </div>
  );
}
