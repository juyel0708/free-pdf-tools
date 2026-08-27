import { useMemo, useRef, useState } from "react";
import { PDFDocument, degrees } from "pdf-lib";
import {
  ArrowRight,
  Check,
  ChevronDown,
  FileArchive,
  FileImage,
  FilePlus2,
  Files,
  FolderOpen,
  GripVertical,
  ImagePlus,
  Languages,
  LockKeyhole,
  Menu,
  Moon,
  PanelTop,
  Plus,
  RotateCw,
  Scissors,
  Settings2,
  ShieldCheck,
  Sparkles,
  Split,
  Sun,
  Trash2,
  UploadCloud,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

// Premium PDF Studio reminder: premium editorial surfaces, plain-language actions, Bangla-first copy, and no unnecessary complexity.

type ToolKey = "image-pdf" | "merge" | "split" | "pdf-image" | "compress" | "editor" | "sign" | "watermark";
type FileItem = { id: string; file: File; preview?: string; pages?: number };

const tools: { key: ToolKey; icon: typeof ImagePlus; title: string; bn: string; description: string; tone: string }[] = [
  { key: "image-pdf", icon: ImagePlus, title: "JPG to PDF", bn: "ছবি থেকে PDF", description: "ছবি সাজিয়ে সুন্দর PDF বানান", tone: "orange" },
  { key: "pdf-image", icon: FileImage, title: "PDF to Image", bn: "PDF থেকে ছবি", description: "প্রতিটি page JPG বা PNG করুন", tone: "blue" },
  { key: "merge", icon: Files, title: "Merge PDF", bn: "PDF জোড়া লাগান", description: "অনেক PDF একসাথে করুন", tone: "green" },
  { key: "split", icon: Split, title: "Split PDF", bn: "PDF ভাগ করুন", description: "চাইলে নির্দিষ্ট page আলাদা করুন", tone: "violet" },
  { key: "compress", icon: FileArchive, title: "Compress PDF", bn: "PDF ছোট করুন", description: "সহজে file size কমান", tone: "yellow" },
  { key: "editor", icon: PanelTop, title: "PDF Editor", bn: "PDF এডিট করুন", description: "Text, draw, highlight, page order", tone: "rose" },
  { key: "sign", icon: Check, title: "Sign PDF", bn: "Signature দিন", description: "Signature আঁকুন বা বসান", tone: "teal" },
  { key: "watermark", icon: Sparkles, title: "Watermark", bn: "Watermark দিন", description: "নাম বা logo যোগ করুন", tone: "slate" },
];

const readFile = (file: File) => new Promise<ArrayBuffer>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result as ArrayBuffer); reader.onerror = () => reject(new Error("read")); reader.readAsArrayBuffer(file); });
const download = (bytes: Uint8Array, name: string, type = "application/pdf") => { const blob = new Blob([bytes as BlobPart], { type }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click(); URL.revokeObjectURL(url); };
const id = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeTool, setActiveTool] = useState<ToolKey>("image-pdf");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [progress, setProgress] = useState(0);
  const cancelRef = useRef(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [splitRange, setSplitRange] = useState("1");
  const [language, setLanguage] = useState<"bn" | "en">("bn");

  const selectedTool = useMemo(() => tools.find((tool) => tool.key === activeTool) ?? tools[0], [activeTool]);

  const addFiles = async (list: FileList | File[]) => {
    const incoming = Array.from(list);
    const accepted = incoming.filter((file) => file.type.startsWith("image/") || file.type === "application/pdf");
    if (accepted.length !== incoming.length) toast.error("শুধু JPG, PNG অথবা PDF file দিন। / Please choose an image or PDF file.");
    if (!accepted.length) return;
    const next = await Promise.all(accepted.map(async (file) => ({ id: id(), file, preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined })));
    setFiles((current) => [...current, ...next]);
  };

  const execute = async () => {
    if (!files.length) { toast.error("আগে একটি file দিন। / Add a file first."); return; }
    setIsWorking(true);
    setProgress(8);
    cancelRef.current = false;
    try {
      if (activeTool === "image-pdf") {
        const pdf = await PDFDocument.create();
        const imageFiles = files.filter((entry) => entry.file.type.startsWith("image/"));
        for (let index = 0; index < imageFiles.length; index += 1) { const item = imageFiles[index]!;
          if (cancelRef.current) throw new Error("cancelled");
          const bytes = await readFile(item.file);
          setProgress(Math.round(((index + 1) / imageFiles.length) * 85));
          const image = item.file.type === "image/png" ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
          const page = pdf.addPage([image.width, image.height]);
          page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
        }
        download(await pdf.save(), "free-pdf-images.pdf");
      } else if (activeTool === "merge") {
        const merged = await PDFDocument.create();
        const pdfFiles = files.filter((entry) => entry.file.type === "application/pdf");
        for (let index = 0; index < pdfFiles.length; index += 1) { const item = pdfFiles[index]!; if (cancelRef.current) throw new Error("cancelled"); const source = await PDFDocument.load(await readFile(item.file)); const pages = await merged.copyPages(source, source.getPageIndices()); pages.forEach((page) => merged.addPage(page)); setProgress(Math.round(((index + 1) / pdfFiles.length) * 85)); }
        download(await merged.save(), "merged-document.pdf");
      } else if (activeTool === "split") {
        const source = await PDFDocument.load(await readFile(files[0].file));
        const pageNumber = Math.max(1, Math.min(Number(splitRange) || 1, source.getPageCount()));
        const output = await PDFDocument.create(); const [page] = await output.copyPages(source, [pageNumber - 1]); output.addPage(page); download(await output.save(), `page-${pageNumber}.pdf`);
      } else if (activeTool === "compress") {
        const source = await PDFDocument.load(await readFile(files[0].file)); download(await source.save({ useObjectStreams: true, addDefaultPage: false }), "compressed.pdf");
      } else if (activeTool === "editor") {
        const source = await PDFDocument.load(await readFile(files[0].file)); source.getPages().forEach((page) => page.setRotation(degrees(0))); download(await source.save(), "edited-document.pdf");
        toast.info("Basic editor workspace ready. Text, draw and highlight panels are coming in the next editor update.");
      } else {
        toast.info("এই tool-এর advanced browser workflow খুব শীঘ্রই আসছে। / This workflow is coming soon.");
      }
      setProgress(100);
      toast.success("কাজ শেষ। / Your file is ready.");
    } catch (error) { if ((error as Error).message === "cancelled") toast.info("কাজ বন্ধ করা হয়েছে। / Processing cancelled."); else toast.error("Fileটি process করা যায়নি। / We could not process this file."); }
    finally { setIsWorking(false); setTimeout(() => setProgress(0), 500); }
  };

  const remove = (itemId: string) => setFiles((current) => current.filter((item) => item.id !== itemId));

  return <div className={`pdf-app ${isDark ? "is-dark" : ""}`}>
    <header className="pdf-header"><div className="pdf-header-inner"><a className="pdf-brand" href="#top"><span className="pdf-brand-mark"><span /><span /><span /></span><span><strong>Paperly</strong><small>সহজ PDF কাজ</small></span></a><nav className={`pdf-nav ${mobileMenu ? "open" : ""}`}><a href="#tools" onClick={() => setMobileMenu(false)}>Tools</a><a href="#why" onClick={() => setMobileMenu(false)}>কেন Paperly?</a><a href="#faq" onClick={() => setMobileMenu(false)}>FAQ</a><a className="admin-link" href="/admin"><Settings2 size={14} /> Admin</a></nav><div className="pdf-actions"><button className="language-switch" type="button" onClick={() => setLanguage(language === "bn" ? "en" : "bn")}><Languages size={15} /> {language === "bn" ? "বাংলা" : "EN"}</button><button className="theme-switch" type="button" onClick={() => setIsDark((value) => !value)} aria-label="Toggle theme">{isDark ? <Sun size={17} /> : <Moon size={17} />}</button><button className="mobile-menu" type="button" onClick={() => setMobileMenu((value) => !value)}><Menu size={18} /></button></div></div></header>
    <main id="top">
      <section className="pdf-hero"><div className="pdf-hero-inner"><div className="pdf-hero-copy"><div className="pdf-eyebrow"><span /> FREE PDF TOOLKIT</div><h1>আপনার PDF,<br /><em>আপনার নিয়মে।</em></h1><p>ছবি থেকে PDF, merge, split, compress—প্রতিদিনের PDF কাজগুলো এক জায়গায়। সহজ, private এবং browser-এই free.</p><div className="hero-trust"><span><LockKeyhole size={15} /> No upload</span><span><Zap size={15} /> Fast in browser</span><span><ShieldCheck size={15} /> Free to use</span></div></div><div className="hero-art"><div className="art-sheet sheet-back"><span className="art-line" /><span className="art-line short" /><span className="art-box" /></div><div className="art-sheet sheet-front"><div className="art-file-icon"><FilePlus2 size={31} /></div><strong>Make it<br /><em>simple.</em></strong><span>PDF toolkit</span></div><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-sticker"><Sparkles size={14} /> no account needed</div></div></div></section>
      <section className="tool-section" id="tools"><div className="section-top"><div><div className="pdf-eyebrow"><span /> PICK A TOOL</div><h2>যে কাজটা দরকার,<br /><em>সেটাই করুন।</em></h2></div><p>কোনো technical knowledge লাগবে না। File দিন, কাজ বেছে নিন, তারপর download করুন।</p></div><div className="tool-grid">{tools.map((tool) => { const Icon = tool.icon; return <button type="button" key={tool.key} className={`tool-card ${activeTool === tool.key ? "active" : ""}`} onClick={() => { setActiveTool(tool.key); setFiles([]); }}><span className={`tool-icon ${tool.tone}`}><Icon size={21} /></span><span className="tool-card-copy"><strong>{tool.bn}</strong><small>{tool.title} · {tool.description}</small></span><ArrowRight size={17} className="tool-arrow" /></button>; })}</div></section>
      <section className="workspace-section"><div className="workspace-head"><div><span className="active-tag"><span /> ACTIVE TOOL</span><h2>{selectedTool.bn} <small>{selectedTool.title}</small></h2></div><span className="workspace-privacy"><LockKeyhole size={14} /> আপনার file browser ছাড়ে না</span></div><div className={`dropzone ${isDragging ? "dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={(event) => { event.preventDefault(); setIsDragging(false); void addFiles(event.dataTransfer.files); }} onClick={() => inputRef.current?.click()} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") inputRef.current?.click(); }}><input ref={inputRef} className="hidden-input" type="file" multiple accept={activeTool === "image-pdf" ? "image/*" : "application/pdf,image/*"} onChange={(event) => { if (event.target.files) void addFiles(event.target.files); event.target.value = ""; }} /><div className="drop-icon"><UploadCloud size={27} /></div><h3>File এখানে ছাড়ুন</h3><p>অথবা <strong>file বাছাই করুন</strong> / choose from phone</p><div className="drop-meta"><span>JPG</span><span>PNG</span><span>PDF</span><span>up to 25 MB</span></div></div>{files.length > 0 && <div className="file-tray"><div className="file-tray-head"><strong>{files.length}টি file ready</strong><button type="button" className="clear-files" onClick={() => setFiles([])}><Trash2 size={14} /> সব মুছুন</button></div>{files.map((item) => <div className="file-row" key={item.id}><GripVertical size={14} className="drag-grip" />{item.preview ? <img src={item.preview} alt="" /> : <span className="pdf-mini"><FileImage size={17} /></span>}<span><strong>{item.file.name}</strong><small>{(item.file.size / 1024 / 1024).toFixed(2)} MB · ready</small></span><button type="button" onClick={() => remove(item.id)} aria-label="Remove file"><X size={15} /></button></div>)}{isWorking && <div className="progress-wrap"><span>Processing / কাজ হচ্ছে {progress}%</span><div><i style={{ width: `${progress}%` }} /></div><button type="button" onClick={() => { cancelRef.current = true; }}>Cancel</button></div>}<div className="workspace-controls">{activeTool === "split" && <label>কোন page? / Page <input value={splitRange} onChange={(event) => setSplitRange(event.target.value)} inputMode="numeric" /></label>}<button type="button" className="add-more" onClick={() => inputRef.current?.click()}><Plus size={15} /> আরও file</button><button type="button" className="process-button" onClick={() => void execute()} disabled={isWorking}>{isWorking ? "কাজ হচ্ছে..." : "কাজ শুরু করুন"}<ArrowRight size={16} /></button></div></div>}</section>
      <section className="why-section" id="why"><div className="why-copy"><div className="pdf-eyebrow"><span /> MADE FOR EVERYONE</div><h2>একটা clean tool.<br /><em>একটাও ঝামেলা নয়।</em></h2><p>Paperly এমনভাবে তৈরি করা হয়েছে যেন phone হাতে যে কেউ প্রথমবারেই বুঝতে পারেন। কোনো signup, complicated menu বা hidden payment নেই।</p><div className="why-points"><span><Check size={15} /><strong>Browser-based</strong><small>File কোথাও upload হয় না</small></span><span><Check size={15} /><strong>Bangla-first</strong><small>আপনার ভাষায় clear labels</small></span><span><Check size={15} /><strong>Mobile-ready</strong><small>Phone থেকেই কাজ করুন</small></span></div></div><div className="why-board"><div className="board-label">PAPERLY / 01</div><div className="board-paper"><span className="board-stamp"><Scissors size={17} /> CUT, SAVE<br />& GO</span><div className="board-lines" /><div className="board-check"><Check size={19} /><span>ready to share</span></div></div></div></section>
      <section className="coming-strip"><div><span className="pdf-eyebrow"><span /> NEXT UP</span><h2>আরও tools আসছে।</h2></div><p>OCR, PDF to Word, signature, watermark এবং smart editor—ধাপে ধাপে যোগ হবে।</p><span className="coming-badge"><Sparkles size={14} /> coming soon</span></section>
      <section className="faq-section" id="faq"><div><div className="pdf-eyebrow"><span /> FAQ</div><h2>প্রশ্ন থাকলে<br /><em>জিজ্ঞেস করুন।</em></h2></div><div className="faq-list"><details open><summary>আমার PDF কি upload হয়? <ChevronDown size={17} /></summary><p>না। Core tools আপনার browser-এর ভেতরেই process করে। আমরা আপনার PDF save করে রাখি না।</p></details><details><summary>এটা কি free থাকবে? <ChevronDown size={17} /></summary><p>হ্যাঁ, Paperly-এর basic tools free রাখার লক্ষ্য আছে। ভবিষ্যতে ads থাকতে পারে, কিন্তু basic access locked হবে না।</p></details><details><summary>File কত বড় হতে পারবে? <ChevronDown size={17} /></summary><p>এখন 25 MB পর্যন্ত file ভালোভাবে কাজ করার জন্য target করা হয়েছে। বড় file আপনার device-এর memory-এর উপর নির্ভর করবে।</p></details></div></section>
    </main><footer className="pdf-footer"><div className="pdf-footer-brand"><span className="pdf-brand-mark"><span /><span /><span /></span><span><strong>Paperly</strong><small>সহজ PDF কাজ</small></span></div><p>Free PDF tools for everyday work.<br /><span>Simple enough for everyone.</span></p><div className="pdf-footer-links"><a href="/admin">Admin access</a><a href="#faq">Privacy</a><a href="#faq">Terms</a></div><div className="pdf-footer-bottom">© 2026 Paperly <span>Free · Private · Browser-based</span></div></footer>
  </div>;
}
