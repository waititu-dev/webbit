import { copyFileSync, mkdirSync } from "node:fs";

const src = "node_modules/@ffmpeg/core/dist/umd";
const dest = "public/ffmpeg";

mkdirSync(dest, { recursive: true });
for (const file of ["ffmpeg-core.js", "ffmpeg-core.wasm"]) {
  copyFileSync(`${src}/${file}`, `${dest}/${file}`);
}
console.log(`Copied ffmpeg core -> ${dest}`);
