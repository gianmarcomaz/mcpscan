/**
 * Credential Leaks Analyzer
 * Scans for hardcoded secrets, API keys, tokens, and credential patterns.
 */

const SECRET_PATTERNS = [
    {
        name: "Generic API Key",
        regex: /(?:api[_-]?key|token|secret|password|passwd|pwd)\s*[:=]\s*['"][A-Za-z0-9_\-/+]{20,}['"]/i,
        severity: "high",
    },
    {
        name: "AWS Access Key",
        regex: /AKIA[0-9A-Z]{16}/,
        severity: "critical",
    },
    {
        name: "GitHub Token",
        regex: /ghp_[A-Za-z0-9]{36}/,
        severity: "critical",
    },
    {
        name: "GitHub OAuth",
        regex: /gho_[A-Za-z0-9]{36}/,
        severity: "critical",
    },
    {
        name: "JWT / Bearer Token",
        regex: /(?:jwt|bearer)\s*[:=]\s*['"][^'"]{10,}['"]/i,
        severity: "high",
    },
    {
        name: "Database URL with Password",
        regex: /(?:mongodb|postgres|postgresql|mysql|redis):\/\/[^:]+:[^@]+@/,
        severity: "critical",
    },
    {
        name: "Private Key",
        regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/,
        severity: "critical",
    },
    {
        name: "Slack Token",
        regex: /xox[bpors]-[A-Za-z0-9-]+/,
        severity: "high",
    },
    {
        name: "Stripe Key",
        regex: /sk_(?:live|test)_[A-Za-z0-9]{24,}/,
        severity: "critical",
    },
];

const PLACEHOLDER_VALUES = [
    "YOUR_API_KEY", "your_api_key", "xxx", "changeme", "CHANGEME",
    "<token>", "<api_key>", "TODO", "FIXME", "replace_me", "placeholder",
    "example", "test_key", "dummy", "sample",
];

const TEST_FILE_PATTERNS = /(?:test|spec|mock|example|sample|template|fixture)/i;

/**
 * @param {Array<{path: string, content: string}>} files
 * @returns {{ score: number, status: string, findings: Array }}
 */
function analyzeCredentialLeaks(files) {
    const findings = [];
    let hasGitignore = false;
    let gitignoreCoversSecrets = false;
    let hasEnvFile = false;

    for (const file of files) {
        // Check for .env files in the repo (they shouldn't be committed)
        if (/^\.env(\.local|\.production|\.development)?$/.test(file.path.split("/").pop())) {
            hasEnvFile = true;
            findings.push({
                severity: "high",
                file: file.path,
                line: null,
                snippet: "",
                message: "Environment file committed to repository. This may contain secrets.",
                remediation:
                    "Remove .env files from version control and add them to .gitignore. Use environment variables in your deployment platform.",
            });
        }

        // Check .gitignore
        if (file.path === ".gitignore" || file.path.endsWith("/.gitignore")) {
            hasGitignore = true;
            const content = file.content.toLowerCase();
            if (content.includes(".env") || content.includes("*.key") || content.includes("*.pem")) {
                gitignoreCoversSecrets = true;
            }
        }

        // Scan for secrets
        const lines = file.content.split("\n");
        const isTestFile = TEST_FILE_PATTERNS.test(file.path);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Skip comments
            const trimmed = line.trim();
            if (trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("*")) continue;

            for (const pattern of SECRET_PATTERNS) {
                const match = line.match(pattern.regex);
                if (!match) continue;

                // Check for placeholders
                const isPlaceholder = PLACEHOLDER_VALUES.some((p) =>
                    match[0].toLowerCase().includes(p.toLowerCase())
                );

                const severity = isPlaceholder
                    ? "info"
                    : isTestFile
                        ? "info"
                        : pattern.severity;

                findings.push({
                    severity,
                    file: file.path,
                    line: i + 1,
                    snippet: trimmed.slice(0, 200),
                    message: `${pattern.name} detected${isPlaceholder ? " (placeholder value)" : ""}.`,
                    remediation:
                        "Remove hardcoded credentials and use environment variables instead. Add .env to your .gitignore and use a secrets manager for production deployments.",
                });

                break; // One finding per line
            }
        }
    }

    // Add .gitignore warning if missing or incomplete
    if (!hasGitignore) {
        findings.push({
            severity: "medium",
            file: ".gitignore",
            line: null,
            snippet: "",
            message: "No .gitignore file found. Secrets may be accidentally committed.",
            remediation:
                "Create a .gitignore file that includes: .env, .env.local, *.key, *.pem, *.secret",
        });
    } else if (!gitignoreCoversSecrets) {
        findings.push({
            severity: "medium",
            file: ".gitignore",
            line: null,
            snippet: "",
            message: ".gitignore exists but doesn't cover common secret file patterns.",
            remediation:
                "Add .env, *.key, *.pem, and *.secret to your .gitignore file.",
        });
    }

    // Scoring
    const criticals = findings.filter((f) => f.severity === "critical").length;
    const highs = findings.filter((f) => f.severity === "high").length;
    const mediums = findings.filter((f) => f.severity === "medium").length;

    let score = 100;
    score -= criticals * 30;
    score -= highs * 15;
    score -= mediums * 5;
    score = Math.max(0, Math.min(100, score));

    const status = criticals > 0 ? "fail" : highs > 0 ? "warn" : "pass";

    return {
        score,
        status,
        findings: findings.slice(0, 50),
    };
}

module.exports = { analyzeCredentialLeaks };
