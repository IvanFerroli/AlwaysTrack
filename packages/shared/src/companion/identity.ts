export interface CompanionInstallationIdentity {
  installationId: string;
  browserProfileId: string;
  extensionInstanceId: string;
  userId: string;
}

export interface PairingChallenge {
  challengeId: string;
  code: string;
  expiresAt: string;
  singleUse: true;
}

export interface HostApiCredentialReference {
  installationId: string;
  credentialId: string;
  scope: "CASE_FLOW_COMPANION";
  expiresAt: string;
}

export interface ExtensionSessionReference {
  installationId: string;
  sessionId: string;
  expiresAt: string;
}
