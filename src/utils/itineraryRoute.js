export function slugifyDestination(value) {
  const source = String(value || "")
    .trim()
    .toLowerCase();
  if (!source) return "trip";

  return (
    source
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-") || "trip"
  );
}

export function buildItineraryPathById(tripId) {
  return `/itinerary/${tripId}`;
}
