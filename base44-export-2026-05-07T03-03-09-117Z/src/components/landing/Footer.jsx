import React from "react";
import { Zap, Heart, Mail, Instagram, Globe } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-foreground border-t border-white/10">
      {/* Giant background IMPACTO text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <span className="font-space font-black text-[14rem] md:text-[22rem] text-white/[0.02] leading-none whitespace-nowrap">
          IMPACTO
        </span>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" fill="currentColor" />
              </div>
              <span className="font-space font-bold text-2xl text-white">IMPACTO</span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              Organización juvenil sin fines de lucro que impulsa a las juventudes como agentes de cambio social en México.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="text-white font-semibold mb-4 text-sm">Navegación</p>
            <div className="flex flex-col gap-3">
              {["Inicio", "Nosotres", "Áreas", "Impacto", "Contacto"].map((l) => (
                <a
                  key={l}
                  href={`#${l === "Inicio" ? "hero" : l.toLowerCase()}`}
                  className="text-white/40 hover:text-primary text-sm transition-colors"
                >
                  {l}
                </a>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="text-white font-semibold mb-4 text-sm">Contacto</p>
            <div className="flex flex-col gap-3">
              <a href="mailto:impactoo.mex@gmail.com" className="flex items-center gap-2 text-white/40 hover:text-primary text-sm transition-colors">
                <Mail className="w-4 h-4" /> impactoo.mex@gmail.com
              </a>
              <a href="https://instagram.com/impacto.mex" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-white/40 hover:text-primary text-sm transition-colors">
                <Instagram className="w-4 h-4" /> @impacto.mex
              </a>
              <a href="https://impacto.org" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-white/40 hover:text-primary text-sm transition-colors">
                <Globe className="w-4 h-4" /> impacto.org
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/25">
            © {new Date().getFullYear()} IMPACTO · Todos los derechos reservados.
          </p>
          <p className="text-sm text-white/25 flex items-center gap-1.5">
            Hecho con <Heart className="w-3.5 h-3.5 text-primary" fill="currentColor" /> por jóvenes que transforman México
          </p>
        </div>
      </div>
    </footer>
  );
}