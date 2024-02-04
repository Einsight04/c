import { useState, useCallback, useEffect } from "react";
import { api } from "~/trpc/react";
import { type RouterOutputs } from "~/trpc/shared";

type Base64Image = {
  id: string;
  data: string;
};

export const useOpenAISubmission = () => {
  const sendTextAndImages = api.openai.sendTextAndImages.useMutation();

  const [audio, setAudio] = useState<string>("");
  const [images, setImages] = useState<Base64Image[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);

  const clearAll = () => {
    setAudio("");
    setImages([]);
    setLoading(false);
    setError(null);
  };

  const addImage = (base64Data: string) => {
    const newImage: Base64Image = {
      id: Date.now().toString(),
      data: base64Data,
    };
    setImages((currentImages) => [...currentImages, newImage]);
  };

  const setAudioContent = (textContent: string) => {
    setAudio(textContent);
  };

  const submitToOpenAI = async () => {
    setLoading(true);
    setError(null);

    try {
      await sendTextAndImages.mutateAsync({
        audioBase64: audio,
        imagesBase64: images.map(({ data }) => data),
      });
    } catch (error) {
      console.error("Error submitting to OpenAI:", error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const doThing = async () => {
      if (!audio) return;

      await submitToOpenAI();
      clearAll();
    };

    void doThing();
  }, [audio]);

  return {
    clearAll,
    addImage,
    setAudioContent,
    submitToOpenAI,
    loading,
    error,
  };
};
