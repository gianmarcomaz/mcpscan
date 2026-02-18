/**
 * Cloud Functions Entry Point
 * Exports the scanRepo callable and badge HTTP endpoint.
 */

const admin = require("firebase-admin");
const { onCall } = require("firebase-functions/v2/https");
const { onRequest } = require("firebase-functions/v2/https");

// Initialize Firebase Admin
admin.initializeApp();

// GITHUB_TOKEN can be set via:
// 1. Firebase Functions environment: firebase functions:secrets:set GITHUB_TOKEN
// 2. Local .env file inside functions/ directory
// 3. System environment variable
// The token is read lazily in scanRepo.js via process.env.GITHUB_TOKEN

// ─── scanRepo: Callable function ───
const { handleScanRepo } = require("./scanRepo");

exports.scanRepo = onCall(
    {
        timeoutSeconds: 120,
        memory: "512MiB",
        maxInstances: 10,
    },
    async (request) => {
        return handleScanRepo(request.data, {
            auth: request.auth,
        });
    }
);

// ─── badge: HTTP endpoint → GET /api/badge/{scanId} ───
const { generateBadge } = require("./badge");

exports.badge = onRequest(
    {
        timeoutSeconds: 10,
        memory: "128MiB",
    },
    async (req, res) => {
        // CORS
        res.set("Access-Control-Allow-Origin", "*");

        if (req.method === "OPTIONS") {
            res.set("Access-Control-Allow-Methods", "GET");
            res.set("Access-Control-Allow-Headers", "Content-Type");
            return res.status(204).send("");
        }

        if (req.method !== "GET") {
            return res.status(405).send("Method not allowed");
        }

        // Extract scanId from path: /badge/{scanId} or /{scanId}
        const pathParts = req.path.split("/").filter(Boolean);
        const scanId = pathParts[pathParts.length - 1];

        if (!scanId) {
            return res.status(400).send("scanId is required");
        }

        try {
            const db = admin.firestore();
            const snap = await db.collection("scans").doc(scanId).get();

            if (!snap.exists) {
                return res.status(404).send("Scan not found");
            }

            const data = snap.data();
            const svg = generateBadge({
                score: data.overallScore || 0,
                tier: data.tier || "failed",
                repoName: `${data.repoOwner}/${data.repoName}`,
            });

            res.set("Content-Type", "image/svg+xml");
            res.set("Cache-Control", "public, max-age=3600");
            return res.status(200).send(svg);
        } catch (err) {
            console.error("Badge error:", err);
            return res.status(500).send("Error generating badge");
        }
    }
);
