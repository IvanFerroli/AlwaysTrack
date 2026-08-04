export function evidenceOptions(argv = []) {
  const refreshArtifacts = argv.includes("--refresh-artifacts");
  const withEvidence = refreshArtifacts || argv.includes("--with-evidence") || argv.includes("--full");

  return {
    refreshArtifacts,
    noPerfSmoke: argv.includes("--no-perf-smoke") || !withEvidence,
    noCoverage: argv.includes("--no-coverage") || !withEvidence,
    noE2e: argv.includes("--no-e2e") || !withEvidence
  };
}
