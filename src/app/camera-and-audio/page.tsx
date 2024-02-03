import React from 'react';
import useAudioRecorder from '~/app/hooks/useAudioRecorder'; 
import { api } from "~/trpc/react";

const AudioRecordComponent = () => {
  const { recording, startRecording, stopRecording, audioBlob } = useAudioRecorder();

  const handleSendAudio = async () => {
    if (audioBlob) {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.mp3');

      try {
        const response = await fetch('YOUR_ENDPOINT_URL', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        console.log('Upload successful', data);
      } catch (error) {
        console.error('Error uploading the audio file', error);
      }
    }
  };

  return (
    <div>
      <button onClick={startRecording} disabled={recording}>
        Start Recording
      </button>
      <button onClick={stopRecording} disabled={!recording}>
        Stop Recording
      </button>
      <button onClick={handleSendAudio} disabled={!audioBlob}>
        Send Audio
      </button>
    </div>
  );
};

export default AudioRecordComponent;
