import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown, Zap, Users, MapPin } from "lucide-react";

export default function Hero({ heroImage }) {
  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden bg-foreground">
      {/* Animated background blobs */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-0 left-1/3 w-[300px] h-[300px] bg-primary/5 rounded-full blur-2xl" />
      </div>

      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.03]"
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }} />
      

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full pt-28 pb-20 lg:py-0">
        <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 items-center">
          {/* Left content */}
          <div className="lg:col-span-3 space-y-8">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}>
              
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/40 bg-primary/10 text-primary text-sm font-semibold">
                <Zap className="w-3.5 h-3.5" fill="currentColor" />
                Innovación social juvenil · México
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-space font-bold text-5xl sm:text-6xl lg:text-7xl xl:text-8xl leading-[1.0] tracking-tight text-white">
              
              Juventudes
              <br />
              <span className="text-primary">impactando</span>
              <br />
              México.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-lg lg:text-xl text-white/60 leading-relaxed max-w-xl">
              
              Construimos, identificamos y fortalecemos a las juventudes como agentes de cambio social en toda la república.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4">
              
              <a
                href="#cta"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-base hover:brightness-110 transition-all duration-300 shadow-xl shadow-primary/30">
                
                Únete a IMPACTO
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="#areas"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-white/20 text-white rounded-2xl font-semibold text-base hover:bg-white/10 transition-all duration-300">
                
                Conoce nuestros proyectos
              </a>
            </motion.div>

            {/* Mini stats row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex items-center gap-6 pt-4 border-t border-white/10">
              
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-white">+700</span>
                <span className="text-sm text-white/50">integrantes</span>
              </div>
              <div className="w-px h-4 bg-white/20" />
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-white">+12</span>
                <span className="text-sm text-white/50">estados</span>
              </div>
              <div className="w-px h-4 bg-white/20" />
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-white">7</span>
                <span className="text-sm text-white/50">áreas</span>
              </div>
            </motion.div>
          </div>

          {/* Right image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="lg:col-span-2 relative">
            
            <div className="relative rounded-3xl overflow-hidden aspect-[3/4] shadow-2xl">
              <img
                src={heroImage}
                alt="Jóvenes de IMPACTO transformando su comunidad"
                className="w-full h-full object-cover" />
              
              {/* Yellow tint overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-primary/10" />
              {/* Bottom label inside image */}
              <div className="absolute bottom-5 left-5 right-5">
                <div className="bg-primary rounded-xl px-4 py-3">
                  <p className="font-space font-bold text-sm text-primary-foreground">
                    IMPACTO en acción 🇲🇽
                  </p>
                  <p className="text-xs text-primary-foreground/70 mt-0.5">
                    Comunidades, proyectos, vida real
                  </p>
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <motion.div
              initial={{ opacity: 0, x: -20, rotate: -6 }}
              animate={{ opacity: 1, x: 0, rotate: -6 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="absolute -left-8 top-16 bg-white rounded-2xl px-5 py-3 shadow-2xl border border-border">
              
              <p className="font-space font-extrabold text-2xl text-foreground">+700</p>
              <p className="text-xs text-muted-foreground font-medium">Jóvenes activos</p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2">
        
        <span className="text-xs text-white/30 font-medium uppercase tracking-widest">Scroll</span>
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.8 }}>
          <ChevronDown className="w-5 h-5 text-white/30" />
        </motion.div>
      </motion.div>
    </section>);

}