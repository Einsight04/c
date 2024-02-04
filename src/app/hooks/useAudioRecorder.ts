import { useState, useCallback } from "react";

type UseAudioRecorderReturn = {
  clearAudio: () => void;
  recording: boolean;
  audioUrl: string;
  audioBlob: Blob | null;
  startRecording: () => void;
  stopRecording: () => void;
};

const useAudioRecorder = (): UseAudioRecorderReturn => {
  const [recording, setRecording] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );

  const startRecording = useCallback(() => {
    navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: {
          facingMode: "environment",
        },
      })
      .then((stream) => {
        const recorder = new MediaRecorder(stream);
        const audioChunks: BlobPart[] = [];

        recorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        recorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: "audio/mp3" });
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          console.log(`Setting audioBlob HERE SHITTER`);
          if (audioBlob.size > 0) {
            console.log(`THERE IS A BLOB HERE 2`);
          } else {
            console.log(`THERE IS NO BLOB HERE 2 FUCK FUCK FUCK`);
          }
          setAudioBlob(audioBlob);
        };

        recorder.start();
        setRecording(true);
        setMediaRecorder(recorder);
      })
      .catch((err) => console.error("Error accessing the microphone", err));
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorder?.stop();
    setRecording(false);
    mediaRecorder?.stream.getTracks().forEach((track) => track.stop());
  }, [mediaRecorder]);

  const clearAudio = useCallback(() => {
    setRecording(false);
    setAudioUrl("");
    setAudioBlob(null);
  }, []);

  return {
    clearAudio,
    recording,
    audioUrl,
    audioBlob,
    startRecording,
    stopRecording,
  };
};

export default useAudioRecorder;
