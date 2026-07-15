import { CompanionProtocolClient, type ProtocolClientOptions } from "./protocol-client.js";

interface ProtocolClientLifecycle {
  pair(token: string): void;
  start(): void;
  stop(): void;
}

export function bootstrapServiceWorker(
  api: CompanionChromeApi = chrome,
  createClient: (options: ProtocolClientOptions) => ProtocolClientLifecycle = (options) => new CompanionProtocolClient(options)
): () => void {
  const protocolClient = createClient({
    onState: (state) => void api.runtime.sendMessage({ type: "COMPANION_CONNECTION_STATE", state }).catch(() => undefined)
  });

  const onInstalled = () => {
    void api.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {
      console.error("companion.side_panel_setup_failed");
    });
  };
  const onMessage = (message: unknown) => {
    const candidate = message as { type?: string; token?: string };
    if (candidate.type === "PAIR_COMPANION" && candidate.token) protocolClient.pair(candidate.token);
  };

  api.runtime.onInstalled.addListener(onInstalled);
  api.runtime.onMessage.addListener(onMessage);
  protocolClient.start();

  return () => {
    api.runtime.onInstalled.removeListener(onInstalled);
    api.runtime.onMessage.removeListener(onMessage);
    protocolClient.stop();
  };
}

bootstrapServiceWorker();
