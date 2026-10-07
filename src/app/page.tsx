"use client";
import * as React from "react";
import { ScrollProgress } from "@/components/landing/reveal";
import {
  SysNav,
  Hero,
  LogoStrip,
  Walkthrough,
  Roles,
  Engines,
  ComingStrip,
  Metrics,
  Testimonials,
  Compare,
  Pricing,
  Faq,
  FinalCta,
  Footer,
  ShieldLine,
  useLandingRows,
} from "@/components/landing/system";

export default function Home() {
  const rows = useLandingRows();
  React.useEffect(() => {
    const els = Array.from(document.querySelectorAll("[data-rv]"));
    if (typeof IntersectionObserver === "undefined") {
      els.forEach((el) => el.classList.add("is-shown"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-shown");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  React.useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const id = window.location.hash.replace("#", "");
      const el = document.getElementById(id);
      if (el) {
        const timer = setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, []);
  return (
    <main id="top" className="landing-system min-h-screen">
      <ScrollProgress />
      <SysNav />
      <Hero rows={rows} />
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <ShieldLine />
      </div>
      <LogoStrip />
      <Walkthrough rows={rows} />
      <Roles rows={rows} />
      <Engines />
      <ComingStrip />
      <Metrics rows={rows} />
      <Testimonials />
      <Compare />
      <Pricing />
      <Faq />
      <FinalCta />
      <Footer />
    </main>
  );
}
