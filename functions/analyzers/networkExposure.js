/**
 * Network Exposure Analyzer
 * Scans for server binding to non-localhost addresses.
 */

const CRITICAL_PATTERNS = [
    // JavaScript/TypeScript
    { regex: /\.listen\s*\([^)]*['"]0\.0\.0\.0['"]/, lang: "js" },
    { regex: /\.listen\s*\([^)]*['"]::['"]/, lang: "js" },
    { regex: /host\s*[:=]\s*['"]0\.0\.0\.0['"]/, lang: "any" },
    { regex: /host\s*[:=]\s*['"]::['"]/, lang: "any" },
    { regex: /host\s*[:=]\s*['"]["']/, lang: "any" }, // empty string = 0.0.0.0
    // Python
    { regex: /\.bind\s*\(\s*\(\s*['"]0\.0\.0\.0['"]/, lang: "py" },
    { regex: /\.bind\s*\(\s*\(\s*['"]::['"]/, lang: "py" },
    // Go
    { regex: /net\.Listen\s*\([^)]*['"]0\.0\.0\.0/, lang: "go" },
    { regex: /INADDR_ANY/, lang: "any" },
];

const SAFE_PATTERNS = [
    /['"]127\.0\.0\.1['"]/,
    /['"]localhost['"]/,
    /['"]::1['"]/,
];

const WARNING_PATTERNS = [
    { regex: /host\s*[:=]\s*(?:process\.env|os\.environ|os\.Getenv)/, message: "Host from environment variable" },
    { regex: /host\s*[:=]\s*(?:config|settings|options)\./, message: "Host from config (verify default)" },
];

/**
 * @param {Array<{path: string, content: string}>} files
 * @returns {{ score: number, status: string, findings: Array }}
 */
function analyzeNetworkExposure(files) {
    const findings = [];
    let hasCritical = false;
    let hasWarning = false;
    let hasServerCode = false;

    for (const file of files) {
        const lines = file.content.split("\n");

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Check critical patterns
            for (const pattern of CRITICAL_PATTERNS) {
                if (pattern.regex.test(line)) {
                    // Skip if a safe pattern is also on this line (e.g., listen("127.0.0.1"))
                    if (SAFE_PATTERNS.some((sp) => sp.test(line))) continue;

                    hasCritical = true;
                    hasServerCode = true;
                    findings.push({
                        severity: "critical",
                        file: file.path,
                        line: i + 1,
                        snippet: line.trim(),
                        message: "Server binding to all network interfaces detected.",
                        remediation:
                            "Bind your server to 127.0.0.1 or localhost instead of 0.0.0.0. Binding to all interfaces exposes your MCP server to anyone on the network.",
                    });
                }
            }

            // Check warning patterns
            for (const pattern of WARNING_PATTERNS) {
                if (pattern.regex.test(line)) {
                    hasWarning = true;
                    hasServerCode = true;
                    findings.push({
                        severity: "medium",
                        file: file.path,
                        line: i + 1,
                        snippet: line.trim(),
                        message: pattern.message + " — could be safe or unsafe depending on deployment.",
                        remediation:
                            "Ensure the default value for the host binding is 127.0.0.1 or localhost. Document the expected deployment configuration.",
                    });
                }
            }

            // Check safe patterns (just mark that we found server code)
            if (SAFE_PATTERNS.some((sp) => sp.test(line)) && /listen|bind|serve/i.test(line)) {
                hasServerCode = true;
            }
        }
    }

    // Scoring
    let score;
    let status;
    if (hasCritical) {
        score = 0;
        status = "fail";
    } else if (hasWarning) {
        score = 50;
        status = "warn";
    } else if (hasServerCode) {
        score = 100;
        status = "pass";
    } else {
        // No server binding found — likely stdio transport (safe)
        score = 100;
        status = "pass";
    }

    // Cap findings at 50
    return {
        score,
        status,
        findings: findings.slice(0, 50),
    };
}

module.exports = { analyzeNetworkExposure };
