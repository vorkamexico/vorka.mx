import React, { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const testimonials = [
  {
    quote: "IMPACTO me enseñó que el cambio empieza con nosotres. Hoy lidero un proyecto ambiental en mi comunidad que ha transformado la vida de muchas familias.",
    name: "María Fernanda",
    role: "Cuidado Ambiental · Jalisco",
    initial: "M",
  },
  {
    quote: "Ser parte de esta red me dio las herramientas para emprender y generar oportunidades reales para jóvenes de mi colonia. El impacto es tangible.",
    name: "Carlos Eduardo",
    role: "Emprendimiento Juvenil · CDMX",
    initial: "C",
  },
  {
    quote: "Gracias a IMPACTO descubrí mi voz como comunicadora social. Ahora visibilizo las causas de las juventudes en medios digitales.",
    name: "Valentina",
    role: "Comunicaciones Sociales · Nuevo León",
    initial: "V",
  },
];

export default function Testimonials() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((c) => (c === 0 ? testimonials.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === testimonials.length - 1 ? 0 : c + 1));

  return (
    <section className="py-24 lg:py-32 bg-secondary/30">
      <div ref={ref} className="max-w-5xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest mb-4">
            Testimonios
          </span>
          <h2 className="font-space font-bold text-4xl lg:text-5xl text-foreground">
            Voces del cambio<span className="text-primary">.</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <div className="min-h-[260px] flex items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35 }}
                className="w-full text-center"
              >
                {/* Avatar initial */}
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-space font-bold text-2xl mx-auto mb-6">
                  {testimonials[current].initial}
                </div>
                <p className="text-xl lg:text-2xl text-foreground leading-relaxed font-light italic max-w-3xl mx-auto">
                  "{testimonials[current].quote}"
                </p>
                <div className="mt-8">
                  <p className="font-space font-bold text-lg text-foreground">
                    {testimonials[current].name}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {testimonials[current].role}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-center gap-4 mt-10">
            <button
              onClick={prev}
              className="p-3 rounded-full border border-border bg-card hover:bg-secondary transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    i === current ? "bg-primary w-8" : "bg-border w-2.5"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="p-3 rounded-full border border-border bg-card hover:bg-secondary transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}