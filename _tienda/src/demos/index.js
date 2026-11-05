// Registro de demos en vivo (ver marco.js). Cada producto tiene su archivo; null = todavía sin demo (no se pinta la sección).
import agenda from './agenda.js';
import vuelve from './vuelve.js';
import brindi from './brindi.js';
import cupo from './cupo.js';
import cuentas from './cuentas.js';
import vende from './vende.js';
import clara from './clara.js';
import portales from './portales.js';
import simulador from './simulador.js';
import tests from './tests.js';
import ruta from './ruta.js';
import liderazgo from './liderazgo.js';

export const DEMOS = {
  agenda, vuelve, brindi, cupo, cuentas, vende, clara, portales,
  'simulador-paa': simulador?.paa, 'simulador-unam': simulador?.unam, 'simulador-ecoems': simulador?.ecoems, 'simulador-prepa-ug': simulador?.['prepa-ug'],
  'test-vocacional': tests?.vocacional, 'que-proyecto-social': tests?.proyecto, 'ruta-de-impacto': ruta, 'evaluacion-liderazgo': liderazgo,
};
export const demoDe = k => DEMOS[k] || null;
