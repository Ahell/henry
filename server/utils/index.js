export const normalizeCourseCode = (code) => {
  if (typeof code !== "string") return null;
  const normalized = code.trim().toUpperCase();
  return normalized.length > 0 ? normalized : null;
};

export const normalizeCredits = (value) => {
  const num = Number(value);
  return num === 15 ? 15 : 7.5;
};

export function serializeArrayFields(obj, fields) {
  const result = { ...obj };
  fields.forEach((field) => {
    if (Array.isArray(result[field])) {
      result[field] = JSON.stringify(result[field]);
    }
  });
  return result;
}

export function deserializeArrayFields(obj, fields) {
  if (!obj) return obj;
  const result = { ...obj };
  fields.forEach((field) => {
    if (typeof result[field] === "string") {
      try {
        result[field] = JSON.parse(result[field]);
      } catch (e) {
        result[field] = [];
      }
    }
  });
  return result;
}
