import { useEffect } from "react";
import { Link, useRoute } from "wouter";
import { ArrowLeft, ArrowRight, FileImage, Files, FileArchive, ImagePlus, Scissors, Sparkles, UploadCloud } from "lucide-react";

const pages: Record<string, { bn: string; en: string; description: string; icon: typeof ImagePlus; accept: string }> = {
  "jpg-to-pdf": { bn: "ছবি থেকে PDF", en: "JPG to PDF Converter", description: "JPG, PNG বা WEBP ছবি একসাথে সাজিয়ে free PDF বানান। কোনো signup বা upload দরকার নেই।", icon: ImagePlus, accept: "JPG, PNG, WEBP" },
  "pdf-to-image": { bn: "PDF থেকে ছবি", en: "PDF to JPG / PNG", description: "PDF page-গুলো image হিসেবে export করার সহজ browser-based tool।", icon: FileImage, accept: "PDF" },
  "merge-pdf": { bn: "PDF জোড়া লাগান", en: "Merge PDF Online", description: "একাধিক PDF একসাথে করে একটি clean document তৈরি করুন।", icon: Files, accept: "PDF" },
  "split-pdf": { bn: "PDF ভাগ করুন", en: "Split PDF Online", description: "প্রয়োজনের page আলাদা করে নতুন PDF file download করুন।", icon: Scissors, accept: "PDF" },
  "compress-pdf": { bn: "PDF ছোট করুন", en: "Compress PDF", description: "Email বা share করার আগে PDF-এর size কমানোর সহজ tool।", icon: FileArchive, accept: "PDF" },
  "pdf-editor": { bn: "PDF এডিট করুন", en: "Simple PDF Editor", description: "Page order, add text, draw, highlight ও signature-এর জন্য simple workspace।", icon: Sparkles, accept: "PDF" },
};

export default function ToolPage() {
  const [, params] = useRoute("/:slug");
  const page = pages[params?.slug ?? ""] ?? pages["jpg-to-pdf"];
  const Icon = page.icon;
  useEffect(() => {
    const title = `${page.en} — Free Online PDF Tool | Paperly`;
    document.title = title;
    const description = document.querySelector('meta[name="description"]');
    description?.setAttribute("content", page.description);
    const canonical = document.querySelector('link[rel="canonical"]') ?? document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    canonical.setAttribute("href", `${window.location.origin}/${params?.slug ?? ""}`);
    if (!canonical.parentNode) document.head.appendChild(canonical);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    ogTitle?.setAttribute("content", title);
    const ogDescription = document.querySelector('meta[property="og:description"]');
    ogDescription?.setAttribute("content", page.description);
    const ogUrl = document.querySelector('meta[property="og:url"]') ?? document.createElement("meta");
    ogUrl.setAttribute("property", "og:url");
    ogUrl.setAttribute("content", `${window.location.origin}/${params?.slug ?? ""}`);
    if (!ogUrl.parentNode) document.head.appendChild(ogUrl);
  }, [page, params?.slug]);
  return <div className="tool-landing"><header className="pdf-header"><div className="pdf-header-inner"><Link href="/" className="pdf-brand"><span className="pdf-brand-mark"><span /><span /><span /></span><span><strong>Paperly</strong><small>সহজ PDF কাজ</small></span></Link><Link href="/" className="landing-back"><ArrowLeft size={15} /> সব tools</Link></div></header><main><section className="landing-hero"><div className="pdf-eyebrow"><span /> FREE BROWSER TOOL</div><span className="landing-icon"><Icon size={27} /></span><h1>{page.bn}<br /><em>{page.en}</em></h1><p>{page.description}</p><div className="landing-actions"><Link href="/#tools" className="admin-primary">এখনই শুরু করুন <ArrowRight size={16} /></Link><span><UploadCloud size={15} /> {page.accept} · max 25 MB</span></div></section><section className="landing-info"><div><span className="pdf-eyebrow"><span /> SIMPLE STEPS</span><h2>File দিন,<br /><em>কাজ হয়ে যাবে।</em></h2></div><div className="landing-steps"><div><strong>01</strong><span><b>Upload</b><small>File বাছাই করুন</small></span></div><div><strong>02</strong><span><b>Process</b><small>Browser-এ কাজ হবে</small></span></div><div><strong>03</strong><span><b>Download</b><small>Result save করুন</small></span></div></div></section><section className="landing-note"><b>Private by design.</b><span>আপনার PDF permanentভাবে save হয় না। Browser-based tools আপনার device-এই কাজ করে।</span></section></main><footer className="pdf-footer"><div className="pdf-footer-brand"><span className="pdf-brand-mark"><span /><span /><span /></span><span><strong>Paperly</strong><small>সহজ PDF কাজ</small></span></div><p>Free PDF tools for everyday work.<br /><span>Simple enough for everyone.</span></p><div className="pdf-footer-bottom">© 2026 Paperly <span>Free · Private · Browser-based</span></div></footer></div>;
}
