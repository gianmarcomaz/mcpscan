/**
 * SVG Badge Generator
 * Produces shields.io-style badge SVGs.
 */

/**
 * Generate an SVG badge string.
 * @param {{ score: number, tier: string, repoName: string }} params
 * @returns {string} SVG markup
 */
function generateBadge({ score, tier, repoName }) {
    const tierColor =
        tier === "certified"
            ? "#22c55e"
            : tier === "reviewed"
                ? "#eab308"
                : "#ef4444";

    const rightText =
        tier === "certified" ? `Certified ✓` : `Score: ${score}/100`;

    const leftText = "MCP Certify";

    // Calculate text widths (approximate: 6.5px per char for Verdana 11px)
    const leftWidth = Math.max(leftText.length * 6.5 + 20, 90);
    const rightWidth = Math.max(rightText.length * 6.5 + 20, 90);
    const totalWidth = leftWidth + rightWidth;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${leftText}: ${rightText}">
  <title>${leftText}: ${rightText}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${leftWidth}" height="20" fill="#555"/>
    <rect x="${leftWidth}" width="${rightWidth}" height="20" fill="${tierColor}"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11">
    <text aria-hidden="true" x="${leftWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${leftText}</text>
    <text x="${leftWidth / 2}" y="14">${leftText}</text>
    <text aria-hidden="true" x="${leftWidth + rightWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${rightText}</text>
    <text x="${leftWidth + rightWidth / 2}" y="14">${rightText}</text>
  </g>
</svg>`;
}

module.exports = { generateBadge };
