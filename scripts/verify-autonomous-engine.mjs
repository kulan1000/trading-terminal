import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const constants = read("src/lib/constants.ts");
assert.match(constants, /CLASSIFIER_MODEL\s*=\s*["']gpt-5\.6-sol["']/);

const batch = read("src/lib/classify-batch.ts");
assert.doesNotMatch(batch, /classify-review|flagForReview|getLearnedFeedback|human review/);

const scoringPage = read("src/app/scoring/page.tsx");
assert.doesNotMatch(scoringPage, /useReviews|reviewCount|reviews/);

const exploreTiles = read("src/components/scoring/explore-tiles.tsx");
assert.doesNotMatch(exploreTiles, /ReviewQueue|ReviewStats|useReviews|GPT Reviews|awaiting review/);

const sidebar = read("src/components/sidebar.tsx");
assert.doesNotMatch(sidebar, /useReviewBadge|pendingReviews/);

console.log("Autonomous engine invariant verified: GPT-5.6 Sol, no human review path.");
