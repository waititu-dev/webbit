const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

export function frameSort(files: File[]): File[] {
  return [...files].sort((a, b) => collator.compare(a.name, b.name));
}
