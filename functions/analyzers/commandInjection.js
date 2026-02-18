/**
 * Command Injection Analyzer
 * Scans for dangerous code execution patterns that could allow RCE via LLM input.
 */

const DANGEROUS_FUNCTIONS = [
    // JavaScript / TypeScript
    { regex: /\bexec\s*\(/, lang: "js" },
    { regex: /\bexecSync\s*\(/, lang: "js" },
    { regex: /\bexecFile\s*\(/, lang: "js" },
    { regex: /\bspawn\s*\(/, lang: "js" },
    { regex: /\bchild_process\b/, lang: "js" },
    { regex: /\beval\s*\(/, lang: "js" },
    { regex: /new\s+Function\s*\(/, lang: "js" },
    { regex: /vm\.runIn(?:New|This)?Context\s*\(/, lang: "js" },
    // Python
    { regex: /os\.system\s*\(/, lang: "py" },
    { regex: /subprocess\.(?:run|Popen|call|check_output|check_call)\s*\(/, lang: "py" },
    { regex: /\bexec\s*\(/, lang: "py" },
    { regex: /\beval\s*\(/, lang: "py" },
    { regex: /os\.popen\s*\(/, lang: "py" },
    { regex: /commands\.getoutput\s*\(/, lang: "py" },
    // Go
    { regex: /exec\.Command\s*\(/, lang: "go" },
];

// Heuristic: check if the argument is a string literal (safer) or variable (dangerous)
const LITERAL_ARG = /\(\s*['"`][^'"`${}]*['"`]\s*[,)]/;
const TEMPLATE_LITERAL = /\(\s*`[^`]*\$\{/;

/**
 * @param {Array<{path: string, content: string}>} files
 * @returns {{ score: number, status: string, findings: Array }}
 */
function analyzeCommandInjection(files) {
    const findings = [];

    for (const file of files) {
        const lines = file.content.split("\n");

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Skip comments
            const trimmed = line.trim();
            if (trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("*")) continue;

            for (const pattern of DANGEROUS_FUNCTIONS) {
                if (!pattern.regex.test(line)) continue;

                // Determine if it's a literal arg or variable
                const isLiteral = LITERAL_ARG.test(line) && !TEMPLATE_LITERAL.test(line);

                if (isLiteral) {
                    findings.push({
                        severity: "low",
                        file: file.path,
                        line: i + 1,
                        snippet: trimmed,
                        message: "Shell command with literal argument. Verify this is intentional.",
                        remediation:
                            "If this command is intentional and never receives LLM input, consider documenting why it's needed.",
                    });
                } else {
                    findings.push({
                        severity: "critical",
                        file: file.path,
                        line: i + 1,
                        snippet: trimmed,
                        message:
                            "Potential command injection — shell command with variable/dynamic argument.",
                        remediation:
                            "Avoid passing LLM-provided input directly to shell commands. Use allowlists for permitted commands and validate/sanitize all input parameters.",
                    });
                }

                break; // Only flag once per line
            }
        }
    }

    // Scoring
    const criticalCount = findings.filter((f) => f.severity === "critical").length;
    const lowCount = findings.filter((f) => f.severity === "low").length;

    let score;
    if (criticalCount > 0) {
        score = Math.max(0, 100 - criticalCount * 25);
    } else if (lowCount > 0) {
        score = Math.max(60, 100 - lowCount * 5);
    } else {
        score = 100;
    }

    const status = criticalCount > 0 ? "fail" : lowCount > 0 ? "warn" : "pass";

    return {
        score,
        status,
        findings: findings.slice(0, 50),
    };
}

module.exports = { analyzeCommandInjection };
