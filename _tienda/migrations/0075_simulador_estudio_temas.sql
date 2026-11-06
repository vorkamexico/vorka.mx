-- Plan de estudio (nov 2026): el estudiante puede elegir los temas que más quiere reforzar. Van primero en su plan y se
-- repiten en los repasos; con «solo», el plan usa únicamente esos. temas: ids separados por coma ('' = el plan decide solo).
ALTER TABLE simulador_estudio ADD COLUMN temas TEXT NOT NULL DEFAULT '';
ALTER TABLE simulador_estudio ADD COLUMN solo_temas INTEGER NOT NULL DEFAULT 0;
