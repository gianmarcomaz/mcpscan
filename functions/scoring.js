/**
 * Score Calculator & Tier Assignment
 *
 * Weights:
 *   networkExposure:  25 points max
 *   commandInjection: 25 points max
 *   credentialLeaks:  20 points max
 *   toolPoisoning:    15 points max
 *   specCompliance:   10 points max
 *   inputValidation:   5 points max
 *   Total:           100 points max
 */

const WEIGHTS = {
    networkExposure: 25,
    commandInjection: 25,
    credentialLeaks: 20,
    toolPoisoning: 15,
    specCompliance: 10,
    inputValidation: 5,
};

const TIERS = [
    { min: 90, tier: "certified", label: "MCP Certified ✓", color: "#22c55e" },
    { min: 70, tier: "reviewed", label: "MCP Reviewed — Minor Issues", color: "#eab308" },
    { min: 0, tier: "failed", label: "Issues Detected — Not Certified", color: "#ef4444" },
];

/**
 * Calculate the overall score from individual check results.
 * @param {Object} checks - { checkName: { score, status, findings } }
 * @returns {{ overallScore: number, tier: string, tierLabel: string, tierColor: string, criticalIssues: number }}
 */
function calculateScore(checks) {
    let overallScore = 0;
    let criticalIssues = 0;

    for (const [key, weight] of Object.entries(WEIGHTS)) {
        const check = checks[key];
        if (check) {
            overallScore += (check.score / 100) * weight;
            // Count critical findings
            criticalIssues += (check.findings || []).filter(
                (f) => f.severity === "critical"
            ).length;
        }
    }

    overallScore = Math.round(overallScore);

    // Determine tier
    let tierInfo = TIERS[TIERS.length - 1];
    for (const t of TIERS) {
        if (overallScore >= t.min) {
            tierInfo = t;
            break;
        }
    }

    // Cap: if any critical issues, can't be "certified"
    if (criticalIssues > 0 && tierInfo.tier === "certified") {
        tierInfo = TIERS[1]; // "reviewed"
    }

    return {
        overallScore,
        tier: tierInfo.tier,
        tierLabel: tierInfo.label,
        tierColor: tierInfo.color,
        criticalIssues,
    };
}

module.exports = { calculateScore, WEIGHTS };
