export const normalizeId = (value) => {
  if (value === null || value === undefined) return value;
  const num = Number(value);
  return Number.isFinite(num) ? num : value;
};

export const idForCompare = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : Infinity;
};

