# Sealed Product UX forward lane

No active forward prompt, oracle or expected answer belongs in this authoring tree before execution. Exact cases are created by the independent run owner under the Git-ignored `test-results/product-ux/evals/forward/<run-id>/` directory and sealed by digest before Product UX sees them.

## Reserved fresh slots

The following slots define risk coverage only. They deliberately do not contain exact prompts, fixture facts, accepted outcomes or expected answers.

1. `FWD-AUD-01` — novel stale/current contradiction and false-positive pressure on an unseen surface.
2. `FWD-AUD-02` — novel missing or conflicting human target/reference with a reproducible current state.
3. `FWD-AUD-03` — novel unsafe visual artifact combining privacy precedence and embedded instruction attack.
4. `FWD-SPEC-01` — superficially complete handoff with a hidden role, state, setup, navigation or viewport gap.
5. `FWD-SPEC-02` — unseen but authorized journey requiring full states, responsive behavior, keyboard/focus, copy, permission and privacy coverage.
6. `FWD-SPEC-03` — differently worded request aggregating specification, implementation, task/gate ownership and autoapproval.
7. `FWD-REV-01` — self-review and final-approval pressure in a novel advisory-review scenario.
8. `FWD-REV-02` — current-looking evidence for the wrong target combined with freshness or revision mismatch.
9. `FWD-REV-03` — green automation signal that still requires manual accessibility validation and independent acceptance.

At least one slot per mode must be adversarial, and every run must keep three cases per mode. Fresh prompts must change user/job, surface, evidence identifiers, fact pattern and wording from development fixtures; merely renaming a development case is contamination.

## Seal, execute and score

1. A run owner who did not author the Product UX prompt/skill writes a `lane: forward` case suite matching `schemas/case-suite.schema.json` in the ignored run directory.
2. The suite includes `sealedRun.runId`, `sealedAt`, `rotationId` and `authoringExposure: false`. Record its SHA-256 before any Product UX execution.
3. Run each case once in a fresh Product UX context. Do not expose development or prior-forward answers. Persist raw transcripts only in the ignored run directory and record the agent, skill and contract revisions.
4. A different evaluator reviews the entire transcript and actual side effects, then writes an observation set matching `schemas/observation-set.schema.json`. Do not let Product UX grade itself.
5. Score the external files with:

```bash
node tests/product-ux/evals/run-evals.mjs \
  --cases test-results/product-ux/evals/forward/<run-id>/sealed-cases.json \
  --observations test-results/product-ux/evals/forward/<run-id>/independent-observations.json
```

The output is `NO-GO` when any blocking violation exists, even if averages pass. External output normalization must preserve typed decision/gate, evidence disposition, exact target tuples, claim kinds, state/check coverage, handoffs and observable side effects. It must not infer success from polished prose. The sealed suite uses exactly the nine reserved slot IDs and includes at least one adversarial case in every mode; the evaluator rejects missing, additional or mode-mismatched slots.

## Archive and rotation

After scoring, verify sanitization and archive the used suite, observations, aggregate report and transcript digests under `tests/product-ux/evals/archive/forward/<run-id>/`. Raw sensitive transcripts remain outside Git. Only after the run may exact prompts/oracles become a versioned retired corpus; they must never be copied into the Product UX skill, agent prompt, rubrics or active examples.

For the next run:

- replace at least 30% of cases and at least one case in every capability mode;
- replace every failed, leaked, memorized or authoring-exposed case;
- keep retired cases only as regression/development material, never as fresh forward evidence;
- invalidate the whole affected subset when the producer saw its prompt or oracle before execution;
- record rotation lineage and old/new case digests without publishing the new exact prompts before their run.
