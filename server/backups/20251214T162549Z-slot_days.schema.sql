CREATE TABLE slot_days (
    slot_day_id INTEGER PRIMARY KEY AUTOINCREMENT,
    slot_id INTEGER NOT NULL,
    date TEXT NOT NULL
  );
CREATE UNIQUE INDEX slot_days_slot_date_unique ON slot_days(slot_id, date);
