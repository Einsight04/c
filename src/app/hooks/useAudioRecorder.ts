import { useState, useCallback } from "react";

type UseAudioRecorderReturn = {
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
      .getUserMedia({ audio: true })
      .then((stream) => {
        const recorder = new MediaRecorder(stream);
        const audioChunks: BlobPart[] = [];

        recorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        recorder.onstop = () => {
          const audioBlob2 = new Blob(audioChunks, { type: "audio/mp3" });
          const url = URL.createObjectURL(audioBlob2);
          setAudioUrl(url);
          setAudioBlob(audioBlob2);
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

  return {
    recording,
    audioUrl,
    audioBlob,
    startRecording,
    stopRecording,
  };
};

export default useAudioRecorder;
