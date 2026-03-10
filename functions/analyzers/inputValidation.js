/**
 * Input Validation Analyzer
 *
 * Assesses whether tool handlers validate their inputs.
 * Uses contextual filtering to avoid false positives on safe code
 * like logging/redaction, config reading, response building, and test files.
 *
 * Only flags dynamic property access when it occurs in a DANGEROUS context
 * (exec, eval, spawn, SQL, file ops) or inside an MCP tool handler without
 * validation.
 */

/* ════════════════════════════════════════════════════
   Good Patterns — validation indicators
   ════════════════════════════════════════════════════ */

const GOOD_PATTERNS = [
    { regex: /z\.(?:object|string|number|boolean|array|enum)\s*\(/, name: "Zod schema" },
    { regex: /\.parse\s*\(|\.safeParse\s*\(/, name: "Schema parsing" },
    { regex: /ajv\.(?:validate|compile)\s*\(/, name: "Ajv validation" },
    { regex: /typeof\s+\w+\s*===?\s*['"](?:string|number|boolean|object)['"]/, name: "typeof check" },
    { regex: /if\s*\(\s*!(?:params|args|input|data)\b/, name: "Null/falsy guard" },
    { regex: /\.length\s*[><]=?/, name: "Length validation" },
    { regex: /instanceof\s+/, name: "instanceof check" },
    { regex: /(?:joi|yup|superstruct|valibot)\./, name: "Validation library" },
    { regex: /Number\.isFinite|Number\.isInteger|Number\.isNaN/, name: "Number validation" },
    { regex: /inputSchema|input_schema/, name: "Schema definition" },
    { regex: /"enum"\s*:\s*\[|\benum\b\s*:/, name: "Enum constraint" },
    { regex: /path\.resolve|path\.join|path\.normalize/, name: "Path sanitization" },
    { regex: /new\s+URL\s*\(|url\.parse\s*\(/, name: "URL parsing/validation" },
    { regex: /\.includes\s*\(\s*['"]\.\.['"]/i, name: "Path traversal guard" },
    { regex: /\.startsWith\s*\(/, name: "Prefix validation" },
    { regex: /allowlist|whitelist|permitted|allowed/i, name: "Allowlist check" },
];

/* ════════════════════════════════════════════════════
   Dangerous Sink Patterns — true positives
   ════════════════════════════════════════════════════ */

const DANGEROUS_SINKS = [
    // ── Command injection via args ──
    {
        regex: /(?:exec|spawn|eval)\s*\(\s*(?:args|params|input)\b/,
        name: "Args passed to exec/eval",
        severity: "critical",
        remediation:
            "Never pass raw tool arguments to exec(), eval(), or spawn(). Use allowlists for permitted commands and validate/sanitize all parameters.",
    },
    {
        regex: /(?:exec|spawn|eval)\s*\(\s*.*\bargs\s*\[/,
        name: "Dynamic args property passed to exec/eval",
        severity: "critical",
        remediation:
            "Never pass dynamic args properties to shell execution functions. Use allowlists and strict input validation.",
    },
    {
        regex: /(?:exec|spawn|eval)\s*\(\s*`[^`]*\$\{.*(?:args|params|input)/,
        name: "Template literal with args in exec/eval",
        severity: "critical",
        remediation:
            "Avoid string interpolation of user input into shell commands. Use parameterized execution with allowlisted commands.",
    },
    {
        regex: /os\.system\s*\(\s*.*(?:args|params|input)/,
        name: "Args passed to os.system",
        severity: "critical",
        remediation:
            "Replace os.system() with subprocess.run() using argument lists, and validate all inputs against an allowlist.",
    },
    {
        regex: /subprocess\.(?:run|Popen|call|check_output)\s*\(\s*.*(?:args|params|input)/,
        name: "Args passed to subprocess",
        severity: "critical",
        remediation:
            "Validate all arguments before passing to subprocess. Use allowlists for commands and sanitize parameters.",
    },
    // ── Path traversal ──
    {
        regex: /(?:readFile|readFileSync|writeFile|writeFileSync|createReadStream|createWriteStream|appendFile|appendFileSync)\s*\(\s*(?:args|params|input)\b/,
        name: "File operation with unsanitized tool input — path traversal risk",
        severity: "critical",
        remediation:
            "Sanitize file paths from tool input. Use path.resolve() and verify the result stays within an allowed directory. Reject paths containing '..' sequences.",
    },
    {
        regex: /(?:readFile|readFileSync|writeFile|writeFileSync|createReadStream|createWriteStream)\s*\(\s*(?:args|params|input)\s*[\.\[]/,
        name: "File operation with tool input property — path traversal risk",
        severity: "critical",
        remediation:
            "Sanitize file paths. Use path.resolve() with a base directory and verify the resolved path doesn't escape the allowed directory.",
    },
    {
        regex: /(?:readFile|readFileSync|writeFile|writeFileSync)\s*\(\s*`[^`]*\$\{.*(?:args|params|input)/,
        name: "File path built from template literal with tool input",
        severity: "critical",
        remediation:
            "Do not interpolate tool input into file paths. Build paths with path.join() and validate against an allowed base directory.",
    },
    {
        regex: /open\s*\(\s*(?:args|params|input)\b/,
        name: "Python open() with unsanitized tool input",
        severity: "critical",
        remediation:
            "Validate file paths from tool input. Use os.path.realpath() and verify the result stays within an allowed directory.",
    },
    // ── SSRF ──
    {
        regex: /(?:fetch|axios\.get|axios\.post|axios|got|request|http\.get|https\.get|urllib\.request)\s*\(\s*(?:args|params|input)\b/,
        name: "HTTP request with unsanitized tool input URL — SSRF risk",
        severity: "high",
        remediation:
            "Validate URLs from tool input. Use an allowlist of permitted domains/protocols. Block requests to internal IPs (127.0.0.1, 10.x, 192.168.x, 169.254.x).",
    },
    {
        regex: /(?:fetch|axios|got|request|http\.get|https\.get)\s*\(\s*(?:args|params|input)\s*[\.\[]/,
        name: "HTTP request with tool input property — SSRF risk",
        severity: "high",
        remediation:
            "Validate URLs before making requests. Use URL parsing to verify the protocol (https only) and domain (allowlist).",
    },
    {
        regex: /(?:fetch|axios|got|request)\s*\(\s*`[^`]*\$\{.*(?:args|params|input)/,
        name: "URL built from template literal with tool input — SSRF risk",
        severity: "high",
        remediation:
            "Do not interpolate tool input into URLs. Parse and validate the URL separately before making the request.",
    },
    // ── SQL injection ──
    {
        regex: /\.query\s*\(\s*`[^`]*\$\{.*(?:args|params|input)/,
        name: "SQL query with interpolated tool input — injection risk",
        severity: "critical",
        remediation:
            "Never interpolate tool input into SQL queries. Use parameterized queries (prepared statements) instead.",
    },
    {
        regex: /\.query\s*\(\s*['"][^'"]*['"]\s*\+\s*(?:args|params|input)/,
        name: "SQL query with concatenated tool input — injection risk",
        severity: "critical",
        remediation:
            "Never concatenate tool input into SQL strings. Use parameterized queries with placeholder values.",
    },
    {
        regex: /(?:execute|exec|run)\s*\(\s*`[^`]*\$\{.*(?:args|params|input)/,
        name: "Database execution with interpolated tool input",
        severity: "critical",
        remediation:
            "Use parameterized queries instead of string interpolation for database operations.",
    },
];

/* ════════════════════════════════════════════════════
   Dynamic Access Patterns — context-dependent
   ════════════════════════════════════════════════════ */

const DYNAMIC_ACCESS_REGEX = /args\s*\[\s*\w+\s*\]/;
const SPREAD_REGEX = /\.\.\.(?:args|params|input)\b/;

/* ════════════════════════════════════════════════════
   Dynamic Dispatch Pattern — always dangerous
   ════════════════════════════════════════════════════ */

const DISPATCH_PATTERNS = [
    {
        regex: /\w+\s*\[\s*(?:args|params|input)\s*\.\s*\w+\s*\]\s*\(/,
        name: "Dynamic dispatch from user input",
        severity: "high",
        remediation:
            "Do not use user-supplied values to dynamically select and invoke functions. Use an explicit allowlist map instead.",
    },
    {
        regex: /\w+\s*\[\s*(?:args|params|input)\s*\[\s*\w+\s*\]\s*\]\s*\(/,
        name: "Dynamic dispatch from user input",
        severity: "high",
        remediation:
            "Do not use user-supplied values to dynamically select and invoke functions. Use an explicit allowlist map instead.",
    },
];

/* ════════════════════════════════════════════════════
   False Positive Exclusion Helpers
   ════════════════════════════════════════════════════ */

/** Test file paths */
const TEST_FILE_RE = /(?:[\\/](?:__tests__|tests?|spec|__mocks__|mock|fixture)[\\/]|\.(?:test|spec)\.[jt]sx?$)/i;

/** Redaction / logging / sanitization variable names */
const SAFE_VARIABLE_RE = /\b(?:redact|mask|sanitiz|log|debug|print|censor|hide|obfuscat|display|format|stringify|output|response|result|reply)\w*\s*\[/i;

/** Config / settings / env reading */
const CONFIG_SOURCE_RE = /\b(?:config|settings|env|process\.env|os\.environ|serverConfig|appConfig|options|defaults|constants)\b/i;

/** Response / output building (left-hand side assignment) */
const RESPONSE_BUILD_RE = /\b(?:response|result|output|reply|data|body|payload|ret|res)\s*\[/i;

/**
 * Determine if a line containing dynamic access is actually safe.
 */
function isDynamicAccessSafe(line, filePath) {
    // 1. Test files — skip entirely
    if (TEST_FILE_RE.test(filePath)) return true;

    // 2. Redaction / logging / sanitization
    if (SAFE_VARIABLE_RE.test(line)) return true;

    // 3. Config reading (source of the value is config, not executing it)
    if (CONFIG_SOURCE_RE.test(line) && !/exec|spawn|eval|system/.test(line)) return true;

    // 4. Response / output building
    if (RESPONSE_BUILD_RE.test(line)) return true;

    // 5. String literal index (e.g. args[0], args[1] — static positional)
    if (/args\s*\[\s*\d+\s*\]/.test(line) && !/exec|spawn|eval|system/.test(line)) return true;

    return false;
}

/**
 * Determine if a spread is safe (e.g., test mocks, config spreading).
 */
function isSpreadSafe(line, filePath) {
    // Test files
    if (TEST_FILE_RE.test(filePath)) return true;

    // Spreading into a constructor / object literal (not into exec/eval)
    if (!/exec|spawn|eval|system/.test(line)) {
        // Spreading into vi.fn, jest.fn, mock functions
        if (/(?:vi|jest)\.fn|mock/i.test(line)) return true;
        // Spreading into console/log
        if (/console\.|log\(|print\(/i.test(line)) return true;
    }

    return false;
}

/* ════════════════════════════════════════════════════
   Main Analyzer
   ════════════════════════════════════════════════════ */

/**
 * @param {Array<{path: string, content: string}>} files
 * @returns {{ score: number, status: string, findings: Array }}
 */
function analyzeInputValidation(files) {
    const findings = [];
    let goodCount = 0;
    let hasInputSchema = false;

    for (const file of files) {
        const content = file.content;

        // Only scan source files
        if (!/\.(?:js|ts|jsx|tsx|py|go|rs)$/.test(file.path)) continue;

        if (/inputSchema|input_schema|parameters\s*[:=]\s*\{|InputSchema|mcp\.Property|WithDescription|Required\s*[:=]/.test(content)) {
            hasInputSchema = true;
        }

        // Count good validation patterns (file-level — same as before)
        for (const pattern of GOOD_PATTERNS) {
            if (pattern.regex.test(content)) {
                goodCount++;
            }
        }

        const lines = content.split("\n");

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            /* ── 1. Dangerous sinks — always flag ── */
            for (const sink of DANGEROUS_SINKS) {
                if (sink.regex.test(line)) {
                    findings.push({
                        severity: sink.severity,
                        file: file.path,
                        line: i + 1,
                        snippet: line.trim().slice(0, 200),
                        message: `${sink.name} — potential unsafe input usage.`,
                        remediation: sink.remediation,
                    });
                }
            }

            /* ── 2. Dynamic dispatch — always flag ── */
            for (const dp of DISPATCH_PATTERNS) {
                if (dp.regex.test(line)) {
                    findings.push({
                        severity: dp.severity,
                        file: file.path,
                        line: i + 1,
                        snippet: line.trim().slice(0, 200),
                        message: `${dp.name} — could allow arbitrary function invocation.`,
                        remediation: dp.remediation,
                    });
                }
            }

            /* ── 3. Dynamic property access — only flag if dangerous ── */
            if (DYNAMIC_ACCESS_REGEX.test(line)) {
                if (!isDynamicAccessSafe(line, file.path)) {
                    // Check if it feeds into a dangerous operation on this line or nearby
                    const context = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3)).join("\n");
                    const hasDangerousContext = /exec|spawn|eval|system|subprocess|sql|query\s*\(|readFile|writeFile|open\s*\(/.test(context);

                    if (hasDangerousContext) {
                        findings.push({
                            severity: "high",
                            file: file.path,
                            line: i + 1,
                            snippet: line.trim().slice(0, 200),
                            message: "Dynamic property access on args near dangerous operation — potential unsafe input usage.",
                            remediation:
                                "Validate all tool inputs using a schema validation library like Zod. Define strict input schemas and validate before processing.",
                        });
                    } else {
                        // Only flag in tool handler files as medium
                        const isToolHandler =
                            /server\.tool|\.addTool|@server\.tool|@mcp\.tool|tool_handler|ToolHandler/.test(content);
                        if (isToolHandler) {
                            findings.push({
                                severity: "medium",
                                file: file.path,
                                line: i + 1,
                                snippet: line.trim().slice(0, 200),
                                message: "Dynamic property access on args in tool handler — validate inputs before use.",
                                remediation:
                                    "Validate all tool inputs using a schema validation library like Zod. Define strict input schemas and validate before processing.",
                            });
                        }
                        // If not a tool handler and not near danger — skip entirely (false positive)
                    }
                }
            }

            /* ── 4. Spread patterns — only flag if dangerous ── */
            if (SPREAD_REGEX.test(line)) {
                if (!isSpreadSafe(line, file.path)) {
                    const hasDangerousContext = /exec|spawn|eval|system|subprocess/.test(line);
                    if (hasDangerousContext) {
                        findings.push({
                            severity: "high",
                            file: file.path,
                            line: i + 1,
                            snippet: line.trim().slice(0, 200),
                            message: "Spreading args into dangerous function — potential unsafe input usage.",
                            remediation:
                                "Do not spread unvalidated args into shell execution functions. Validate each argument individually.",
                        });
                    } else {
                        const isToolHandler =
                            /server\.tool|\.addTool|@server\.tool|@mcp\.tool|tool_handler|ToolHandler/.test(content);
                        if (isToolHandler) {
                            findings.push({
                                severity: "low",
                                file: file.path,
                                line: i + 1,
                                snippet: line.trim().slice(0, 200),
                                message: "Spreading args in tool handler — verify all spread targets are safe.",
                                remediation:
                                    "Validate all tool inputs before spreading. Prefer explicit parameter extraction over spread.",
                            });
                        }
                    }
                }
            }
        }
    }

    // Informational finding when no validation at all
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

    // Flag if missing input schemas
    if (!hasInputSchema) {
        findings.push({
            severity: "medium",
            file: "project",
            line: null,
            snippet: "",
            message: "No inputSchema definitions found. The server accepts arbitrary input without constraints.",
            remediation:
                "Declare an inputSchema for all tools. Use JSON Schema to constrain inputs, specifying types, required fields, and enum values.",
        });
    }

    /* ════════════════════════════════════════════════
       Scoring — severity-based, consistent with score
       ════════════════════════════════════════════════ */

    const criticalCount = findings.filter((f) => f.severity === "critical").length;
    const highCount = findings.filter((f) => f.severity === "high").length;
    const mediumCount = findings.filter((f) => f.severity === "medium").length;
    const lowCount = findings.filter((f) => f.severity === "low").length;

    // Raw penalty — criticals are devastating, highs are severe
    const penalty = criticalCount * 50 + highCount * 25 + mediumCount * 10 + lowCount * 3;

    // Good patterns can recover up to 60% of penalty, never fully erase
    const recovery = Math.min(goodCount * 3, Math.floor(penalty * 0.6));

    let score;
    if (findings.length === 0 && goodCount >= 2) {
        score = 100;
    } else if (findings.length === 0) {
        score = goodCount >= 1 ? 80 : 50;
    } else {
        score = Math.max(0, Math.min(95, 100 - penalty + recovery));
    }

    // Status derived from score — always consistent
    const status = score >= 80 ? "pass" : score >= 50 ? "warn" : "fail";

    return {
        score,
        status,
        findings: findings.slice(0, 50),
    };
}

module.exports = { analyzeInputValidation };
