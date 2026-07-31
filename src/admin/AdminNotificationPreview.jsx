import React from "react";
import { getNotificationRouteForRole } from "./notification-utils";

export default function AdminNotificationPreview({ form, role, onRoleChange }) {
  const rawTitle = String(form.title || "").trim();
  const title = (rawTitle || "Notification title").replace(/\s*:\s*/g, ": ");
  const route = form.route || getNotificationRouteForRole(role);
  return (
    <section className="admin-notification-preview" aria-label="Notification role preview">
      <div className="admin-notification-preview-heading">
        <div>
          <strong>Notification preview</strong>
          <small>See exactly what recipients will receive.</small>
        </div>
        <label>
          <span>View as</span>
          <select aria-label="Preview role" value={role} onChange={(event) => onRoleChange(event.target.value)}>
            <option>Student</option>
            <option>Lecturer</option>
            <option>Researcher</option>
          </select>
        </label>
      </div>
      <article className={`admin-notification-preview-card ${form.text ? "has-content" : "is-empty"}`}>
        <div className="admin-notification-preview-meta">
          <span>{role}</span>
          <small>{form.type || "System alert"}</small>
        </div>
        <h3>{title}</h3>
        <p>{form.text || "Enter notification content to preview the message shown to recipients."}</p>
        <footer>
          <span>Destination</span>
          <code>{route}</code>
        </footer>
      </article>
    </section>
  );
}
