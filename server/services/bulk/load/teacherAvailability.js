export function mapTeacherAvailability(unavailability = [], slots = []) {
  return unavailability.map((a) => {
    const slot = slots.find((s) => s.slot_id === a.slot_id);
    return {
      id: a.id,
      teacher_id: a.teacher_id,
      from_date: slot ? slot.start_date : "",
      to_date: slot ? slot.start_date : "",
      slot_id: a.slot_id,
      type: "busy",
    };
  });
}

