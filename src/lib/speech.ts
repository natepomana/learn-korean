export const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;

/** Reads Korean text aloud with the browser's built-in voice, if it has one. */
export function speakKorean(text: string) {
  if (!canSpeak) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ko-KR";
  utterance.rate = 0.75;
  const voice = speechSynthesis.getVoices().find((v) => v.lang.replace("_", "-").startsWith("ko"));
  if (voice) utterance.voice = voice;
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}
