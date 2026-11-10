// Prepara el SQL para registrar una clase en video, leyendo los datos reales del archivo MP4.
//
//   node scripts/lesson-video-sql.mjs "<archivo.mp4>" <slug-del-curso> "<titulo de la clase>" ["<titulo del modulo>"] [<nombre-en-storage.mp4>]
//
// Ejemplo:
//   node scripts/lesson-video-sql.mjs "C:/videos/clase-2.mp4" conociendo-mi-sensibilidad "Clase 2" "Módulo 1"
//
// No sube el archivo ni se conecta a ninguna base de datos: solo imprime
//   1) la ruta donde debes subir el video en Supabase (Storage -> course-files), y
//   2) el SQL que lo registra (se pega en el SQL Editor, DESPUES de subir el archivo).
// Solo lee la cabecera del MP4 (duracion, dimensiones, codecs); no necesita ffmpeg.

import { readFileSync, statSync } from "node:fs";
import { basename } from "node:path";

const [file, slug, title, moduleTitle = "Módulo 1", storageName] = process.argv.slice(2);

if (!file || !slug || !title) {
  console.error('Uso: node scripts/lesson-video-sql.mjs "<archivo.mp4>" <slug-del-curso> "<titulo>" ["<modulo>"] [<nombre-en-storage.mp4>]');
  process.exit(1);
}

const buffer = readFileSync(file);
const size = statSync(file).size;

function boxes(start, end, visit) {
  let pos = start;
  while (pos + 8 <= end) {
    let boxSize = buffer.readUInt32BE(pos);
    const type = buffer.toString("latin1", pos + 4, pos + 8);
    let header = 8;
    if (boxSize === 1) {
      boxSize = Number(buffer.readBigUInt64BE(pos + 8));
      header = 16;
    }
    if (boxSize === 0) boxSize = end - pos;
    if (boxSize < header) break;
    visit(type, pos + header, pos + boxSize);
    pos += boxSize;
  }
}

const info = { seconds: null, width: null, height: null, codecs: [] };
boxes(0, buffer.length, (type, s, e) => {
  if (type !== "moov") return;
  boxes(s, e, (type2, s2, e2) => {
    if (type2 === "mvhd") {
      const version = buffer[s2];
      const timescale = buffer.readUInt32BE(s2 + (version === 1 ? 20 : 12));
      const duration = version === 1 ? Number(buffer.readBigUInt64BE(s2 + 24)) : buffer.readUInt32BE(s2 + 16);
      info.seconds = duration / timescale;
    }
    if (type2 === "trak") {
      boxes(s2, e2, (type3, s3, e3) => {
        if (type3 === "tkhd") {
          const version = buffer[s3];
          const offset = version === 1 ? 88 : 76;
          const w = buffer.readUInt32BE(s3 + offset) / 65536;
          const h = buffer.readUInt32BE(s3 + offset + 4) / 65536;
          if (w > 0 && h > 0) {
            info.width = Math.round(w);
            info.height = Math.round(h);
          }
        }
        if (type3 === "mdia") {
          boxes(s3, e3, (t4, s4, e4) => {
            if (t4 !== "minf") return;
            boxes(s4, e4, (t5, s5, e5) => {
              if (t5 !== "stbl") return;
              boxes(s5, e5, (t6, s6) => {
                if (t6 === "stsd") info.codecs.push(buffer.toString("latin1", s6 + 12, s6 + 16));
              });
            });
          });
        }
      });
    }
  });
});

if (info.seconds === null) {
  console.error("No pude leer la duración: ¿es un archivo MP4 válido?");
  process.exit(1);
}

const seconds = Math.max(1, Math.round(info.seconds));
const safeName = (storageName ?? basename(file))
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^A-Za-z0-9._-]+/g, "-")
  .toLowerCase();
const path = `${slug}/${safeName}`;
const quote = (text) => `'${String(text).replace(/'/g, "''")}'`;

const warnings = [];
if (!info.codecs.includes("avc1")) warnings.push("El video no parece H.264 (avc1): puede no reproducirse en todos los navegadores.");
if (size > 50 * 1024 * 1024) warnings.push("El archivo supera 50 MB: el plan gratuito de Supabase limita el tamaño por archivo; comprímelo o usa un plan Pro.");

console.log(`Datos leídos del archivo
  Duración:    ${seconds} s (${info.seconds.toFixed(1)} s reales)
  Dimensiones: ${info.width ?? "?"}x${info.height ?? "?"}${info.height > info.width ? " (vertical)" : ""}
  Códecs:      ${info.codecs.join(", ") || "?"}
  Tamaño:      ${size} bytes (${(size / 1048576).toFixed(1)} MB)
${warnings.map((w) => `  AVISO: ${w}`).join("\n")}

1) Sube el archivo en Supabase → Storage → course-files, a esta ruta exacta:
     ${path}

2) Después ejecuta este SQL en el SQL Editor:

select public.register_lesson_video(
  ${quote(slug)},
  ${quote(moduleTitle)},
  ${quote(title)},
  ${quote(path)},
  ${seconds},
  ${info.width ?? "null"},
  ${info.height ?? "null"},
  ${size},
  'video/mp4',
  ${quote(basename(file))}
);
`);
