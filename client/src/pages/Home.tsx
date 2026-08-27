import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, PointerEvent as ReactPointerEvent } from "react";
import {
  ArrowDownToLine,
  ArrowUpRight,
  BadgeCheck,
  Brush,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Copy,
  Download,
  Eraser,
  FileImage,
  FolderOpen,
  ImagePlus,
  Info,
  Layers3,
  Link2,
  Loader2,
  LockKeyhole,
  Moon,
  Palette,
  Paintbrush,
  RotateCcw,
  ScanLine,
  Scissors,
  Share2,
  SlidersHorizontal,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  UploadCloud,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

// Paper Cut Studio reminder: this page should feel like a calm local photo studio—tactile paper layers, direct bilingual copy, and one clear next step.

type ItemStatus = "queued" | "processing" | "done" | "error";
type UploadItem = {
  id: string;
  name: string;
  originalUrl: string;
  resultUrl?: string;
  status: ItemStatus;
};
type BackgroundChoice = "transparent" | "white" | "black" | "red" | "blue" | "custom" | "image";
type SizePreset = "original" | "passport" | "stamp" | "square";
type BrushMode = "erase" | "restore";
type Stroke = { x: number; y: number; size: number; mode: BrushMode };

declare global {
  interface Window {
    SelfieSegmentation?: new (options: { locateFile: (file: string) => string }) => {
      setOptions: (options: { modelSelection: number }) => void;
      onResults: (callback: (results: { image: HTMLImageElement | HTMLCanvasElement; segmentationMask: HTMLCanvasElement }) => void) => void;
      send: (payload: { image: HTMLImageElement }) => Promise<void>;
      close: () => void;
    };
  }
}

const HERO_IMAGE = "/manus-storage/cutbg-hero-reference_1907a606.png";
const BEFORE_AFTER_IMAGE = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1400&q=86";
const PRIVACY_IMAGE = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=86";
const LOGO_IMAGE = "/manus-storage/cutbg-logo_1be472be.png";

const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      if (window.SelfieSegmentation) resolve();
      else existing.addEventListener("load", () => resolve(), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("model-load-failed"));
    document.head.appendChild(script);
  });
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read-failed"));
    reader.readAsDataURL(file);
  });
}

function imageFromUrl(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image-load-failed"));
    image.src = url;
  });
}

async function removeImageBackground(dataUrl: string) {
  await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js");
  if (!window.SelfieSegmentation) throw new Error("model-missing");
  const source = await imageFromUrl(dataUrl);
  const segmentation = new window.SelfieSegmentation({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
  });
  segmentation.setOptions({ modelSelection: 1 });
  const output = document.createElement("canvas");
  output.width = source.naturalWidth;
  output.height = source.naturalHeight;
  const context = output.getContext("2d");
  if (!context) throw new Error("canvas-failed");

  return new Promise<string>((resolve, reject) => {
    segmentation.onResults((results) => {
      try {
        context.clearRect(0, 0, output.width, output.height);
        context.drawImage(results.image, 0, 0, output.width, output.height);
        context.globalCompositeOperation = "destination-in";
        context.drawImage(results.segmentationMask, 0, 0, output.width, output.height);
        context.globalCompositeOperation = "source-over";
        segmentation.close();
        resolve(output.toDataURL("image/png"));
      } catch {
        segmentation.close();
        reject(new Error("mask-failed"));
      }
    });
    segmentation.send({ image: source }).catch(() => {
      segmentation.close();
      reject(new Error("processing-failed"));
    });
  });
}

async function composeEditedImage(
  cutoutUrl: string,
  originalUrl: string,
  strokes: Stroke[],
  previewWidth = 1000,
) {
  const cutout = await imageFromUrl(cutoutUrl);
  const original = await imageFromUrl(originalUrl);
  const canvas = document.createElement("canvas");
  const ratio = cutout.naturalHeight / cutout.naturalWidth;
  canvas.width = previewWidth;
  canvas.height = Math.round(previewWidth * ratio);
  const context = canvas.getContext("2d");
  if (!context) return cutoutUrl;
  context.drawImage(cutout, 0, 0, canvas.width, canvas.height);
  strokes.forEach((stroke) => {
    const x = stroke.x * canvas.width;
    const y = stroke.y * canvas.height;
    const radius = (stroke.size / 100) * canvas.width;
    context.save();
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.clip();
    if (stroke.mode === "erase") {
      context.globalCompositeOperation = "destination-out";
      context.fillStyle = "rgba(0,0,0,1)";
      context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    } else {
      context.globalCompositeOperation = "source-over";
      context.drawImage(original, 0, 0, canvas.width, canvas.height);
    }
    context.restore();
  });
  return canvas.toDataURL("image/png");
}

function downloadBlob(url: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function localUsageCount() {
  if (typeof window === "undefined") return 0;
  return Number(window.localStorage.getItem("cutbg-local-usage") ?? "0");
}

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [slider, setSlider] = useState(58);
  const [background, setBackground] = useState<BackgroundChoice>("transparent");
  const [customColor, setCustomColor] = useState("#F7F0E6");
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [sizePreset, setSizePreset] = useState<SizePreset>("original");
  const [format, setFormat] = useState<"png" | "jpg">("png");
  const [brushMode, setBrushMode] = useState<BrushMode>("erase");
  const [brushEnabled, setBrushEnabled] = useState(false);
  const [brushSize, setBrushSize] = useState(5);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [displayUrl, setDisplayUrl] = useState<string | undefined>();
  const [isDark, setIsDark] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showMobileControls, setShowMobileControls] = useState(false);

  const activeItem = useMemo(() => items.find((item) => item.id === activeId), [items, activeId]);
  const finishedCount = items.filter((item) => item.status === "done").length;
  const isWorking = items.some((item) => item.status === "processing");
  const hasResults = items.length > 0;
  const previewSource = displayUrl ?? activeItem?.resultUrl;

  useEffect(() => {
    setUsageCount(localUsageCount());
  }, []);

  useEffect(() => {
    if (!activeItem?.resultUrl || strokes.length === 0) {
      setDisplayUrl(activeItem?.resultUrl);
      return;
    }
    let cancelled = false;
    composeEditedImage(activeItem.resultUrl, activeItem.originalUrl, strokes).then((url) => {
      if (!cancelled) setDisplayUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [activeItem?.id, activeItem?.resultUrl, activeItem?.originalUrl, strokes]);

  const showFriendlyError = (message = "শুধু ছবি আপলোড করুন। / Please choose an image file.") => {
    toast.error(message, { duration: 4200 });
  };

  const processOne = async (item: UploadItem) => {
    setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, status: "processing" } : entry)));
    try {
      const resultUrl = await removeImageBackground(item.originalUrl);
      setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, status: "done", resultUrl } : entry)));
      const nextUsage = localUsageCount() + 1;
      window.localStorage.setItem("cutbg-local-usage", String(nextUsage));
      setUsageCount(nextUsage);
    } catch {
      setItems((current) => current.map((entry) => (entry.id === item.id ? { ...entry, status: "error" } : entry)));
      toast.error("কাজটি শেষ করা যায়নি। আবার চেষ্টা করুন। / Something went wrong. Please try again.");
    }
  };

  const handleFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const images = files.filter((file) => file.type.startsWith("image/"));
    if (images.length !== files.length) showFriendlyError();
    if (images.length === 0) return;
    const created: UploadItem[] = await Promise.all(
      images.map(async (file) => ({ id: makeId(), name: file.name, originalUrl: await readFileAsDataUrl(file), status: "queued" as ItemStatus })),
    );
    setItems((current) => [...current, ...created]);
    if (!activeId) setActiveId(created[0].id);
    for (const item of created) await processOne(item);
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) void handleFiles(event.target.files);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files.length) void handleFiles(event.dataTransfer.files);
  };

  const handleBackgroundImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showFriendlyError();
      return;
    }
    setBackgroundImage(await readFileAsDataUrl(file));
    setBackground("image");
    event.target.value = "";
  };

  const selectActiveItem = (id: string) => {
    setActiveId(id);
    setStrokes([]);
    setDisplayUrl(undefined);
    setShowMobileControls(true);
  };

  const clearAll = () => {
    setItems([]);
    setActiveId(null);
    setStrokes([]);
    setDisplayUrl(undefined);
    setShowMobileControls(false);
  };

  const updateSliderFromPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!previewRef.current) return;
    const bounds = previewRef.current.getBoundingClientRect();
    setSlider(Math.min(100, Math.max(0, ((event.clientX - bounds.left) / bounds.width) * 100)));
  };

  const handleBrush = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!previewRef.current || !activeItem?.resultUrl) return;
    const bounds = previewRef.current.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
    const y = Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height));
    setStrokes((current) => [...current, { x, y, size: brushSize, mode: brushMode }]);
  };

  const exportImage = async () => {
    if (!previewSource || !activeItem) return;
    const source = await imageFromUrl(previewSource);
    const presets: Record<SizePreset, { width?: number; height?: number }> = {
      original: {},
      passport: { width: 600, height: 600 },
      stamp: { width: 240, height: 300 },
      square: { width: 1000, height: 1000 },
    };
    const selected = presets[sizePreset];
    const width = selected.width ?? source.naturalWidth;
    const height = selected.height ?? source.naturalHeight;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return;
    if (background === "transparent") {
      context.clearRect(0, 0, width, height);
    } else if (background === "image" && backgroundImage) {
      const backdrop = await imageFromUrl(backgroundImage);
      const scale = Math.max(width / backdrop.naturalWidth, height / backdrop.naturalHeight);
      const drawWidth = backdrop.naturalWidth * scale;
      const drawHeight = backdrop.naturalHeight * scale;
      context.drawImage(backdrop, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
    } else {
      const colors: Record<Exclude<BackgroundChoice, "transparent" | "image">, string> = {
        white: "#ffffff",
        black: "#151515",
        red: "#e4572e",
        blue: "#1f4f6e",
        custom: customColor,
      };
      context.fillStyle = colors[background as Exclude<BackgroundChoice, "transparent" | "image">];
      context.fillRect(0, 0, width, height);
    }
    const scale = Math.min(width / source.naturalWidth, height / source.naturalHeight);
    const drawWidth = source.naturalWidth * scale;
    const drawHeight = source.naturalHeight * scale;
    context.drawImage(source, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
    const dataUrl = canvas.toDataURL(format === "png" ? "image/png" : "image/jpeg", 0.92);
    downloadBlob(dataUrl, `cutbg-${activeItem.name.replace(/\.[^/.]+$/, "")}.${format}`);
    toast.success(`ডাউনলোড প্রস্তুত। / ${format.toUpperCase()} download ready.`);
  };

  const downloadAll = async () => {
    const done = items.filter((item) => item.status === "done");
    for (const item of done) {
      if (item.resultUrl) downloadBlob(item.resultUrl, `cutbg-${item.name.replace(/\.[^/.]+$/, "")}.png`);
    }
    if (done.length) toast.success(`${done.length}টি ছবি ডাউনলোড হচ্ছে। / Downloading ${done.length} images.`);
  };

  const sharePage = async (channel: "whatsapp" | "facebook" | "copy") => {
    const text = "CutBG — ফ্রি অনলাইন Background Remover";
    const url = window.location.href;
    if (channel === "copy") {
      await navigator.clipboard?.writeText(url);
      toast.success("লিংক কপি হয়েছে। / Link copied.");
      return;
    }
    const target = channel === "whatsapp" ? `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}` : `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(target, "_blank", "noopener,noreferrer");
  };

  const faqItems = [
    {
      q: "ছবি কি কোথাও upload হয়? / Is my photo uploaded anywhere?",
      a: "না। CutBG আপনার browser-এর ভেতরেই কাজ করে। আপনার ছবি কোনো server-এ পাঠানো হয় না।",
    },
    {
      q: "এটা কি সত্যিই free? / Is it really free?",
      a: "হ্যাঁ—login, signup বা hidden paywall নেই। ভবিষ্যতে website চালাতে ads থাকতে পারে, কিন্তু tool ব্যবহার free থাকবে।",
    },
    {
      q: "কোন format download করতে পারব? / Which formats can I download?",
      a: "Transparent background-এর জন্য PNG সবচেয়ে ভালো। রঙিন background চাইলে JPG-ও বেছে নিতে পারেন।",
    },
    {
      q: "ছবির edge ভুল হলে কী করব? / What if an edge is wrong?",
      a: "Edit panel থেকে Erase অথবা Restore brush বেছে নিয়ে ছবির ওপর আঙুল/মাউস দিয়ে ছোট ছোট stroke দিন।",
    },
  ];

  return (
    <div className={`app-shell ${isDark ? "dark-mode" : ""}`}>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#top" aria-label="CutBG home">
            <span className="brand-mark"><img src={LOGO_IMAGE} alt="" /></span>
            <span className="brand-type"><strong>CutBG</strong><span>সহজে ছবি কাটুন</span></span>
          </a>
          <nav className="desktop-nav" aria-label="Main navigation">
            <a href="#how-it-works">কীভাবে কাজ করে</a>
            <a href="#faq">সাধারণ প্রশ্ন</a>
            <a href="#about">আমাদের কথা</a>
          </nav>
          <div className="header-actions">
            <span className="free-chip"><span className="live-dot" /> 100% Free</span>
            <button className="icon-button" type="button" onClick={() => setIsDark((current) => !current)} aria-label="Toggle dark mode">
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <a className="header-cta" href="#workspace">ছবি কাটুন <ArrowUpRight size={16} /></a>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="hero-inner">
            <div className="hero-copy">
              <div className="eyebrow"><span className="eyebrow-line" /> FREE BROWSER TOOL</div>
              <h1>ছবি দিন,<br /><em>ব্যাকগ্রাউন্ড নেই।</em></h1>
              <p className="hero-lede">এক ক্লিকে ছবির background remove করুন। কোনো login নেই, কোনো upload নেই—আপনার ছবি আপনার browser-এই থাকে।</p>
              <div className="hero-actions">
                <a className="primary-button" href="#workspace"><UploadCloud size={19} /> ছবি বাছাই করুন <span>Choose image</span></a>
                <span className="hero-note"><LockKeyhole size={14} /> 100% private · browser-based</span>
              </div>
              <div className="hero-proof">
                <div className="proof-avatars"><span>স</span><span>র</span><span>ম</span><span>+</span></div>
                <div><strong>{usageCount > 0 ? `${usageCount}টি` : "আপনার"} ছবি ready</strong><span>এই browser-এ processed</span></div>
              </div>
            </div>
            <div className="hero-visual-wrap">
              <div className="hero-paper-tag tag-top"><Scissors size={13} /> CUT CLEAN</div>
              <div className="hero-visual">
                <img src={HERO_IMAGE} alt="A portrait being separated from its background" />
                <div className="hero-caption"><span className="checker-swatch" /><span>transparent<br /><strong>ready to use</strong></span><ArrowUpRight size={19} /></div>
              </div>
              <div className="hero-paper-tag tag-bottom"><span className="paper-corner" /> No cloud. No queue.</div>
              <div className="orange-slice" />
            </div>
          </div>
        </section>

        <section className="workspace-section" id="workspace">
          <div className="section-ribbon"><span>01</span><span>REMOVE A BACKGROUND</span><span className="ribbon-rule" /></div>
          <div className="workspace-shell">
            <div className="workspace-heading">
              <div><p className="kicker">শুরু করুন / START HERE</p><h2>আপনার ছবি এখানে ছাড়ুন</h2><p>Drag & drop করুন, অথবা button-এ চাপুন। বাকিটা CutBG করবে।</p></div>
              {hasResults && <button type="button" className="text-button danger-text" onClick={clearAll}><RotateCcw size={15} /> নতুন ছবি / Start over</button>}
            </div>

            {!hasResults ? (
              <div className={`upload-stage ${isDragging ? "is-dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") fileInputRef.current?.click(); }}>
                <input ref={fileInputRef} className="visually-hidden" type="file" accept="image/*" multiple onChange={handleInput} />
                <div className="upload-orbit"><span /><span /><span /><UploadCloud size={30} /></div>
                <h3>ছবি এখানে ছাড়ুন</h3>
                <p>অথবা <strong>ছবি বাছাই করুন</strong> / browse from phone</p>
                <div className="upload-meta"><span><ImagePlus size={14} /> JPG, PNG, WEBP</span><span><Zap size={14} /> একসাথে অনেক ছবি</span><span><LockKeyhole size={14} /> upload হয় না</span></div>
              </div>
            ) : (
              <div className="editor-shell">
                <div className="batch-strip">
                  <div className="batch-title"><Layers3 size={17} /><span><strong>{items.length}টি ছবি</strong><small>{finishedCount}টি complete · {isWorking ? "processing চলছে" : "ready to download"}</small></span></div>
                  <div className="batch-actions"><button type="button" className="secondary-button small-button" onClick={() => fileInputRef.current?.click()}><input ref={fileInputRef} className="visually-hidden" type="file" accept="image/*" multiple onChange={handleInput} /><ImagePlus size={15} /> আরও ছবি</button>{finishedCount > 1 && <button type="button" className="secondary-button small-button" onClick={() => void downloadAll()}><ArrowDownToLine size={15} /> সব ডাউনলোড</button>}</div>
                </div>
                <div className="editor-grid">
                  <div className="preview-column">
                    <div className="preview-topline"><span className="preview-title"><ScanLine size={15} /> BEFORE / AFTER</span><span className="preview-hint">slider টেনে দেখুন</span></div>
                    <div className="compare-frame" ref={previewRef} onPointerDown={(event) => { event.currentTarget.setPointerCapture?.(event.pointerId); if (brushEnabled) handleBrush(event); else updateSliderFromPointer(event); }} onPointerMove={(event) => { if (event.buttons === 1) { if (brushEnabled) handleBrush(event); else updateSliderFromPointer(event); } }}>
                      {activeItem?.status === "processing" && <div className="processing-overlay"><div className="processing-spinner"><Loader2 size={24} /></div><strong>AI কাজ করছে...</strong><span>ছবিটি browser-এ process হচ্ছে</span></div>}
                      {activeItem && previewSource && <>
                        <div className={`compare-after checkerboard ${background === "white" ? "back-white" : ""}`} style={background === "black" ? { background: "#151515" } : background === "red" ? { background: "#e4572e" } : background === "blue" ? { background: "#1f4f6e" } : background === "custom" ? { background: customColor } : background === "image" && backgroundImage ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}><img src={previewSource} alt="Processed cutout" /></div>
                        <div className="compare-before" style={{ width: `${slider}%` }}><img src={activeItem.originalUrl} alt="Original image" /></div>
                        <div className="compare-handle" style={{ left: `${slider}%` }}><span><ChevronRight size={15} /><ChevronRight size={15} /></span></div>
                        <span className="compare-label label-before">ORIGINAL</span><span className="compare-label label-after">CUTOUT</span>
                      </>}
                      {activeItem?.status === "error" && <div className="empty-preview"><Info size={26} /><strong>আবার চেষ্টা করুন</strong><span>Something went wrong</span><button type="button" className="text-button" onClick={() => activeItem && void processOne(activeItem)}>Retry</button></div>}
                      <input className="compare-range" type="range" min="0" max="100" value={slider} onChange={(event) => setSlider(Number(event.target.value))} aria-label="Before and after comparison" />
                    </div>
                    <div className="preview-footer"><span><span className="status-dot" /> {activeItem?.status === "done" ? "Ready · আপনার ছবি browser-এ" : "Processing..."}</span><span>{activeItem?.name}</span></div>
                  </div>
                  <div className={`control-rail ${showMobileControls ? "mobile-open" : ""}`}>
                    <button type="button" className="mobile-control-toggle" onClick={() => setShowMobileControls((current) => !current)}><SlidersHorizontal size={16} /> Edit options <ChevronDown size={16} /></button>
                    <div className="control-inner">
                      <div className="control-block"><div className="control-label"><span><Palette size={15} /> Background</span><small>পেছনের রং</small></div><div className="background-options"><button type="button" className={`background-choice checker-choice ${background === "transparent" ? "selected" : ""}`} onClick={() => setBackground("transparent")}><span className="checker-swatch" /> <b>Transparent</b></button><button type="button" className={`background-choice ${background === "white" ? "selected" : ""}`} onClick={() => setBackground("white")}><span className="color-swatch white" /> White</button><button type="button" className={`background-choice ${background === "black" ? "selected" : ""}`} onClick={() => setBackground("black")}><span className="color-swatch black" /> Black</button><button type="button" className={`background-choice ${background === "red" ? "selected" : ""}`} onClick={() => setBackground("red")}><span className="color-swatch red" /> Red</button><button type="button" className={`background-choice ${background === "blue" ? "selected" : ""}`} onClick={() => setBackground("blue")}><span className="color-swatch blue" /> Blue</button><label className={`background-choice custom-choice ${background === "custom" ? "selected" : ""}`}><input type="color" value={customColor} onChange={(event) => { setCustomColor(event.target.value); setBackground("custom"); }} /><span className="color-swatch" style={{ background: customColor }} /> Custom</label><button type="button" className={`background-choice image-choice ${background === "image" ? "selected" : ""}`} onClick={() => backgroundInputRef.current?.click()}><input ref={backgroundInputRef} className="visually-hidden" type="file" accept="image/*" onChange={handleBackgroundImage} /><FolderOpen size={13} /> My photo</button></div></div>
                      <div className="control-divider" />
                      <div className="control-block"><div className="control-label"><span><Paintbrush size={15} /> Fix edges</span><small>ভুল হলে ঠিক করুন</small></div><div className="brush-row"><button type="button" className={`brush-button ${brushMode === "erase" && brushEnabled ? "active" : ""}`} onClick={() => { setBrushMode("erase"); setBrushEnabled((current) => brushMode === "erase" ? !current : true); }}><Eraser size={15} /><span>Erase<small>মুছুন</small></span></button><button type="button" className={`brush-button ${brushMode === "restore" && brushEnabled ? "active" : ""}`} onClick={() => { setBrushMode("restore"); setBrushEnabled((current) => brushMode === "restore" ? !current : true); }}><Brush size={15} /><span>Restore<small>ফিরিয়ে দিন</small></span></button></div><div className="brush-slider"><span>Brush size</span><input type="range" min="2" max="12" value={brushSize} onChange={(event) => setBrushSize(Number(event.target.value))} /><span>{brushSize}</span></div><p className="control-tip">{brushEnabled ? `Brush active · Preview-তে press/drag করুন। ${brushMode === "erase" ? "Edge মুছতে" : "Original থেকে ফিরিয়ে দিতে"}। আবার button-এ চাপলে slider ফিরে আসবে।` : "Erase বা Restore button বেছে নিয়ে preview-তে আঁকুন, অথবা slider টেনে before/after দেখুন।"}</p></div>
                      <div className="control-divider" />
                      <div className="control-block"><div className="control-label"><span><ScanLine size={15} /> Output size</span><small>কোথায় ব্যবহার করবেন?</small></div><div className="size-options">{([["original", "Original", "যেমন আছে"], ["passport", "Passport", "2 × 2 in"], ["stamp", "Stamp", "ছোট ছবি"], ["square", "Square", "Social-ready"]] as [SizePreset, string, string][]).map(([value, label, sublabel]) => <button type="button" key={value} className={`size-choice ${sizePreset === value ? "selected" : ""}`} onClick={() => setSizePreset(value)}><span>{label}</span><small>{sublabel}</small>{sizePreset === value && <Check size={14} />}</button>)}</div></div>
                      <div className="export-row"><div className="format-toggle"><button type="button" className={format === "png" ? "active" : ""} onClick={() => setFormat("png")}>PNG</button><button type="button" className={format === "jpg" ? "active" : ""} onClick={() => setFormat("jpg")}>JPG</button></div><button type="button" className="download-button" onClick={() => void exportImage()} disabled={!previewSource}><Download size={17} /> Download</button></div>
                      <div className="share-row"><span><Share2 size={14} /> Share CutBG</span><button type="button" onClick={() => void sharePage("whatsapp")}>WhatsApp</button><button type="button" onClick={() => void sharePage("facebook")}>Facebook</button><button type="button" onClick={() => void sharePage("copy")} aria-label="Copy link"><Link2 size={14} /></button></div>
                    </div>
                  </div>
                </div>
                <div className="thumbnail-row">{items.map((item) => <button type="button" key={item.id} className={`thumbnail-card ${item.id === activeId ? "active" : ""}`} onClick={() => selectActiveItem(item.id)}><span className="thumbnail-image checkerboard">{item.resultUrl ? <img src={item.resultUrl} alt="" /> : <Loader2 size={15} className="spin" />}</span><span className="thumbnail-copy"><strong>{item.name.length > 18 ? `${item.name.slice(0, 16)}…` : item.name}</strong><small>{item.status === "done" ? "ready" : item.status === "error" ? "error" : "working"}</small></span>{item.status === "done" && <Check size={14} />}</button>)}</div>
              </div>
            )}
          </div>
        </section>

        <section className="trust-strip"><div><ShieldCheck size={22} /><span><strong>ছবি কোথাও যায় না</strong><small>Private by design</small></span></div><div><Zap size={22} /><span><strong>সরাসরি browser-এ</strong><small>No server waiting</small></span></div><div><BadgeCheck size={22} /><span><strong>কোনো login নেই</strong><small>Free for everyone</small></span></div><div><Download size={22} /><span><strong>PNG বা JPG</strong><small>Ready to use</small></span></div></section>

        <section className="how-section" id="how-it-works"><div className="section-kicker-row"><p className="kicker">সহজ তিন ধাপ / NO MANUAL NEEDED</p><span className="section-number">02</span></div><div className="how-heading"><h2>কাজটা যতটা সহজ,<br /><em>ঠিক ততটাই।</em></h2><p>আপনাকে কোনো editing skill জানতে হবে না। ছবি দিন, পছন্দমতো ঠিক করুন, download করুন।</p></div><div className="how-cards"><article className="step-card"><div className="step-number">01</div><div className="step-icon"><UploadCloud size={23} /></div><h3>ছবি দিন</h3><p>ফোন থেকে ছবি বাছুন বা সরাসরি এখানে drag করুন। একসাথে একাধিক ছবিও দিতে পারবেন।</p><span className="step-note">Just pick a photo <ArrowUpRight size={15} /></span></article><article className="step-card featured-step"><div className="step-number">02</div><div className="step-icon"><Wand2 size={23} /></div><h3>CutBG কাটবে</h3><p>AI আপনার subject আলাদা করবে—সবকিছু browser-এই, তাই photo কোথাও পাঠাতে হয় না।</p><span className="step-note">AI in your browser <Sparkles size={15} /></span></article><article className="step-card"><div className="step-number">03</div><div className="step-icon"><ArrowDownToLine size={23} /></div><h3>ব্যবহার করুন</h3><p>Transparent PNG নিন, অথবা background-এর রং বদলে JPG download করুন।</p><span className="step-note">Ready for anywhere <ArrowUpRight size={15} /></span></article></div></section>

        <section className="feature-section"><div className="feature-copy"><p className="kicker">DETAILS MATTER / ছোট জিনিসও জরুরি</p><h2>Cut-এর পরেও<br /><em>control আপনার।</em></h2><p>Passport photo, product post, profile picture—ছবিটা কোথায় যাবে, সেই অনুযায়ী background আর size বদলে নিন।</p><ul><li><Check size={16} /> Before / after slider</li><li><Check size={16} /> Erase & restore brush</li><li><Check size={16} /> Transparent, color বা নিজের photo</li></ul><a className="text-link" href="#workspace">Tool-এ ফিরে যান <ArrowUpRight size={16} /></a></div><div className="feature-image-wrap"><img src={BEFORE_AFTER_IMAGE} alt="Before and after background removal example" /><div className="feature-caption"><span>01</span><span>Original → cutout</span></div></div></section>

        <section className="privacy-section"><div className="privacy-card"><div className="privacy-visual"><img src={PRIVACY_IMAGE} alt="A shield and cutout kept inside a browser window" /><span className="privacy-stamp"><LockKeyhole size={15} /> PRIVATE BY DESIGN</span></div><div className="privacy-copy"><p className="kicker">আপনার ছবি, আপনার নিয়ম / YOUR PHOTO STAYS YOURS</p><h2>Cloud নয়।<br /><em>আপনার browser.</em></h2><p>CutBG server-এ ছবি পাঠায় না। তাই upload-এর অপেক্ষা নেই, account-এর ঝামেলা নেই, আর কাজ শেষ হলে browser বন্ধ করলেই শেষ।</p><div className="privacy-points"><span><LockKeyhole size={16} /><b>No upload</b><small>কোনো server-এ যায় না</small></span><span><Trash2 size={16} /><b>No storage</b><small>আমরা save করে রাখি না</small></span></div></div></div></section>

        <section className="coming-section"><div className="coming-header"><div><p className="kicker">আরও আসছে / ON THE WAY</p><h2>ছবির কাজগুলো<br /><em>এক জায়গায়।</em></h2></div><span className="coming-note"><Sparkles size={16} /> Coming soon<br /><small>আপনাদের প্রয়োজনেই</small></span></div><div className="tool-teasers"><div className="teaser-card"><span className="teaser-icon"><ScanLine size={22} /></span><div><strong>Image Compressor</strong><small>ছোট file, একই quality</small></div><span className="soon-badge">শীঘ্রই</span></div><div className="teaser-card"><span className="teaser-icon"><ArrowUpRight size={22} /></span><div><strong>Photo Resizer</strong><small>যেকোনো মাপে resize</small></div><span className="soon-badge">শীঘ্রই</span></div><div className="teaser-card"><span className="teaser-icon"><FileImage size={22} /></span><div><strong>Format Converter</strong><small>JPG, PNG, WEBP</small></div><span className="soon-badge">শীঘ্রই</span></div></div></section>

        <section className="faq-section" id="faq"><div className="faq-intro"><p className="kicker">কিছু জানতে চান? / FAQ</p><h2>মনে যা আসে,<br /><em>জিজ্ঞেস করুন।</em></h2><p>CutBG সহজ রাখার চেষ্টা করে। তবুও কোনো প্রশ্ন থাকলে এখানে উত্তর মিলবে।</p></div><div className="faq-list">{faqItems.map((item, index) => <div className={`faq-item ${openFaq === index ? "open" : ""}`} key={item.q}><button type="button" onClick={() => setOpenFaq(openFaq === index ? null : index)}><span>{item.q}</span><ChevronDown size={18} /></button>{openFaq === index && <p>{item.a}</p>}</div>)}</div></section>

        <section className="about-section" id="about"><div><p className="kicker">CUTBG / আমাদের কথা</p><h2>যারা simple tool চান,<br /><em>তাদের জন্য।</em></h2></div><div className="about-copy"><p>CutBG বানানো হয়েছে বাংলাদেশের everyday users-এর জন্য—যারা passport photo, product image, profile picture বা social post-এর জন্য দ্রুত background সরাতে চান, কিন্তু complicated editor শিখতে চান না।</p><p>আমাদের নীতি simple: free access, privacy first, এবং এমন ভাষা যা সবাই বুঝতে পারেন।</p><div className="about-sign"><span className="about-line" /><span>Built for Bangladesh<br /><small>Free. Simple. Private.</small></span></div></div></section>

        <section className="policy-section"><a id="privacy" /><a id="terms" /><div className="policy-card"><Info size={17} /><span><strong>Privacy Policy</strong><small>আপনার ছবি browser ছেড়ে যায় না। CutBG কোনো personal data collect করে না।</small></span><ChevronRight size={17} /></div><div className="policy-card"><CircleHelp size={17} /><span><strong>Terms of Service</strong><small>Tool-টি free এবং “as is” দেওয়া হচ্ছে। নিজের ছবির rights আপনার দায়িত্ব।</small></span><ChevronRight size={17} /></div></section>
      </main>

      <footer className="site-footer"><div className="footer-brand"><span className="brand-mark"><img src={LOGO_IMAGE} alt="" /></span><span><strong>CutBG</strong><small>ছবি দিন, ব্যাকগ্রাউন্ড নেই।</small></span></div><p>ফ্রি online background remover<br /><span>made for Bangladesh, with care.</span></p><div className="footer-links"><a href="#privacy">Privacy</a><a href="#terms">Terms</a><a href="#faq">FAQ</a><a href="#top">উপরে যান ↑</a></div><div className="footer-bottom"><span>© 2026 CutBG</span><span>Free to use · No account needed</span></div></footer>
    </div>
  );
}
