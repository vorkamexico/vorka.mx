import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Handshake, Zap } from "lucide-react";

export default function CallToAction() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="cta" className="py-24 lg:py-32 relative overflow-hidden bg-foreground">
      {/* Background decoration */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span className="font-space font-black text-[22vw] text-white/[0.025] leading-none">ÚNETE</span>
      </div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/15 rounded-full blur-3xl" />

      <div ref={ref} className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/40 bg-primary/10 text-primary text-sm font-bold">
            <Zap className="w-4 h-4" fill="currentColor" />
            Únete al movimiento
          </div>

          <h2 className="font-space font-bold text-5xl lg:text-7xl text-white leading-tight">
            Sé parte
            <br />
            del cambio<span className="text-primary">.</span>
          </h2>

          <p className="text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
            Únete a una red de juventudes que están transformando su entorno.
            Tu participación puede generar un impacto real.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <a
              href="mailto:impactoo.mex@gmail.com?subject=Quiero%20unirme%20a%20IMPACTO"
              className="group inline-flex items-center justify-center gap-2 px-10 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-lg hover:brightness-110 transition-all shadow-xl shadow-primary/30"
            >
              Quiero unirme
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="mailto:impactoo.mex@gmail.com?subject=Quiero%20colaborar%20con%20IMPACTO"
              className="group inline-flex items-center justify-center gap-2 px-10 py-4 border-2 border-white/20 text-white rounded-2xl font-bold text-lg hover:bg-white/10 transition-all"
            >
              <Handshake className="w-5 h-5" />
              Colaborar
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}