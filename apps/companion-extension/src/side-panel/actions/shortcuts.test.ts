import { describe, expect, it } from "vitest";
import { shortcutOptionIndex } from "./shortcuts.js";

const key = (value: string, altKey = false) => ({ key: value, altKey, ctrlKey: false, metaKey: false, shiftKey: false });

describe("configurable numeric shortcuts", () => {
  it("maps direct and Alt modes without creating submit shortcuts", () => {
    expect(shortcutOptionIndex(key("1"), "DIRECT")).toBe(0);
    expect(shortcutOptionIndex(key("3", true), "ALT")).toBe(2);
    expect(shortcutOptionIndex(key("1"), "ALT")).toBeNull();
  });

  it("supports disabling shortcuts and ignores modified combinations", () => {
    expect(shortcutOptionIndex(key("1"), "DISABLED")).toBeNull();
    expect(shortcutOptionIndex({ ...key("2"), ctrlKey: true }, "DIRECT")).toBeNull();
    expect(shortcutOptionIndex(key("Enter"), "DIRECT")).toBeNull();
  });
});
