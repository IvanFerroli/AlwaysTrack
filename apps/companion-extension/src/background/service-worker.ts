import { CompanionProtocolClient } from "./protocol-client.js";

const protocolClient = new CompanionProtocolClient({
  onState: (state) => void chrome.runtime.sendMessage({ type: "COMPANION_CONNECTION_STATE", state }).catch(() => undefined)
});

chrome.runtime.onInstalled.addListener(() => {
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {
    console.error("companion.side_panel_setup_failed");
  });
});

chrome.runtime.onMessage.addListener((message) => {
  const candidate = message as { type?: string; token?: string };
  if (candidate.type === "PAIR_COMPANION" && candidate.token) protocolClient.pair(candidate.token);
});

protocolClient.start();
