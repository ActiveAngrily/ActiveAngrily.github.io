"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AnnotatedText } from "./annotated-text";
import { ParticleArtwork } from "./particle-artwork";

export function Portfolio({ indexContent, contactContent }: {
  indexContent: ReactNode;
  contactContent: ReactNode;
}) {
  const [section, setSection] = useState("index");
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const sync = () => setSection(location.hash === "#contact" ? "contact" : "index");
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  return (
    <>
      <header className="site-header">
        <nav aria-label="Main navigation">
          <a href="#index" aria-current={section === "index" ? "page" : undefined}>
            <AnnotatedText>Index</AnnotatedText>
          </a>
          <a href="#contact" aria-current={section === "contact" ? "page" : undefined}>
            <AnnotatedText variant="arrow">Contact</AnnotatedText>
          </a>
        </nav>
      </header>
      <main className="intro">
        <div className="portfolio-composition">
          <ParticleArtwork />
          <div className="section-stage" aria-live="polite">
            <AnimatePresence initial={false} mode="wait">
              <motion.section
                key={section}
                aria-label={section === "index" ? "About Anant" : "Contact Anant"}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 14, filter: reduceMotion ? "none" : "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: reduceMotion ? 0 : -10, filter: reduceMotion ? "none" : "blur(3px)" }}
                transition={{
                  y: reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 22 },
                  opacity: { duration: reduceMotion ? 0 : 0.24 },
                  filter: { duration: reduceMotion ? 0 : 0.3 },
                }}
              >
                {section === "index" ? indexContent : contactContent}
              </motion.section>
            </AnimatePresence>
          </div>
        </div>
      </main>
      <footer className="site-signature">anant jamuar</footer>
    </>
  );
}
