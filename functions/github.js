const https = require("https");

const ALLOWED_EXTENSIONS = new Set([
    ".js", ".ts", ".jsx", ".tsx", ".py", ".go", ".rs",
    ".json", ".yaml", ".yml", ".toml", ".env", ".md",
]);

const SKIP_DIRS = new Set([
    "node_modules", ".git", "dist", "build", "vendor",
    "__pycache__", ".next", ".nuxt", "coverage", ".venv",
]);

const MAX_FILE_SIZE = 100 * 1024; // 100KB

/**
 * Fetch the file tree and contents from a GitHub repository.
 * @param {string} owner - Repo owner
 * @param {string} repo - Repo name
 * @param {string} token - GitHub personal access token
 * @returns {Promise<Array<{path: string, content: string}>>}
 */
async function fetchRepoFiles(owner, repo, token) {
    // 1. Get the default branch
    const repoData = await githubGet(`/repos/${owner}/${repo}`, token);
    const branch = repoData.default_branch || "main";

    // 2. Get the recursive file tree
    const treeData = await githubGet(
        `/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
        token
    );

    if (!treeData.tree || !Array.isArray(treeData.tree)) {
        console.error("Tree response:", JSON.stringify(treeData).slice(0, 500));
        throw new Error("Could not fetch repository file tree. Check that the repository exists and is accessible.");
    }

    // 3. Filter files
    const filePaths = treeData.tree
        .filter((item) => {
            if (item.type !== "blob") return false;
            if (item.size && item.size > MAX_FILE_SIZE) return false;

            // Check extension
            const ext = getExtension(item.path);
            if (!ALLOWED_EXTENSIONS.has(ext)) return false;

            // Check for skipped directories
            const parts = item.path.split("/");
            for (const part of parts) {
                if (SKIP_DIRS.has(part)) return false;
            }

            return true;
        })
        .map((item) => item.path);

    console.log(`Found ${filePaths.length} eligible files out of ${treeData.tree.length} total`);

    // 4. Fetch file contents (max 100 files to stay within timeout)
    const limitedPaths = filePaths.slice(0, 100);
    const files = [];

    // Fetch in batches of 5 to respect rate limits
    for (let i = 0; i < limitedPaths.length; i += 5) {
        const batch = limitedPaths.slice(i, i + 5);
        const results = await Promise.all(
            batch.map(async (path) => {
                try {
                    const data = await githubGet(
                        `/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`,
                        token
                    );
                    if (data.encoding === "base64" && data.content) {
                        const content = Buffer.from(data.content, "base64").toString("utf-8");
                        return { path, content };
                    }
                    return null;
                } catch (err) {
                    console.warn(`Failed to fetch ${path}:`, err.message);
                    return null;
                }
            })
        );
        files.push(...results.filter(Boolean));
    }

    return files;
}

/**
 * Make a GET request to the GitHub API.
 */
function githubGet(path, token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: "api.github.com",
            path,
            method: "GET",
            headers: {
                "User-Agent": "MCP-Certify/1.0",
                Accept: "application/vnd.github.v3+json",
                ...(token && token !== "ghp_your_github_token_here"
                    ? { Authorization: `Bearer ${token}` }
                    : {}),
            },
        };

        const req = https.request(options, (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
                // Check HTTP status
                if (res.statusCode >= 400) {
                    const msg = `GitHub API error ${res.statusCode}: ${data.slice(0, 300)}`;
                    console.error(msg);
                    reject(new Error(msg));
                    return;
                }
                try {
                    resolve(JSON.parse(data));
                } catch {
                    reject(new Error(`Invalid JSON from GitHub: ${data.slice(0, 200)}`));
                }
            });
        });

        req.on("error", (err) => {
            reject(new Error(`GitHub request failed: ${err.message}`));
        });
        req.end();
    });
}

function getExtension(filePath) {
    const dot = filePath.lastIndexOf(".");
    return dot >= 0 ? filePath.slice(dot) : "";
}

module.exports = { fetchRepoFiles };
