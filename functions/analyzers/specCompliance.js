/**
 * Spec Compliance Analyzer
 * Validates MCP server protocol conformance.
 * Additive scoring: start at 0, add points for each passing sub-check.
 */

/**
 * @param {Array<{path: string, content: string}>} files
 * @returns {{ score: number, status: string, findings: Array }}
 */
function analyzeSpecCompliance(files) {
    const findings = [];
    let score = 0;

    const allContent = files.map((f) => f.content).join("\n");
    const allPaths = files.map((f) => f.path);

    // ─── CHECK 1: Server manifest/metadata (20 points) ───
    const hasServerName =
        /server[_-]?name|name\s*[:=]\s*['"]/.test(allContent) ||
        /createServer|McpServer|Server\s*\(/.test(allContent);
    const hasVersion =
        /version\s*[:=]\s*['"][\d.]+['"]/.test(allContent) ||
        /"version"\s*:\s*"[\d.]+"/.test(allContent);
    const hasCapabilities =
        /capabilities\s*[:=]/.test(allContent) || /setCapabilities/.test(allContent);

    if (hasServerName && hasVersion) {
        score += 15;
    } else {
        findings.push({
            severity: "medium",
            file: "project",
            line: null,
            snippet: "",
            message: `Server ${!hasServerName ? "name" : "version"} not found in source code.`,
            remediation: "Declare server name and version in your MCP server configuration.",
        });
    }
    if (hasCapabilities) {
        score += 5;
    } else {
        findings.push({
            severity: "low",
            file: "project",
            line: null,
            snippet: "",
            message: "No explicit capabilities declaration found.",
            remediation: "Declare server capabilities to inform clients what features are supported.",
        });
    }

    // ─── CHECK 2: Tool definitions structure (30 points) ───
    const hasToolDef =
        /server\.tool\s*\(|\.addTool\s*\(|@server\.tool|@mcp\.tool|tools\s*[:=]\s*\[/.test(allContent);
    const hasInputSchema =
        /inputSchema|input_schema|parameters\s*[:=]\s*\{/.test(allContent);
    const hasSchemaType =
        /"type"\s*:\s*"object"/.test(allContent) || /type\s*[:=]\s*['"]object['"]/.test(allContent);
    const hasProperties =
        /"properties"\s*:/.test(allContent) || /properties\s*[:=]/.test(allContent);

    if (hasToolDef) {
        score += 10;
        if (hasInputSchema) score += 10;
        else {
            findings.push({
                severity: "medium",
                file: "project",
                line: null,
                snippet: "",
                message: "Tool definitions found but no input schemas detected.",
                remediation: "Define inputSchema with JSON Schema for each tool to enable input validation.",
            });
        }
        if (hasSchemaType && hasProperties) score += 10;
    } else {
        findings.push({
            severity: "medium",
            file: "project",
            line: null,
            snippet: "",
            message: "No MCP tool definitions found.",
            remediation: "Define tools using the MCP SDK's server.tool() or equivalent method.",
        });
    }

    // ─── CHECK 3: Error handling (20 points) ───
    const hasJsonRpcError =
        /error\s*[:=]\s*\{.*code/s.test(allContent) || /JsonRpcError|McpError/.test(allContent);
    const hasTryCatch = /try\s*\{[\s\S]*catch/m.test(allContent);
    const hasErrorHandler =
        /\.on\s*\(\s*['"]error['"]|onerror|error_handler|catch_exceptions/.test(allContent);

    if (hasTryCatch || hasErrorHandler) {
        score += 10;
    } else {
        findings.push({
            severity: "medium",
            file: "project",
            line: null,
            snippet: "",
            message: "No error handling patterns detected in tool handlers.",
            remediation: "Wrap tool handlers in try/catch blocks and return proper JSON-RPC error responses.",
        });
    }
    if (hasJsonRpcError) {
        score += 10;
    } else {
        findings.push({
            severity: "low",
            file: "project",
            line: null,
            snippet: "",
            message: "No JSON-RPC error response patterns found.",
            remediation: "Return MCP-compliant error objects with error codes and messages.",
        });
    }

    // ─── CHECK 4: Transport implementation (15 points) ───
    const hasStdio = /stdio|StdioServerTransport|stdin|stdout/.test(allContent);
    const hasHttp = /SSEServerTransport|HttpServerTransport|express|fastify|http\.createServer/.test(allContent);

    if (hasStdio) {
        score += 15; // stdio is inherently more secure
    } else if (hasHttp) {
        // Check for auth middleware
        const hasAuth =
            /auth|authenticate|middleware|bearer|authorization/i.test(allContent);
        if (hasAuth) {
            score += 15;
        } else {
            score += 8;
            findings.push({
                severity: "medium",
                file: "project",
                line: null,
                snippet: "",
                message: "HTTP transport without authentication middleware detected.",
                remediation: "Add authentication middleware to protect your HTTP-based MCP server.",
            });
        }
    } else {
        score += 10; // Can't determine transport
    }

    // ─── CHECK 5: Documentation (15 points) ───
    const hasReadme = allPaths.some((p) => /readme\.md$/i.test(p));
    const hasToolDescriptions = /description\s*[:=]\s*['"][^'"]{5,}['"]/.test(allContent);

    if (hasReadme) {
        score += 10;
    } else {
        findings.push({
            severity: "low",
            file: "project",
            line: null,
            snippet: "",
            message: "No README.md file found.",
            remediation: "Create a README with setup instructions, tool documentation, and usage examples.",
        });
    }
    if (hasToolDescriptions) {
        score += 5;
    }

    // Clamp score
    score = Math.max(0, Math.min(100, score));
    const status = score >= 80 ? "pass" : score >= 50 ? "warn" : "fail";

    return {
        score,
        status,
        findings: findings.slice(0, 50),
    };
}

module.exports = { analyzeSpecCompliance };
