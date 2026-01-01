export function buildTeacherAvailabilityOps({ teacherAvailability, slots }) {
  const slotsByStart = new Map((slots || []).map((s) => [s.start_date, s]));
  if (Array.isArray(teacherAvailability)) {
    return opsFromRows(teacherAvailability, slotsByStart);
  }
  if (teacherAvailability && typeof teacherAvailability === "object") {
    return opsFromMap(teacherAvailability);
  }
  return [];
}

function toAvailabilityOp(a, slotsByStart) {
  if (a?.slot_id) return slotOp(a, a.slot_id);

  const range = parseDayRange(a);
  if (!range) return null;

  const slot = slotsByStart.get(range.start_date);
  if (slot && range.end_date && slot.end_date === range.end_date) {
    return slotOp(a, slot.slot_id);
  }

  return {
    type: "dayRange",
    action: a.type === "busy" ? "insert" : "delete",
    id: a.id,
    teacher_id: a.teacher_id,
    start_date: range.start_date,
    end_date: range.end_date,
    created_at: a.created_at,
  };
}

function opsFromRows(rows, slotsByStart) {
  const ops = [];
  rows.forEach((a) => {
    const op = toAvailabilityOp(a, slotsByStart);
    if (op) ops.push(op);
  });
  return ops;
}

function opsFromMap(map) {
  return Object.entries(map).map(([key, available]) => {
    const [teacher_id, slot_id] = key.split("-").map(Number);
    return {
      type: "slot",
      action: available ? "delete" : "insert",
      teacher_id,
      slot_id,
    };
  });
}

function slotOp(a, slot_id) {
  return {
    type: "slot",
    action: a.type === "busy" ? "insert" : "delete",
    id: a.id,
    teacher_id: a.teacher_id,
    slot_id,
    created_at: a.created_at,
  };
}

function parseDayRange(a) {
  if (!a?.from_date) return null;
  const startStr = normalizeDateOnly(a.from_date);
  const endStr = normalizeDateOnly(a.to_date || a.from_date || "");
  if (!startStr) return null;
  return { start_date: startStr, end_date: endStr || startStr };
}

function normalizeDateOnly(value) {
  if (!value) return "";
  const raw = String(value);
  const splitOnT = raw.split("T")[0];
  return splitOnT.split(" ")[0];
}
