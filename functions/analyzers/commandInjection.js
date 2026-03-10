/**
 * Command Injection Analyzer
 * Scans for dangerous code execution patterns that could allow RCE via LLM input.
 *
 * Context-aware:
 *   - Test files are excluded (not production code)
 *   - Install-time scripts (preinstall, postinstall, setup) get reduced severity
 *   - CLI tools (cmd/, cli/, scripts/) are treated as lower risk
 *   - Go's exec.Command() is NOT shell execution (args are explicit, no shell)
 *   - Import/require statements are NOT findings (only actual calls matter)
 */

/* ════════════════════════════════════════════════════
   Test‑file & CLI‑tool detection
   ════════════════════════════════════════════════════ */

/** Matches test file paths across JS/TS/Go/Python */
const TEST_FILE_RE =
    /(?:[\\/](?:__tests__|tests?|spec|__mocks__|mock|fixture|e2e|testdata|testutil)[\\/]|[\\/](?:.*_test|.*\.test|.*\.spec)\.[a-z]+$)/i;

/** Matches CLI‑tool / build‑script paths */
const CLI_TOOL_RE =
    /(?:^|[\\/])(?:cmd|cli|scripts|tools|bin|hack|contrib)[\\/]/i;

/** Install-time script filenames — run at setup, not at runtime */
const INSTALL_TIME_FILENAMES = new Set([
    "preinstall.js", "postinstall.js", "preinstall.ts", "postinstall.ts",
    "setup.js", "setup.ts", "setup.sh", "setup.bat",
    "install.js", "install.sh",
]);

/**
 * Check if a file is an install-time script.
 * Matches by filename or by being referenced in package.json scripts.
 */
function isInstallTimeFile(filePath, allFiles) {
    // Check filename
    const basename = filePath.replace(/^.*[\\/]/, "").toLowerCase();
    if (INSTALL_TIME_FILENAMES.has(basename)) return true;

    // Check if referenced in package.json install scripts
    const pkgFile = allFiles.find((f) => /[\\/]?package\.json$/.test(f.path));
    if (pkgFile) {
        try {
            const pkg = JSON.parse(pkgFile.content);
            const installScripts = [
                pkg.scripts?.preinstall,
                pkg.scripts?.postinstall,
                pkg.scripts?.prepare,
            ].filter(Boolean);
            // Check if this file is referenced in any install script
            if (installScripts.some((s) => s.includes(basename))) return true;
        } catch { /* invalid json */ }
    }
    return false;
}

/* ════════════════════════════════════════════════════
   Dangerous function patterns
   ════════════════════════════════════════════════════ */

const DANGEROUS_FUNCTIONS = [
    // JavaScript / TypeScript — these use a shell by default
    { regex: /(?:^|[^a-zA-Z0-9_.])exec\s*\(|child_process\.exec\s*\(/, lang: "js", shellBased: true },
    { regex: /(?:^|[^a-zA-Z0-9_.])execSync\s*\(|child_process\.execSync\s*\(/, lang: "js", shellBased: true },
    { regex: /(?:^|[^a-zA-Z0-9_.])execFile\s*\(|child_process\.execFile\s*\(/, lang: "js", shellBased: false },
    { regex: /(?:^|[^a-zA-Z0-9_.])execFileSync\s*\(|child_process\.execFileSync\s*\(/, lang: "js", shellBased: false },
    { regex: /(?:^|[^a-zA-Z0-9_.])spawn\s*\(|child_process\.spawn\s*\(/, lang: "js", shellBased: false },
    { regex: /(?:^|[^a-zA-Z0-9_.])spawnSync\s*\(|child_process\.spawnSync\s*\(/, lang: "js", shellBased: false },
    { regex: /(?:^|[^a-zA-Z0-9_.])eval\s*\(/, lang: "js", shellBased: true },
    { regex: /new\s+Function\s*\(/, lang: "js", shellBased: true },
    { regex: /vm\.runIn(?:New|This)?Context\s*\(/, lang: "js", shellBased: true },
    // Python — os.system uses shell; subprocess can go either way
    { regex: /os\.system\s*\(/, lang: "py", shellBased: true },
    { regex: /subprocess\.(?:run|Popen|call|check_output|check_call)\s*\(/, lang: "py", shellBased: false }, // Will check for shell=True dynamically
    { regex: /(?:^|[^a-zA-Z0-9_.])exec\s*\(/, lang: "py", shellBased: true },
    { regex: /(?:^|[^a-zA-Z0-9_.])eval\s*\(/, lang: "py", shellBased: true },
    { regex: /os\.popen\s*\(/, lang: "py", shellBased: true },
    { regex: /commands\.getoutput\s*\(/, lang: "py", shellBased: true },
    // Go — exec.Command runs directly, NO shell involved
    { regex: /exec\.Command\s*\(/, lang: "go", shellBased: false },
];

// Heuristic: check if the first argument is a string literal (safer) or variable
const LITERAL_ARG = /\(\s*['"`][^'"`${}]*['"`]\s*[,)]/;
const TEMPLATE_LITERAL = /\(\s*`[^`]*\$\{/;

/** Import/require statements — NOT a finding, just a declaration */
const IMPORT_RE = /^\s*(?:import\s+|const\s+.*=\s*require\s*\(|from\s+['"]|require\s*\(\s*['"])/;

/**
 * Scan for locally-defined constants assigned string literals.
 * If a variable is const X = 'literal' and then used in exec(X),
 * that's effectively a literal — LOW not CRITICAL.
 */
function findLocalConstants(lines) {
    const constants = new Set();
    for (const line of lines) {
        const match = line.match(/(?:const|let|var)\s+(\w+)\s*=\s*['"`][^'"`${}]*['"`]/);
        if (match) constants.add(match[1]);
    }
    return constants;
}

/** Check if the first arg passed to a function call is a known constant */
function isArgLocalConstant(line, constants) {
    // e.g., execSync(CMD) where CMD is a known string constant
    const match = line.match(/(?:exec|execSync|execFile|execFileSync|spawn|spawnSync|eval)\s*\(\s*(\w+)\s*[,)]/)
    if (match && constants.has(match[1])) return true;
    return false;
}

/* ════════════════════════════════════════════════════
   Go-specific helpers
   ════════════════════════════════════════════════════ */

/**
 * Go's exec.Command(name, args...) executes directly without a shell.
 * Only the first argument (the binary) being dynamic is a real concern.
 * If the first arg is a literal string, the command itself is fixed.
 */
const GO_EXEC_LITERAL_BINARY = /exec\.Command\s*\(\s*"[^"]+"/;
const GO_EXEC_ARGS_SPREAD = /exec\.Command\s*\(\s*\w+\s*,\s*\w+\s*\.\.\.\s*\)/;

function isGoExecSafe(line) {
    // First arg is a literal string → binary is fixed, much safer
    if (GO_EXEC_LITERAL_BINARY.test(line)) return true;
    return false;
}

function isGoExecFirstArgDynamic(line) {
    // exec.Command(someVar, ...) or exec.Command(parts[0], parts[1:]...)
    if (/exec\.Command\s*\(\s*[a-zA-Z_]\w*(?:\s*[,)])|\[\d+\]/.test(line) && !GO_EXEC_LITERAL_BINARY.test(line)) {
        return true;
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
function analyzeCommandInjection(files) {
    const findings = [];

    for (const file of files) {
        const lines = file.content.split("\n");
        const isTestFile = TEST_FILE_RE.test(file.path);
        const isCliTool = CLI_TOOL_RE.test(file.path);
        const isGoFile = /\.go$/.test(file.path);
        const isInstallTime = isInstallTimeFile(file.path, files);
        const localConstants = findLocalConstants(lines);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Skip comments
            const trimmed = line.trim();
            if (trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("*")) continue;

            // ── SKIP: Import/require statements are NOT findings ──
            if (IMPORT_RE.test(trimmed)) continue;

            for (const pattern of DANGEROUS_FUNCTIONS) {
                if (!pattern.regex.test(line)) continue;

                /* ── Context 1: Test files → skip entirely ── */
                if (isTestFile) {
                    // Don't even report test-file findings — they are not prod code
                    break;
                }

                /* ── Context 2: Go exec.Command — NOT shell execution ── */
                if (isGoFile && pattern.lang === "go") {
                    if (isGoExecSafe(line)) {
                        // Literal binary name + explicit args → benign
                        // Don't flag at all — Go's exec.Command with literal is safe
                        break;
                    }

                    if (isGoExecFirstArgDynamic(line)) {
                        // Dynamic binary name — the real risk in Go
                        const severity = isCliTool ? "medium" : "high";
                        findings.push({
                            severity,
                            file: file.path,
                            line: i + 1,
                            snippet: trimmed,
                            message: isCliTool
                                ? "CLI tool uses dynamic command name in exec.Command. Verify user input is validated."
                                : "Dynamic command name in exec.Command — the executed binary is determined at runtime.",
                            remediation:
                                "Use an allowlist of permitted binaries. Validate the command name before passing to exec.Command().",
                        });
                        break;
                    }

                    // Go exec.Command with args spread (e.g., exec.Command("docker", args...))
                    // The binary is literal but args are dynamic — lower risk than shell
                    if (GO_EXEC_ARGS_SPREAD.test(line)) {
                        findings.push({
                            severity: isCliTool ? "low" : "medium",
                            file: file.path,
                            line: i + 1,
                            snippet: trimmed,
                            message: "exec.Command with spread args — binary is fixed but arguments come from a variable.",
                            remediation:
                                "Validate argument values before passing to exec.Command. Go's exec.Command does NOT use a shell, so injection risk is limited to argument manipulation.",
                        });
                        break;
                    }
                }

                /* ── Context 3: Install-time scripts → reduced severity ── */
                if (isInstallTime) {
                    const isLiteral = LITERAL_ARG.test(line) && !TEMPLATE_LITERAL.test(line);
                    const isConst = isArgLocalConstant(line, localConstants);
                    if (isLiteral || isConst) {
                        findings.push({
                            severity: "low",
                            file: file.path,
                            line: i + 1,
                            snippet: trimmed,
                            message: "Install-time script — runs at setup only, not at runtime. Verify this never receives dynamic input.",
                            remediation:
                                "If this command is only for project setup, this is acceptable. Ensure it never receives user or LLM input.",
                        });
                    } else {
                        findings.push({
                            severity: "medium",
                            file: file.path,
                            line: i + 1,
                            snippet: trimmed,
                            message: "Install-time script uses dynamic argument — verify input source.",
                            remediation:
                                "Install scripts should only use hardcoded commands. Dynamic arguments may indicate supply-chain risk.",
                        });
                    }
                    break;
                }

                /* ── Context 4: CLI tools → downgrade severity ── */
                if (isCliTool) {
                    const isLiteral = LITERAL_ARG.test(line) && !TEMPLATE_LITERAL.test(line);
                    findings.push({
                        severity: isLiteral ? "low" : "medium",
                        file: file.path,
                        line: i + 1,
                        snippet: trimmed,
                        message: isLiteral
                            ? "CLI utility uses shell command with literal argument."
                            : "CLI utility uses shell command with dynamic argument — verify input is validated.",
                        remediation:
                            "CLI tools should validate and sanitize all user input before passing to shell commands.",
                    });
                    break;
                }

                /* ── Context 5: Regular production code ── */
                const isLiteral = LITERAL_ARG.test(line) && !TEMPLATE_LITERAL.test(line);
                const isConst = isArgLocalConstant(line, localConstants);

                // Check for shell metacharacters inside literal strings (e.g. exec("rm -rf / && something"))
                let hasDangerousMetachars = false;
                if (isLiteral) {
                    const argMatch = line.match(/\(\s*['"`]([^'"`${}]*)['"`]/);
                    if (argMatch && /[&|;<>$`\n]|>\s*&/.test(argMatch[1])) {
                        hasDangerousMetachars = true;
                    }
                }

                // Check for Python shell=True
                const isPythonShellTrue = pattern.lang === "py" && /shell\s*=\s*True/i.test(line);
                const isShellBased = pattern.shellBased || isPythonShellTrue || hasDangerousMetachars;

                if ((isLiteral || isConst) && !hasDangerousMetachars) {
                    findings.push({
                        severity: "low",
                        file: file.path,
                        line: i + 1,
                        snippet: trimmed,
                        message: isConst
                            ? "Shell command uses a locally-defined constant. Verify it is never reassigned from external input."
                            : "Shell command with literal argument. Verify this is intentional.",
                        remediation:
                            "If this command is intentional and never receives LLM input, consider documenting why it's needed.",
                    });
                } else {
                    findings.push({
                        severity: isShellBased ? "critical" : "high",
                        file: file.path,
                        line: i + 1,
                        snippet: trimmed,
                        message: hasDangerousMetachars
                            ? "Shell metacharacters detected in literal command string — explicit command injection or risky behavior."
                            : isShellBased
                                ? "Potential command injection — shell command with variable/dynamic argument."
                                : "Command execution with dynamic argument — verify input is not from LLM.",
                        remediation:
                            "Avoid passing LLM-provided input directly to shell commands. Use allowlists for permitted commands and validate/sanitize all input parameters.",
                    });
                }

                break; // Only flag once per line
            }
        }
    }

    /* ════════════════════════════════════════════════
       Scoring — severity-weighted
       ════════════════════════════════════════════════ */
    const criticalCount = findings.filter((f) => f.severity === "critical").length;
    const highCount = findings.filter((f) => f.severity === "high").length;
    const mediumCount = findings.filter((f) => f.severity === "medium").length;
    const lowCount = findings.filter((f) => f.severity === "low").length;

    let score;
    if (criticalCount > 0) {
        score = Math.max(0, 100 - criticalCount * 25 - highCount * 10);
    } else if (highCount > 0) {
        score = Math.max(30, 100 - highCount * 15 - mediumCount * 5);
    } else if (mediumCount > 0) {
        score = Math.max(60, 95 - mediumCount * 8);
    } else if (lowCount > 0) {
        score = Math.max(80, 100 - lowCount * 3);
    } else {
        score = 100;
    }

    const status = criticalCount > 0 ? "fail" : highCount > 0 ? "fail" : mediumCount > 0 ? "warn" : "pass";

    return {
        score,
        status,
        findings: findings.slice(0, 50),
    };
}

module.exports = { analyzeCommandInjection };
