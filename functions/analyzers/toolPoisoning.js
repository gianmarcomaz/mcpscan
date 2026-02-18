/**
 * Tool Poisoning Analyzer
 * Scans MCP tool definitions for description-based prompt injection.
 */

// Patterns to find tool definitions
const TOOL_DEF_PATTERNS = [
    // JavaScript/TypeScript
    /server\.tool\s*\(/g,
    /\.addTool\s*\(/g,
    /\.add_tool\s*\(/g,
    /tools\s*:\s*\[/g,
    // Python decorators
    /@server\.tool/g,
    /@mcp\.tool/g,
];

// Extract description from nearby lines
const DESCRIPTION_PATTERNS = [
    /description\s*[:=]\s*['"`]([^'"`]*(?:['"`][^'"`]*)*?)['"`]/gi,
    /description\s*[:=]\s*['"`]([\s\S]*?)['"`]/gi,
    /"""([\s\S]*?)"""/g,  // Python docstrings
    /'''([\s\S]*?)'''/g,
];

// Critical injection patterns in descriptions
const INJECTION_PATTERNS = [
    {
        regex: /ignore\s+(?:previous|above|all|prior)/i,
        severity: "critical",
        message: "Instruction override attempt: 'ignore previous' pattern detected.",
    },
    {
        regex: /disregard\s+(?:previous|above|all|prior|earlier)/i,
        severity: "critical",
        message: "Instruction override attempt: 'disregard' pattern detected.",
    },
    {
        regex: /you\s+(?:must|should|have to|need to)\s+(?:always|never)/i,
        severity: "critical",
        message: "Behavioral instruction found in tool description.",
    },
    {
        regex: /you\s+are\s+now/i,
        severity: "critical",
        message: "Identity override attempt detected.",
    },
    {
        regex: /system\s+prompt/i,
        severity: "critical",
        message: "Reference to system prompt found in description.",
    },
    {
        regex: /instructions?\s+override/i,
        severity: "critical",
        message: "Explicit instruction override language detected.",
    },
    {
        regex: /forget\s+(?:everything|all|previous)/i,
        severity: "critical",
        message: "Memory reset attempt in tool description.",
    },
];

const WARNING_PATTERNS_TOOL = [
    {
        regex: /before\s+using\s+this\s+tool/i,
        severity: "medium",
        message: "Cross-tool instruction: references behavior before tool use.",
    },
    {
        regex: /(?:first|also)\s+(?:call|execute|run|use)/i,
        severity: "medium",
        message: "Cross-tool reference: instructs calling other tools.",
    },
    {
        regex: /<[a-z][\s\S]*>/i,
        severity: "medium",
        message: "HTML/XML formatting in tool description — could hide content.",
    },
];

/**
 * @param {Array<{path: string, content: string}>} files
 * @returns {{ score: number, status: string, findings: Array }}
 */
function analyzeToolPoisoning(files) {
    const findings = [];
    let toolDefsFound = 0;

    for (const file of files) {
        const content = file.content;
        const lines = content.split("\n");

        // Step 1: Find tool definitions
        let hasToolDef = false;
        for (const pattern of TOOL_DEF_PATTERNS) {
            pattern.lastIndex = 0;
            if (pattern.test(content)) {
                hasToolDef = true;
                break;
            }
        }

        if (!hasToolDef) continue;
        toolDefsFound++;

        // Step 2: Extract descriptions
        const descriptions = [];
        for (const pattern of DESCRIPTION_PATTERNS) {
            pattern.lastIndex = 0;
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const desc = match[1] || match[0];
                const lineNum = content.slice(0, match.index).split("\n").length;
                descriptions.push({ text: desc, line: lineNum });
            }
        }

        // Step 3: Analyze descriptions
        for (const desc of descriptions) {
            // Check for long descriptions
            if (desc.text.length > 500) {
                findings.push({
                    severity: "medium",
                    file: file.path,
                    line: desc.line,
                    snippet: desc.text.slice(0, 120) + "...",
                    message: `Unusually long tool description (${desc.text.length} chars). Could hide injected instructions.`,
                    remediation:
                        "Keep tool descriptions concise and factual. Descriptions over 300 characters should be reviewed.",
                });
            }

            // Check for base64
            const base64Match = desc.text.match(/[A-Za-z0-9+/]{20,}={0,2}/);
            if (base64Match) {
                findings.push({
                    severity: "critical",
                    file: file.path,
                    line: desc.line,
                    snippet: base64Match[0].slice(0, 60) + "...",
                    message: "Base64-encoded string in tool description — could hide instructions.",
                    remediation:
                        "Remove encoded content from tool descriptions. All description content should be human-readable.",
                });
            }

            // Check injection patterns
            for (const pattern of INJECTION_PATTERNS) {
                if (pattern.regex.test(desc.text)) {
                    findings.push({
                        severity: pattern.severity,
                        file: file.path,
                        line: desc.line,
                        snippet: desc.text.slice(0, 150),
                        message: pattern.message,
                        remediation:
                            "Keep tool descriptions factual and concise. Do not include instructions for the LLM in tool descriptions.",
                    });
                }
            }

            // Check warning patterns
            for (const pattern of WARNING_PATTERNS_TOOL) {
                if (pattern.regex.test(desc.text)) {
                    findings.push({
                        severity: pattern.severity,
                        file: file.path,
                        line: desc.line,
                        snippet: desc.text.slice(0, 150),
                        message: pattern.message,
                        remediation:
                            "Tool descriptions should explain what the tool does, not how the LLM should behave.",
                    });
                }
            }
        }
    }

    // Scoring
    const criticals = findings.filter((f) => f.severity === "critical").length;
    const mediums = findings.filter((f) => f.severity === "medium").length;

    let score;
    if (toolDefsFound === 0) {
        score = 80; // No tool defs found — can't fully assess
    } else if (criticals > 0) {
        score = Math.max(0, 30 - criticals * 15);
    } else if (mediums > 0) {
        score = Math.max(50, 90 - mediums * 10);
    } else {
        score = 100;
    }

    const status = criticals > 0 ? "fail" : mediums > 0 ? "warn" : "pass";

    return {
        score,
        status,
        findings: findings.slice(0, 50),
    };
}

module.exports = { analyzeToolPoisoning };
