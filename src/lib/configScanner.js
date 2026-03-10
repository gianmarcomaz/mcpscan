/**
 * Local MCP Config Scanner
 *
 * Runs entirely client-side. Parses MCP config files, extracts server
 * definitions, and runs security checks against each server.
 *
 * Context-aware severity assignment:
 *   - Transport type (stdio vs http/sse) determines which checks apply
 *   - Auth presence downgrades binding-address severity (high → low)
 *   - stdio servers skip network-auth checks (they don't need it)
 *
 * Finding format matches the existing backend pattern:
 *   { severity, message, file, line, snippet, remediation }
 */

/* ════════════════════════════════════════════════════
   Score deduction weights
   ════════════════════════════════════════════════════ */

const SEVERITY_DEDUCTIONS = {
    critical: -25,
    high: -15,
    medium: -10,
};

/* ════════════════════════════════════════════════════
   Shell metacharacter pattern for stdio args
   ════════════════════════════════════════════════════ */

const SHELL_META_REGEX = /[$`]|&&|\|\||[;|>]/;

/* ════════════════════════════════════════════════════
   Auth-related field names (case-insensitive check)
   ════════════════════════════════════════════════════ */

const AUTH_FIELD_NAMES = [
    "auth", "apikey", "api_key", "token", "bearer", "authorization",
    "apiKey", "api-key", "accessToken", "access_token",
];

/* ════════════════════════════════════════════════════
   Helpers
   ════════════════════════════════════════════════════ */

/**
 * Recursively check if any key in an object matches auth-related names.
 */
function hasAuthField(obj) {
    if (!obj || typeof obj !== "object") return false;

    for (const key of Object.keys(obj)) {
        const lower = key.toLowerCase();
        if (AUTH_FIELD_NAMES.some((f) => lower.includes(f.toLowerCase()))) return true;
        if (typeof obj[key] === "object" && obj[key] !== null) {
            if (hasAuthField(obj[key])) return true;
        }
    }
    return false;
}

/**
 * Try to extract "url" or "host" from a server config object.
 */
function getServerUrl(serverConfig) {
    if (!serverConfig || typeof serverConfig !== "object") return "";
    return serverConfig.url || serverConfig.host || serverConfig.baseUrl || serverConfig.base_url || "";
}

/**
 * Determine server transport type.
 */
function getTransportType(serverConfig) {
    if (!serverConfig || typeof serverConfig !== "object") return "unknown";
    if (serverConfig.transport) return String(serverConfig.transport).toLowerCase();
    if (serverConfig.command || serverConfig.args) return "stdio";
    if (serverConfig.url) return "http";
    return "unknown";
}

/**
 * Check if a server is network-facing (http, sse, streamable-http).
 * stdio servers communicate via stdin/stdout and don't expose network ports.
 */
function isNetworkFacing(serverConfig) {
    const transport = getTransportType(serverConfig);
    return transport === "http" || transport === "sse" || transport === "streamable-http";
}

/**
 * Check if the server URL points to a local-only address.
 */
function isLocalUrl(url) {
    if (!url) return true; // No URL = local (stdio)
    try {
        const parsed = new URL(url);
        const host = parsed.hostname.toLowerCase();
        return host === "localhost" || host === "127.0.0.1" || host === "::1";
    } catch {
        return false;
    }
}

/**
 * Extract server entries from a parsed config.
 * Handles common structures: { mcpServers: {...} } and { servers: {...} }
 */
function extractServers(parsed) {
    if (!parsed || typeof parsed !== "object") return {};

    // Try common root keys
    if (parsed.mcpServers && typeof parsed.mcpServers === "object") return parsed.mcpServers;
    if (parsed.servers && typeof parsed.servers === "object") return parsed.servers;

    // If the config itself looks like a server map (keys have command/url/transport)
    const firstVal = Object.values(parsed)[0];
    if (firstVal && typeof firstVal === "object" && (firstVal.command || firstVal.url || firstVal.transport)) {
        return parsed;
    }

    return {};
}

/* ════════════════════════════════════════════════════
   Individual Checks

   Each check is context-aware:
   - Transport type determines which checks apply
   - Auth presence modifies severity levels
   - Local-only servers get lighter treatment
   ════════════════════════════════════════════════════ */

/**
 * Binding Address Check — contextual severity:
 *   0.0.0.0 WITH auth detected  → low  (auth covers the exposure)
 *   0.0.0.0 WITHOUT auth        → high (genuinely dangerous)
 */
function checkBindingAddress(serverName, serverConfig, source) {
    const url = getServerUrl(serverConfig);
    if (typeof url !== "string") return null;

    if (url.includes("0.0.0.0")) {
        const serverHasAuth = hasAuthField(serverConfig);

        if (serverHasAuth) {
            return {
                severity: "low",
                message: "Server binds to all network interfaces. Authentication is configured — verify it covers all endpoints.",
                file: source,
                line: null,
                snippet: `"${serverName}": { url: "${url}" }`,
                remediation: "Ensure authentication is enforced on all tool execution endpoints, not just some routes.",
            };
        }

        return {
            severity: "high",
            message: "Server bound to 0.0.0.0 with no authentication — exposed on all network interfaces. Anyone who can reach this port can execute MCP operations.",
            file: source,
            line: null,
            snippet: `"${serverName}": { url: "${url}" }`,
            remediation: "Either bind to 127.0.0.1 for local-only access, or add authentication (API key, token, or OAuth) to protect exposed endpoints.",
        };
    }
    return null;
}

/**
 * Missing Auth Check — only relevant for network-facing servers.
 * stdio servers communicate via stdin/stdout and don't need network auth.
 * Local-only servers (localhost/127.0.0.1) get medium instead of high.
 */
function checkMissingAuth(serverName, serverConfig, source) {
    // stdio servers don't expose network ports — auth is not applicable
    if (!isNetworkFacing(serverConfig)) return null;

    // If auth fields exist, no issue
    if (hasAuthField(serverConfig)) return null;

    const url = getServerUrl(serverConfig);
    const local = isLocalUrl(url);

    if (local) {
        // Local-only server without auth — lower concern
        return {
            severity: "medium",
            message: "No authentication configured on local server — other processes on this machine can connect.",
            file: source,
            line: null,
            snippet: `"${serverName}": ${JSON.stringify(serverConfig, null, 2).slice(0, 200)}`,
            remediation: "Consider adding API key or token authentication, especially if other users share this machine.",
        };
    }

    // Network-facing, non-local, no auth — high severity
    return {
        severity: "high",
        message: "No authentication configured — any reachable process can connect and issue commands.",
        file: source,
        line: null,
        snippet: `"${serverName}": ${JSON.stringify(serverConfig, null, 2).slice(0, 200)}`,
        remediation: "Add API key or token authentication to this server.",
    };
}

function checkUnencryptedHttp(serverName, serverConfig, source) {
    const url = getServerUrl(serverConfig);
    if (typeof url !== "string") return null;

    if (url.startsWith("http://")) {
        // Check if it's localhost or 127.0.0.1 — those are fine
        try {
            const parsed = new URL(url);
            const host = parsed.hostname.toLowerCase();
            if (host === "localhost" || host === "127.0.0.1" || host === "::1") return null;
        } catch {
            // If URL parsing fails, still flag it
        }

        return {
            severity: "medium",
            message: "Server using unencrypted HTTP on a non-local address.",
            file: source,
            line: null,
            snippet: `"${serverName}": { url: "${url}" }`,
            remediation: "Switch to HTTPS for any non-localhost connection.",
        };
    }
    return null;
}

function checkShellInjection(serverName, serverConfig, source) {
    const transport = getTransportType(serverConfig);
    if (transport !== "stdio") return null;

    const args = serverConfig.args;
    if (!Array.isArray(args)) return null;

    const flagged = [];
    for (let i = 0; i < args.length; i++) {
        const arg = String(args[i]);
        if (SHELL_META_REGEX.test(arg)) {
            flagged.push(arg);
        }
    }

    if (flagged.length === 0) return null;

    return {
        severity: "critical",
        message: "Shell metacharacters found in server arguments — possible command injection risk.",
        file: source,
        line: null,
        snippet: `"${serverName}": { args: ${JSON.stringify(args)} }`,
        remediation: "Remove shell special characters from server args and use explicit argument arrays instead.",
    };
}

/* ════════════════════════════════════════════════════
   Main Scanner
   ════════════════════════════════════════════════════ */

/**
 * Scan one or more MCP config entries.
 *
 * @param {Array<{ source: string, content: string }>} configEntries
 * @returns {{
 *   servers: Array<{ name: string, source: string, status: string, findings: Array }>,
 *   findings: Array,
 *   summary: { totalServers: number, critical: number, high: number, medium: number, scoreDeduction: number },
 *   parseWarnings: Array<{ source: string, message: string }>,
 * }}
 */
export function scanConfigs(configEntries) {
    const allFindings = [];
    const parseWarnings = [];
    const servers = [];
    const serverNameMap = {}; // name → array of source labels (for duplicate detection)

    // ── Phase 1: Parse configs and extract servers ──
    for (const entry of configEntries) {
        const { source, content } = entry;

        let parsed;
        try {
            parsed = JSON.parse(content);
        } catch (err) {
            parseWarnings.push({
                source,
                message: `Invalid JSON: ${err.message}`,
            });
            continue;
        }

        const serverMap = extractServers(parsed);
        const serverNames = Object.keys(serverMap);

        if (serverNames.length === 0) {
            parseWarnings.push({
                source,
                message: "No MCP server definitions found in this config file.",
            });
            continue;
        }

        for (const name of serverNames) {
            const config = serverMap[name];

            // Track for duplicate detection
            if (!serverNameMap[name]) serverNameMap[name] = [];
            serverNameMap[name].push(source);

            // Run checks — each function is context-aware
            const serverFindings = [];

            const binding = checkBindingAddress(name, config, source);
            if (binding) serverFindings.push(binding);

            const auth = checkMissingAuth(name, config, source);
            if (auth) serverFindings.push(auth);

            const http = checkUnencryptedHttp(name, config, source);
            if (http) serverFindings.push(http);

            const shell = checkShellInjection(name, config, source);
            if (shell) serverFindings.push(shell);

            // Determine per-server status (low findings don't trigger WARNING)
            const hasCritical = serverFindings.some((f) => f.severity === "critical");
            const hasHighOrMedium = serverFindings.some((f) => f.severity === "high" || f.severity === "medium");

            servers.push({
                name,
                source,
                status: hasCritical ? "CRITICAL" : hasHighOrMedium ? "WARNING" : "CLEAN",
                findings: serverFindings,
            });

            allFindings.push(...serverFindings);
        }
    }

    // ── Phase 2: Duplicate server name detection ──
    for (const [name, sources] of Object.entries(serverNameMap)) {
        if (sources.length > 1) {
            for (const source of sources) {
                const finding = {
                    severity: "high",
                    message: "Duplicate server name found — one server may shadow the other.",
                    file: source,
                    line: null,
                    snippet: `Server "${name}" also defined in: ${sources.filter((s) => s !== source).join(", ")}`,
                    remediation: "Give each MCP server a unique name across all your config files.",
                };
                allFindings.push(finding);

                // Add to the matching server entry
                const server = servers.find((s) => s.name === name && s.source === source);
                if (server) {
                    server.findings.push(finding);
                    // Upgrade status if needed
                    if (server.status === "CLEAN") server.status = "WARNING";
                }
            }
        }
    }

    // ── Phase 3: Calculate summary (low findings don't affect score) ──
    const criticalCount = allFindings.filter((f) => f.severity === "critical").length;
    const highCount = allFindings.filter((f) => f.severity === "high").length;
    const mediumCount = allFindings.filter((f) => f.severity === "medium").length;
    const lowCount = allFindings.filter((f) => f.severity === "low").length;

    let scoreDeduction = 0;
    scoreDeduction += criticalCount * SEVERITY_DEDUCTIONS.critical;
    scoreDeduction += highCount * SEVERITY_DEDUCTIONS.high;
    scoreDeduction += mediumCount * SEVERITY_DEDUCTIONS.medium;
    // low findings don't contribute to score deduction
    scoreDeduction = Math.max(scoreDeduction, -100);

    return {
        servers,
        findings: allFindings,
        summary: {
            totalServers: servers.length,
            critical: criticalCount,
            high: highCount,
            medium: mediumCount,
            low: lowCount,
            scoreDeduction,
        },
        parseWarnings,
    };
}
