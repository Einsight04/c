import { useState, useCallback } from "react";
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
  const [response, setResponse] =
    useState<RouterOutputs["openai"]["sendTextAndImages"]>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clearAll = useCallback(() => {
    setAudio("");
    setImages([]);
    setResponse();
    setLoading(false);
    setError(null);
  }, []);

  const clearAudio = useCallback(() => {
    setAudio("");
  }, []);

  const clearImages = useCallback(() => {
    setImages([]);
  }, []);

  const addImage = useCallback((base64Data: string) => {
    const newImage: Base64Image = {
      id: Date.now().toString(),
      data: base64Data,
    };
    setImages((currentImages) => [...currentImages, newImage]); // Why are we passing in the old images???
  }, []);

  const setAudioContent = useCallback((textContent: string) => {
    setAudio(textContent);
  }, []);

  const submitToOpenAI = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await sendTextAndImages.mutateAsync({
        audioBase64: audio,
        imagesBase64: images.map(({ data }) => data),
      });
      setResponse(response);
    } catch (error) {
      console.error("Error submitting to OpenAI:", error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }, [sendTextAndImages, audio, images]);

  return {
    clearAll,
    clearAudio,
    clearImages,
    addImage,
    setAudioContent,
    submitToOpenAI,
    response,
    loading,
    error,
  };
};
