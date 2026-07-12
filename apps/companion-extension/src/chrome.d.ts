interface CompanionChromeApi {
  runtime: {
    onInstalled: { addListener(listener: () => void): void };
  };
  sidePanel: {
    setPanelBehavior(options: { openPanelOnActionClick: boolean }): Promise<void>;
  };
}

declare const chrome: CompanionChromeApi;
