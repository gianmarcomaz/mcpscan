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
    // Go
    /mcp\.NewTool\s*\(/g,
    /\.AddTool\s*\(/g,
    /AddTools?\s*\(/g,
    /RegisterTool/g,
];

// Extract description from nearby lines
const DESCRIPTION_PATTERNS = [
    /description\s*[:=]\s*['"`]([^'"`]*(?:['"`][^'"`]*)*?)['"`]/gi,
    /description\s*[:=]\s*['"`]([\s\S]*?)['"`]/gi,
    /"""([\s\S]*?)"""/g,  // Python docstrings
    /'''([\s\S]*?)'''/g,
];

// Extract tool names
const NAME_PATTERNS = [
    /name\s*[:=]\s*['"`]([^'"`]+)['"`]/gi,
];

const SHADOWED_NAMES = new Set([
    "read_file", "write_file", "execute_command", "run_script", "get_user_info",
    "sudo", "eval", "system", "fetch_url", "http_get", "fs_read", "fs_write",
]);

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
    {
        regex: /[\u200B\u200C\u200D\u202E\uFEFF]/,
        severity: "critical",
        message: "Zero-width or text-direction override characters detected. These hide instructions from human reviewers.",
    },
    {
        regex: /<!--[\s\S]*?-->/,
        severity: "critical",
        message: "HTML comment detected. Instructions inside HTML comments hide from users but are processed by LLMs.",
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

            // Check for base64 — tuned to 40+ chars to avoid random hashes
            const base64Match = desc.text.match(/\b[A-Za-z0-9+/]{40,}={0,2}\b/);
            if (base64Match) {
                findings.push({
                    severity: "medium",
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

        // Step 4: Analyze tool names for shadowing
        for (const pattern of NAME_PATTERNS) {
            pattern.lastIndex = 0;
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const toolName = match[1].toLowerCase();
                if (SHADOWED_NAMES.has(toolName)) {
                    const lineNum = content.slice(0, match.index).split("\n").length;
                    findings.push({
                        severity: "high",
                        file: file.path,
                        line: lineNum,
                        snippet: match[0],
                        message: `Tool name '${toolName}' shadows a common system or sensitive tool name.`,
                        remediation: "Use a more specific, domain-prefixed name for the tool to avoid confusing the LLM or shadowing built-in systemic capabilities.",
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
        score = 100; // No tool defs found in scanned files — no risk detected
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
