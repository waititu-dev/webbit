export interface ValidationResult {
  accepted: File[];
  rejected: string[];
}

export function validateFiles(files: File[]): ValidationResult {
  const accepted: File[] = [];
  const rejected: string[] = [];
  for (const file of files) {
    const isPng = file.type === "image/png" || (!file.type && /\.png$/i.test(file.name));
    if (isPng) accepted.push(file);
    else rejected.push(file.name);
  }
  return { accepted, rejected };
}
