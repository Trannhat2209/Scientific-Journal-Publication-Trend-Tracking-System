import React from "react";

const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, "0"));
const minutes = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, "0"));

const getVietnamToday = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};

export default function VietnamScheduleField({ value, onChange, disabled = false }) {
  const [date = "", time = "13:00"] = String(value || "").split("T");
  const [hour = "13", minute = "00"] = time.split(":");
  const update = (nextDate, nextHour, nextMinute) => {
    onChange(nextDate ? `${nextDate}T${nextHour}:${nextMinute}` : "");
  };

  return (
    <fieldset className="admin-vietnam-schedule" disabled={disabled}>
      <legend>Schedule <span>Optional</span></legend>
      <div className="admin-vietnam-schedule-grid">
        <label>
          <span>Date</span>
          <input
            type="date"
            min={getVietnamToday()}
            value={date}
            onChange={(event) => update(event.target.value, hour, minute)}
          />
        </label>
        <label>
          <span>Hour</span>
          <select value={hour} disabled={!date || disabled} onChange={(event) => update(date, event.target.value, minute)}>
            {hours.map((item) => <option value={item} key={item}>{item} giờ</option>)}
          </select>
        </label>
        <label>
          <span>Minute</span>
          <select value={minute} disabled={!date || disabled} onChange={(event) => update(date, hour, event.target.value)}>
            {minutes.map((item) => <option value={item} key={item}>{item} phút</option>)}
          </select>
        </label>
      </div>
      <div className="admin-vietnam-schedule-footer">
        <small>{date ? `Scheduled for ${date.split("-").reverse().join("/")} lúc ${hour}:${minute}` : "Leave empty to send immediately."}</small>
        {date ? <button type="button" onClick={() => onChange("")}>Clear schedule</button> : null}
      </div>
    </fieldset>
  );
}
