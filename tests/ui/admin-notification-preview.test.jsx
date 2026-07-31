// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminNotificationPreview from "../../src/admin/AdminNotificationPreview";
import VietnamScheduleField from "../../src/admin/VietnamScheduleField";
import { getNotificationRouteForRole, normalizeAdminNotification, utcIsoToVietnamSchedule, vietnamScheduleToUtcIso } from "../../src/admin/notification-utils";

describe("Admin notification preview", () => {
  it("renders the exact role-specific content and supports switching role", () => {
    const onRoleChange = vi.fn();
    render(<AdminNotificationPreview form={{ type: "SYSTEM", title: "Maintenance", text: "Tonight at 22:00", route: "" }} role="Student" onRoleChange={onRoleChange} />);
    expect(screen.getByText("Maintenance")).toBeTruthy();
    expect(screen.getByText("Tonight at 22:00")).toBeTruthy();
    expect(screen.getByText("/student-notifications")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Preview role"), { target: { value: "Lecturer" } });
    expect(onRoleChange).toHaveBeenCalledWith("Lecturer");
  });

  it("maps role routes and delivery metadata", () => {
    expect(getNotificationRouteForRole("Researcher")).toBe("/researcher-notifications");
    expect(getNotificationRouteForRole("Administrator")).toBe("/admin-notifications");
    const normalized = normalizeAdminNotification({ id: 7, deliveryStatus: "failed", failureReason: "timeout", unread: false });
    expect(normalized).toMatchObject({ id: 7, deliveryStatus: "failed", failureReason: "timeout", unread: false });
  });

  it("selects a 24-hour Vietnam schedule and converts it to UTC", () => {
    const onChange = vi.fn();
    const { rerender } = render(<VietnamScheduleField value="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Date"), { target: { value: "2026-07-20" } });
    expect(onChange).toHaveBeenCalledWith("2026-07-20T13:00");

    rerender(<VietnamScheduleField value="2026-07-20T13:00" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Hour"), { target: { value: "23" } });
    expect(onChange).toHaveBeenCalledWith("2026-07-20T23:00");
    expect(vietnamScheduleToUtcIso("2026-07-20T23:45")).toBe("2026-07-20T16:45:00.000Z");
    expect(utcIsoToVietnamSchedule("2026-07-20T16:45:00.000Z")).toBe("2026-07-20T23:45");
  });
});
