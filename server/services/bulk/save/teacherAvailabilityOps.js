export function buildTeacherAvailabilityOps({ teacherAvailability, slots }) {
  const slotsByStart = new Map((slots || []).map((s) => [s.start_date, s]));
  const ops = [];

  if (Array.isArray(teacherAvailability)) {
    teacherAvailability.forEach((a) => {
      const op = toAvailabilityOp(a, slotsByStart);
      if (op) ops.push(op);
    });
    return ops;
  }

  if (teacherAvailability && typeof teacherAvailability === "object") {
    Object.entries(teacherAvailability).forEach(([key, available]) => {
      const [teacher_id, slot_id] = key.split("-").map(Number);
      ops.push({
        type: "slot",
        action: available ? "delete" : "insert",
        teacher_id,
        slot_id,
      });
    });
  }

  return ops;
}

function toAvailabilityOp(a, slotsByStart) {
  if (a?.slot_id) {
    return {
      type: "slot",
      action: a.type === "busy" ? "insert" : "delete",
      id: a.id,
      teacher_id: a.teacher_id,
      slot_id: a.slot_id,
      created_at: a.created_at,
    };
  }

  if (!a?.from_date) return null;

  const startStr = (a.from_date || "").split("T")[0];
  const endStr = (a.to_date || a.from_date || "").split("T")[0];
  if (!startStr) return null;

  const slot = slotsByStart.get(startStr);
  if (slot && endStr && slot.end_date === endStr) {
    return {
      type: "slot",
      action: a.type === "busy" ? "insert" : "delete",
      id: a.id,
      teacher_id: a.teacher_id,
      slot_id: slot.slot_id,
      created_at: a.created_at,
    };
  }

  return {
    type: "dayRange",
    action: a.type === "busy" ? "insert" : "delete",
    id: a.id,
    teacher_id: a.teacher_id,
    start_date: startStr,
    end_date: endStr || startStr,
    created_at: a.created_at,
  };
}

