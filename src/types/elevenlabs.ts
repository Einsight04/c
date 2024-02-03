type Alignment = {
  char_start_times_ms: number[];
  chars_durations_ms: number[];
  chars: string[];
};

export type AudioData = {
  audio: string; // Base64 encoded string
  isFinal: boolean;
  normalizedAlignment: Alignment;
  alignment: Alignment;
};

