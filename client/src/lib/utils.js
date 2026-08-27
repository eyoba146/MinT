export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-ET", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}