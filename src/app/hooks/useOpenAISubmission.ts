import { useState, useCallback } from "react";
import { api } from "~/trpc/react";
import { type RouterOutputs } from "~/trpc/shared";

type Base64Image = {
  id: string;
  data: string;
};

export const useOpenAISubmission = () => {
  const sendTextAndImages = api.openai.sendTextAndImages.useMutation();

  const [text, setText] = useState<string>("do you see the image");
  const [images, setImages] = useState<Base64Image[]>([]);
  const [response, setResponse] =
    useState<RouterOutputs["openai"]["sendTextAndImages"]>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clearAll = useCallback(() => {
    setText("");
    setImages([]);
    setResponse();
    setLoading(false);
    setError(null);
  }, []);

  const clearText = useCallback(() => {
    setText("");
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

  const setTextContent = useCallback((textContent: string) => {
    setText(textContent);
  }, []);

  const submitToOpenAI = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await sendTextAndImages.mutateAsync({
        text,
        images: images.map(({ data }) => data), // Why are we passing in the old images??? Remove mapping for single image
      });
      setResponse(response);
    } catch (error) {
      console.error("Error submitting to OpenAI:", error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  }, [sendTextAndImages, text, images]);

  return {
    clearAll,
    clearText,
    clearImages,
    addImage,
    setTextContent,
    submitToOpenAI,
    response,
    loading,
    error,
  };
};
