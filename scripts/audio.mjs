// Text-to-speech and MP3 stitching for Bloodsport Center episodes.
// Voices come from OpenAI's speech API (OPENAI_API_KEY); no ffmpeg needed.

const TTS_MODEL = "gpt-4o-mini-tts";

export const VOICES = {
  mike: {
    voice: "onyx",
    instructions: "You are Big Mike Malone, a loud, hyped-up sports highlight show anchor. Big energy, quick pace, theatrical emphasis on scores and names, like you live for blowouts. Never whisper."
  },
  tasha: {
    voice: "nova",
    instructions: "You are Tasha Reid, a sharp sports highlight show anchor. Dry, deadpan, confident delivery with a hint of sarcasm. Crisp and clear, measured pace, land the punchline flat."
  }
};


export async function speak(speaker, text) {
  const { voice, instructions } = VOICES[speaker];
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ model: TTS_MODEL, voice, instructions, input: text, response_format: "mp3" })
  });

  if (response.status === 401) {
    throw new Error("OpenAI rejected the API key. Make a new key and update the VIDEO_API secret.");
  }
  if (!response.ok) {
    throw new Error(`OpenAI speech API returned HTTP ${response.status}: ${(await response.text()).slice(0, 200)}`);
  }
  return Buffer.from(await response.arrayBuffer());
}


// ======================================
// MP3 FRAMES
// Clips are joined frame by frame. ID3 tags and Xing/Info headers are dropped, because a header
// from one clip in the middle of the file would make players misjudge the length.
// ======================================

const BITRATES = {
  1: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
  2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160]
};
const SAMPLE_RATES = {
  1: [44100, 48000, 32000],
  2: [22050, 24000, 16000],
  2.5: [11025, 12000, 8000]
};

function frameAt(buffer, offset) {
  if (offset + 4 > buffer.length || buffer[offset] !== 0xff || (buffer[offset + 1] & 0xe0) !== 0xe0) return null;
  const versionBits = (buffer[offset + 1] >> 3) & 0x03;
  const layerBits = (buffer[offset + 1] >> 1) & 0x03;
  const bitrateIndex = buffer[offset + 2] >> 4;
  const sampleRateIndex = (buffer[offset + 2] >> 2) & 0x03;
  const padding = (buffer[offset + 2] >> 1) & 0x01;
  // Layer III only, no reserved values
  if (versionBits === 1 || layerBits !== 1 || bitrateIndex === 0 || bitrateIndex === 15 || sampleRateIndex === 3) return null;

  const version = versionBits === 3 ? 1 : (versionBits === 2 ? 2 : 2.5);
  const bitrate = BITRATES[version === 1 ? 1 : 2][bitrateIndex] * 1000;
  const sampleRate = SAMPLE_RATES[version][sampleRateIndex];
  const samples = version === 1 ? 1152 : 576;
  const length = Math.floor((samples / 8) * bitrate / sampleRate) + padding;
  return { length, seconds: samples / sampleRate };
}

function skipId3(buffer) {
  if (buffer.length > 10 && buffer.toString("latin1", 0, 3) === "ID3") {
    const size = (buffer[6] << 21) | (buffer[7] << 14) | (buffer[8] << 7) | buffer[9];
    return 10 + size;
  }
  return 0;
}

// Audio frames of one clip, plus its exact duration
export function mp3Frames(buffer) {
  const frames = [];
  let seconds = 0;
  let offset = skipId3(buffer);

  while (offset < buffer.length) {
    const frame = frameAt(buffer, offset);
    if (!frame) {
      offset += 1;
      continue;
    }
    const bytes = buffer.subarray(offset, offset + frame.length);
    const tag = bytes.toString("latin1", 0, Math.min(bytes.length, 64));
    if (frames.length === 0 && (tag.includes("Xing") || tag.includes("Info"))) {
      offset += frame.length;
      continue;
    }
    frames.push(bytes);
    seconds += frame.seconds;
    offset += frame.length;
  }

  if (frames.length === 0) {
    throw new Error("The speech API returned audio with no MP3 frames.");
  }
  return { frames, seconds };
}
