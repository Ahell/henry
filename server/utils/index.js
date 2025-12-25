export const normalizeCourseCode = (code) => {
  if (typeof code !== "string") return null;
  const normalized = code.trim().toUpperCase();
  return normalized.length > 0 ? normalized : null;
};

export const normalizeCredits = (value) => {
  const num = Number(value);
  return num === 15 ? 15 : 7.5;
};
