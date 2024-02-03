import { useState, useCallback } from "react";

type UseAudioRecorderReturn = {
  recording: boolean;
  audioUrl: string;
  startRecording: () => void;
  stopRecording: () => void;
};

const useAudioRecorder = (): UseAudioRecorderReturn => {
  const [recording, setRecording] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string>("");
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
          const audioBlob = new Blob(audioChunks, { type: "audio/mp4" });
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
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
    startRecording,
    stopRecording,
  };
};

export default useAudioRecorder;
