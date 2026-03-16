/**
 * Markdown link detection utilities.
 * Detects various link formats in markdown content.
 */

import {SourceLinkHint} from "../../types";
import {generateHintLabels} from "../hints/HintGenerator";

/**
 * Link types that can be detected
 */
export type LinkType = 'internal' | 'external';

/**
 * A detected link without a hint label
 */
export interface DetectedLink {
    index: number;
    type: LinkType;
    linkText: string;
}

/**
 * Regex patterns for different link formats
 */
export const LINK_PATTERNS = {
    // Wiki links: [[Link]] or [[Link|Title]]
    internal: /\[\[(.+?)(\|.+?)?]]/g,
    // Markdown internal: [Title](../example.md)
    mdInternal: /\[[^[\]]+?\]\(((\.\.|\w|\d).+?)\)/g,
    // External with protocol: [Title](https://...) or [Jira-123](jira://...)
    external: /\[[^[\]]+?\]\((.+?:\/\/.+?)\)/g,
    // Bare URLs: http://... or https://...
    url: /( |\n|^)(https?:\/\/[^ \n]+)/g,
} as const;

/**
 * Detect all markdown links in content
 *
 * @param content - Text content to search
 * @param offset - Index offset to add to all matches
 * @returns Array of detected links (without labels)
 */
export function detectLinks(content: string, offset: number): DetectedLink[] {
    const indexes = new Set<number>();
    const links: DetectedLink[] = [];
    let regExResult: RegExpExecArray | null;

    const addLink = (link: DetectedLink): void => {
        if (indexes.has(link.index)) return;
        indexes.add(link.index);
        links.push(link);
    };

    // Wiki links [[Link]]
    while ((regExResult = LINK_PATTERNS.internal.exec(content))) {
        const linkText = regExResult[1]?.trim();
        addLink({ index: regExResult.index + offset, type: 'internal', linkText });
    }

    // External links [Title](http://...) - check before MD internal to prefer external type
    while ((regExResult = LINK_PATTERNS.external.exec(content))) {
        const linkText = regExResult[1];
        addLink({ index: regExResult.index + offset, type: 'external', linkText });
    }

    // Markdown internal [Title](path)
    while ((regExResult = LINK_PATTERNS.mdInternal.exec(content))) {
        const linkText = regExResult[1];
        addLink({ index: regExResult.index + offset, type: 'internal', linkText });
    }

    // Bare URLs
    while ((regExResult = LINK_PATTERNS.url.exec(content))) {
        const linkText = regExResult[2];
        addLink({ index: regExResult.index + offset + 1, type: 'external', linkText });
    }

    // Reset regex lastIndex for reuse
    Object.values(LINK_PATTERNS).forEach(regex => regex.lastIndex = 0);

    return links.sort((a, b) => a.index - b.index);
}

/**
 * Detect markdown links and assign hint labels
 *
 * @param content - Text content to search
 * @param offset - Index offset to add to all matches
 * @param alphabet - Letters to use for hint labels
 * @returns Array of links with assigned hint labels
 */
export function detectMarkdownLinks(content: string, offset: number, alphabet: string): SourceLinkHint[] {
    const links = detectLinks(content, offset);
    const labels = generateHintLabels(alphabet, links.length);

    return links
        .map((link, i) => ({
            letter: labels[i],
            ...link,
        }))
        .filter(link => link.letter);
}

// Backward compatibility alias
export const getMDHintLinks = detectMarkdownLinks;
