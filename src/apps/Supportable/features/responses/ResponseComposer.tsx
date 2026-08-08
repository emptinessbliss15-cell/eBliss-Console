import { useEffect, useRef, useState } from "react";
import { Camera, Image, Mic, Paperclip, Play, Square, Video } from "lucide-react";

type ResponseMode = "text" | "voice" | "screen" | "visual" | "file";

const modeLabels: Record<ResponseMode, string> = {
  text: "Write",
  voice: "Record voice",
  screen: "Record screen",
  visual: "Visual",
  file: "Attach",
};

export function ResponseComposer() {
  const [mode, setMode] = useState<ResponseMode>("text");
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewKind, setPreviewKind] = useState<"audio" | "video" | "image" | "file" | "">("");
  const [status, setStatus] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  async function startRecording(kind: "voice" | "screen") {
    setStatus("");
    try {
      const stream = kind === "voice"
        ? await navigator.mediaDevices.getUserMedia({ audio: true })
        : await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => event.data.size && chunksRef.current.push(event.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || (kind === "voice" ? "audio/webm" : "video/webm") });
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(blob));
        setPreviewKind(kind === "voice" ? "audio" : "video");
        setRecording(false);
        setStatus("Recording ready to attach to the response.");
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };
      recorder.start();
      setRecording(true);
      setStatus(kind === "voice" ? "Recording voice…" : "Recording your screen…");
      stream.getVideoTracks().forEach((track) => {
        track.addEventListener("ended", () => {
          if (recorder.state !== "inactive") recorder.stop();
        });
      });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to start recording.");
      setRecording(false);
    }
  }

  function stopRecording() {
    if (recorderRef.current?.state !== "inactive") recorderRef.current?.stop();
  }

  function chooseFile(file: File | undefined) {
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setPreviewKind(file.type.startsWith("image/") ? "image" : "file");
    setStatus(`${file.name} ready to attach to the response.`);
  }

  function selectMode(next: ResponseMode) {
    setMode(next);
    setStatus("");
    if (next === "voice") void startRecording("voice");
    if (next === "screen") void startRecording("screen");
  }

  return <section className="response-composer">
    <div className="response-composer-heading">
      <div><div className="app-kicker">Response</div><h2>How would you like to respond?</h2></div>
      <span className="response-hint">People and agents can respond visually.</span>
    </div>
    <div className="response-tools" role="toolbar" aria-label="Response type">
      <button className={mode === "text" ? "selected" : ""} type="button" onClick={() => selectMode("text")}><Play size={16} />{modeLabels.text}</button>
      <button className={mode === "voice" ? "selected" : ""} type="button" onClick={() => selectMode("voice")}><Mic size={16} />{modeLabels.voice}</button>
      <button className={mode === "screen" ? "selected" : ""} type="button" onClick={() => selectMode("screen")}><Video size={16} />{modeLabels.screen}</button>
      <label className={mode === "visual" ? "response-tool selected" : "response-tool"}><Image size={16} />{modeLabels.visual}<input hidden type="file" accept="image/*" capture="environment" onChange={(event) => { setMode("visual"); chooseFile(event.target.files?.[0]); }} /></label>
      <label className={mode === "file" ? "response-tool selected" : "response-tool"}><Paperclip size={16} />{modeLabels.file}<input hidden type="file" onChange={(event) => { setMode("file"); chooseFile(event.target.files?.[0]); }} /></label>
    </div>

    {mode === "text" && <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Explain what you found, what you recommend, or what you need next…" />}
    {(mode === "voice" || mode === "screen") && <div className="record-panel">
      <div className="record-icon">{mode === "voice" ? <Mic size={28} /> : <Camera size={28} />}</div>
      <strong>{recording ? status : "Ready to record"}</strong>
      <span>{mode === "voice" ? "Record an explanation in your own voice." : "Show the requester exactly what to do on screen."}</span>
      {recording ? <button type="button" className="record-stop" onClick={stopRecording}><Square size={16} /> Stop recording</button> : <button type="button" onClick={() => void startRecording(mode)}><Mic size={16} /> Start</button>}
    </div>}

    {status && mode !== "voice" && mode !== "screen" && <p className="response-status">{status}</p>}
    {previewUrl && <div className="response-preview">
      {previewKind === "audio" && <audio controls src={previewUrl} />}
      {previewKind === "video" && <video controls src={previewUrl} />}
      {previewKind === "image" && <img src={previewUrl} alt="Response attachment preview" />}
      {previewKind === "file" && <span>Attachment ready: {previewUrl ? "local file" : ""}</span>}
    </div>}
    <div className="response-actions">
      <button type="button" className="primary-button" disabled={!text.trim() && !previewUrl} title="Response persistence will be connected to Supportable storage">Send response</button>
      <span>Attachments are prepared locally for now; storage and request linking come next.</span>
    </div>
  </section>;
}
