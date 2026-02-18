/**
 * Input Validation Analyzer
 * Assesses whether tool handlers validate their inputs.
 */

// Good patterns: validation libraries and manual checks
const GOOD_PATTERNS = [
    { regex: /z\.(?:object|string|number|boolean|array|enum)\s*\(/, name: "Zod schema" },
    { regex: /\.parse\s*\(|\.safeParse\s*\(/, name: "Schema parsing" },
    { regex: /ajv\.(?:validate|compile)\s*\(/, name: "Ajv validation" },
    { regex: /typeof\s+\w+\s*===?\s*['"](?:string|number|boolean|object)['"]/, name: "typeof check" },
    { regex: /if\s*\(\s*!(?:params|args|input|data)\b/, name: "Null/falsy guard" },
    { regex: /\.length\s*[><=]/, name: "Length validation" },
    { regex: /instanceof\s+/, name: "instanceof check" },
    { regex: /(?:joi|yup|superstruct|valibot)\./, name: "Validation library" },
    { regex: /JSON\.parse\s*\(/, name: "JSON parsing" },
    { regex: /Number\.isFinite|Number\.isInteger|Number\.isNaN/, name: "Number validation" },
    { regex: /inputSchema|input_schema/, name: "Schema definition" },
];

// Bad patterns: dangerous input usage
const BAD_PATTERNS = [
    {
        regex: /(?:exec|spawn|eval)\s*\(\s*(?:args|params|input)\b/,
        name: "Args passed to exec/eval",
        severity: "critical",
    },
    {
        regex: /args\s*\[\s*\w+\s*\]/,
        name: "Dynamic property access on args",
        severity: "medium",
    },
    {
        regex: /\.\.\.(?:args|params|input)\b/,
        name: "Spreading args into function",
        severity: "medium",
    },
];

/**
 * @param {Array<{path: string, content: string}>} files
 * @returns {{ score: number, status: string, findings: Array }}
 */
function analyzeInputValidation(files) {
    const findings = [];
    let goodCount = 0;
    let badCount = 0;

    for (const file of files) {
        const content = file.content;

        // Only scan source files that likely contain tool handlers
        if (!/\.(?:js|ts|jsx|tsx|py|go|rs)$/.test(file.path)) continue;

        // Check for tool handler patterns
        const isToolHandler =
            /server\.tool|\.addTool|@server\.tool|@mcp\.tool|tool_handler|ToolHandler/.test(content);

        // Good patterns
        for (const pattern of GOOD_PATTERNS) {
            if (pattern.regex.test(content)) {
                goodCount++;
            }
        }

        // Bad patterns
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            for (const pattern of BAD_PATTERNS) {
                if (pattern.regex.test(line)) {
                    badCount++;
                    findings.push({
                        severity: pattern.severity,
                        file: file.path,
                        line: i + 1,
                        snippet: line.trim().slice(0, 200),
                        message: `${pattern.name} — potential unsafe input usage.`,
                        remediation:
                            "Validate all tool inputs using a schema validation library like Zod. Define strict input schemas and validate before processing.",
                    });
                }
            }
        }
    }

    // Add informational finding about overall validation state
    if (goodCount === 0) {
        findings.push({
            severity: "medium",
            file: "project",
            line: null,
            snippet: "",
            message: "No input validation patterns detected in the project.",
            remediation:
                "Add input validation to all tool handlers. Use Zod, Ajv, or manual type checks to validate inputs before processing.",
        });
    }

    // Scoring: start at 50, add for good, subtract for bad
    let score = 50;
    score += goodCount * 10;
    score -= badCount * 20;
    score = Math.max(0, Math.min(100, score));

    const status =
        badCount > 0 ? "fail" : goodCount >= 3 ? "pass" : goodCount >= 1 ? "warn" : "warn";

    return {
        score,
        status,
        findings: findings.slice(0, 50),
    };
}

module.exports = { analyzeInputValidation };
