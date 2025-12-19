export function mapTeacherAvailability({
  slotUnavailability = [],
  dayUnavailability = [],
  slots = [],
  slotDays = [],
} = {}) {
  const slotIdToStart = new Map((slots || []).map((s) => [s.slot_id, s.start_date]));
  const slotDayIdToDate = new Map((slotDays || []).map((sd) => [sd.slot_day_id, sd.date]));

  const slotRows = (slotUnavailability || []).map((a) => {
    const start = slotIdToStart.get(a.slot_id) || "";
    return {
      id: a.id,
      teacher_id: a.teacher_id,
      from_date: start,
      to_date: start,
      slot_id: a.slot_id,
      type: "busy",
      created_at: a.created_at,
    };
  });

  const dayRows = (dayUnavailability || [])
    .map((a) => {
      const date = slotDayIdToDate.get(a.slot_day_id) || "";
      if (!date) return null;
      return {
        id: a.id,
        teacher_id: a.teacher_id,
        from_date: date,
        to_date: date,
        slot_id: null,
        type: "busy",
        created_at: a.created_at,
      };
    })
    .filter(Boolean);

  return [...slotRows, ...dayRows];
}
