import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

export default function About({ educationImage }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="about" className="py-24 lg:py-36 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/40 to-background pointer-events-none" />

      <div ref={ref} className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Image side */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="rounded-3xl overflow-hidden aspect-[4/3]">
              <img
                src={educationImage}
                alt="Jóvenes colaborando en proyectos"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Yellow accent block */}
            <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-primary rounded-3xl -z-10 opacity-40" />
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-foreground rounded-2xl -z-10 opacity-10" />

            {/* Floating quote card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="absolute -bottom-4 -right-4 lg:-right-8 max-w-[220px] bg-foreground text-white rounded-2xl p-4 shadow-2xl"
            >
              <p className="text-sm font-medium leading-snug">
                "El cambio social empieza con jóvenes que se atreven."
              </p>
              <p className="text-primary text-xs font-bold mt-2">— IMPACTO</p>
            </motion.div>
          </motion.div>

          {/* Text side */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="space-y-7"
          >
            <span className="inline-block px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest">
              Quiénes somos
            </span>
            <h2 className="font-space font-bold text-4xl lg:text-5xl leading-tight text-foreground">
              Sobre
              <br />
              nosotres
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              IMPACTO es una organización juvenil sin fines de lucro que impulsa el
              desarrollo de las juventudes como agentes de cambio, fomentando la
              participación social, el liderazgo y la transformación de su entorno.
            </p>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              {[
                { n: "+700", label: "Integrantes" },
                { n: "+12", label: "Estados" },
                { n: "7", label: "Áreas" },
              ].map((s) => (
                <div key={s.label} className="bg-secondary rounded-2xl p-4 text-center">
                  <p className="font-space font-extrabold text-2xl text-foreground">{s.n}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}