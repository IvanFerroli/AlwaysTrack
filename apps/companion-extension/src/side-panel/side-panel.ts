const hostStatus = document.querySelector<HTMLElement>("#host-status");
if (hostStatus) hostStatus.textContent = "Companion indisponivel";

chrome.runtime.onMessage.addListener((message) => {
  const candidate = message as { type?: string; state?: string };
  if (candidate.type === "COMPANION_CONNECTION_STATE" && hostStatus) {
    hostStatus.textContent = candidate.state === "CONNECTED" ? "Companion conectado" : "Companion indisponivel";
  }
});

export {};
