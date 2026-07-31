// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../../src/App";

const tokenFor = (role) => {
  const payload = btoa(JSON.stringify({ role, exp: Math.floor(Date.now() / 1000) + 3600 }));
  return `header.${payload}.signature`;
};

describe("academic route access control", () => {
  beforeEach(() => {
    const createStorage = () => {
      const values = new Map();
      return {
        clear: () => values.clear(),
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, String(value)),
        removeItem: (key) => values.delete(key),
      };
    };
    Object.defineProperty(window, "localStorage", { configurable: true, value: createStorage() });
    Object.defineProperty(window, "sessionStorage", { configurable: true, value: createStorage() });
    window.localStorage.clear();
    window.sessionStorage.clear();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 404 })));
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows login instead of an academic page for an anonymous visitor", () => {
    history.replaceState({}, "", "/student-search");
    render(<App />);
    expect(screen.getByRole("main", { name: "Login" })).toBeTruthy();
  });

  it("denies a verified Student opening a Researcher route", () => {
    window.localStorage.setItem("scholartrend.auth", JSON.stringify({ accessToken: tokenFor("Student") }));
    window.localStorage.setItem("scholartrend.session", JSON.stringify({ role: "Student", verificationStatus: "verified" }));
    history.replaceState({}, "", "/researcher-reports");
    render(<App />);
    expect(screen.getByText("Role access denied")).toBeTruthy();
  });
});
