interface CompanionChromeApi {
  runtime: {
    onInstalled: { addListener(listener: () => void): void; removeListener(listener: () => void): void };
    onMessage: { addListener(listener: (message: unknown) => void): void; removeListener(listener: (message: unknown) => void): void };
    sendMessage(message: unknown): Promise<unknown>;
  };
  sidePanel: {
    setPanelBehavior(options: { openPanelOnActionClick: boolean }): Promise<void>;
  };
}

declare const chrome: CompanionChromeApi;
