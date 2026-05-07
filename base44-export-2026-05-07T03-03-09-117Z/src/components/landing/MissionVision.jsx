import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Target, Eye } from "lucide-react";

const cards = [
  {
    icon: Target,
    label: "Misión",
    text: "Ayudar a personas en situación de vulnerabilidad a lograr su inclusión y construir una sociedad más justa.",
    dark: true,
  },
  {
    icon: Eye,
    label: "Visión",
    text: "Ser referente en inclusión social, educación, cultura y medio ambiente mediante proyectos innovadores y sostenibles.",
    dark: false,
  },
];

export default function MissionVision() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-24 lg:py-32">
      <div ref={ref} className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest mb-4">
            Propósito
          </span>
          <h2 className="font-space font-bold text-4xl lg:text-6xl text-foreground leading-tight">
            Lo que nos mueve
            <span className="text-primary">.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {cards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.15 }}
              className={`group relative rounded-3xl p-10 lg:p-12 overflow-hidden transition-all duration-500 ${
                card.dark
                  ? "bg-foreground text-white"
                  : "bg-secondary border border-border"
              }`}
            >
              {/* Accent blob */}
              <div className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-40 ${
                card.dark ? "bg-primary" : "bg-primary"
              }`} />

              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 ${
                card.dark ? "bg-primary" : "bg-primary"
              }`}>
                <card.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${
                card.dark ? "text-primary" : "text-primary"
              }`}>{card.label}</p>
              <p className={`text-xl lg:text-2xl font-medium leading-relaxed ${
                card.dark ? "text-white" : "text-foreground"
              }`}>
                {card.text}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}