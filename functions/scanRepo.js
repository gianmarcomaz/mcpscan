/**
 * Scan Repo — Main Orchestrator Cloud Function
 *
 * Receives a repo URL from an authenticated user, creates a Firestore scan document,
 * fetches repo files via GitHub API, runs all 6 analyzers, calculates score, and
 * updates the document with results.
 */

const admin = require("firebase-admin");
const { HttpsError } = require("firebase-functions/v2/https");
const { fetchRepoFiles } = require("./github");
const { analyzeNetworkExposure } = require("./analyzers/networkExposure");
const { analyzeCommandInjection } = require("./analyzers/commandInjection");
const { analyzeCredentialLeaks } = require("./analyzers/credentialLeaks");
const { analyzeToolPoisoning } = require("./analyzers/toolPoisoning");
const { analyzeSpecCompliance } = require("./analyzers/specCompliance");
const { analyzeInputValidation } = require("./analyzers/inputValidation");
const { calculateScore } = require("./scoring");

const db = admin.firestore();

const REPO_URL_REGEX = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/?$/;

/**
 * Orchestrate a full scan. Called as an HTTPS Callable function.
 * @param {Object} data - { repoUrl: string }
 * @param {Object} context - Firebase callable context
 */
async function handleScanRepo(data, context) {
    // 1. Auth check
    if (!context.auth) {
        throw new HttpsError("unauthenticated", "You must be signed in to scan a repository.");
    }

    const { repoUrl } = data;
    if (!repoUrl) {
        throw new HttpsError("invalid-argument", "repoUrl is required.");
    }

    // 2. Validate URL
    const match = repoUrl.match(REPO_URL_REGEX);
    if (!match) {
        throw new HttpsError("invalid-argument", "Invalid GitHub repository URL. Use https://github.com/owner/repo");
    }

    const [, repoOwner, repoName] = match;
    const userId = context.auth.uid;

    try {
        // 3. Create scan document
        const scanRef = db.collection("scans").doc();
        const scanId = scanRef.id;

        await scanRef.set({
            userId,
            repoUrl,
            repoOwner,
            repoName,
            commitHash: "",
            status: "pending",
            currentStep: "pending",
            startedAt: admin.firestore.FieldValue.serverTimestamp(),
            completedAt: null,
            overallScore: null,
            tier: null,
            checks: {},
            badgeUrl: "",
            errorMessage: null,
        });

        // 4. Run the scan asynchronously so the client gets the scanId immediately.
        // We do NOT await this — it runs in the background.
        runScan(scanRef, scanId, repoOwner, repoName).catch((err) => {
            console.error("Scan failed:", err);
            scanRef.update({
                status: "error",
                currentStep: "error",
                errorMessage: err.message || "Unknown error occurred",
            }).catch((e) => console.error("Failed to update error status:", e));
        });

        return { scanId };
    } catch (err) {
        console.error("handleScanRepo error:", err);
        if (err instanceof HttpsError) throw err;
        throw new HttpsError("internal", "Failed to start scan: " + err.message);
    }
}

async function runScan(scanRef, scanId, repoOwner, repoName) {
    const githubToken = process.env.GITHUB_TOKEN || "";

    // 5. Fetch files
    await scanRef.update({ status: "scanning", currentStep: "fetching" });

    console.log(`Fetching files for ${repoOwner}/${repoName}...`);
    const files = await fetchRepoFiles(repoOwner, repoName, githubToken);
    console.log(`Fetched ${files.length} files`);

    if (files.length === 0) {
        throw new Error("No scannable source files found in repository.");
    }

    // 6. Run analyzers sequentially, updating Firestore after each
    const analyzers = [
        { key: "networkExposure", fn: analyzeNetworkExposure },
        { key: "commandInjection", fn: analyzeCommandInjection },
        { key: "credentialLeaks", fn: analyzeCredentialLeaks },
        { key: "toolPoisoning", fn: analyzeToolPoisoning },
        { key: "specCompliance", fn: analyzeSpecCompliance },
        { key: "inputValidation", fn: analyzeInputValidation },
    ];

    const checks = {};

    for (const analyzer of analyzers) {
        console.log(`Running analyzer: ${analyzer.key}`);
        await scanRef.update({ currentStep: analyzer.key });

        try {
            const result = analyzer.fn(files);
            checks[analyzer.key] = result;

            await scanRef.update({
                [`checks.${analyzer.key}`]: result,
            });
        } catch (err) {
            console.error(`Analyzer ${analyzer.key} failed:`, err);
            checks[analyzer.key] = {
                status: "error",
                score: 100,
                findings: [],
                summary: `Analyzer error: ${err.message}`,
            };
            await scanRef.update({
                [`checks.${analyzer.key}`]: checks[analyzer.key],
            });
        }
    }

    // 7. Calculate score
    await scanRef.update({ currentStep: "scoring" });
    const { overallScore, tier } = calculateScore(checks);

    // 8. Build badge URL
    const badgeUrl = `/api/badge/${scanId}`;

    // 9. Final update
    await scanRef.update({
        status: "complete",
        currentStep: "complete",
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        overallScore,
        tier,
        badgeUrl,
    });

    console.log(`Scan ${scanId} complete: score=${overallScore}, tier=${tier}`);
}

module.exports = { handleScanRepo };
