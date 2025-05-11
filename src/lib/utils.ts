import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import React from "react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function createCfrLink(reference: string): string | null {
  // Matches patterns like § 217.10, § 217.10(a), §217.10, 12 CFR 217.10
  // This regex attempts to capture common CFR citation patterns.
  const cfrRegex = /(?:(\d{1,2})\s*CFR\s*)?(?:§\s*|\bPart\s*)?([\d\w]+)(?:\.([\d\w\.\(\)-]+))?/;
  const match = reference.match(cfrRegex);

  if (match) {
    const title = match[1] || "12"; // Default to Title 12 if not specified
    const mainPart = match[2]; // This could be a Part number or the first part of a section number
    const sectionDetails = match[3]; // The rest of the section number, like '10' or '10(a)(1)'

    let partNumber: string;
    let sectionPath: string;

    if (sectionDetails) {
      // This is likely a full section, e.g., § 217.10 or 12 CFR 217.10
      partNumber = mainPart;
      sectionPath = `${mainPart}.${sectionDetails}`;
    } else {
      // This might be just a Part reference, e.g., Part 217
      // Or a section where the part and section are the same, e.g. § 3.2 (Part 3, Section 3.2)
      if (reference.toLowerCase().includes("part ")) {
         return `https://www.ecfr.gov/current/title-${title}/part-${mainPart}`;
      }
      // Otherwise, assume it's a section like § 3.2 where mainPart is part and section.
      partNumber = mainPart;
      // Attempt to construct a plausible section path if only one number is given (e.g. §3 -> part 3, section 3)
      sectionPath = mainPart.includes('.') ? mainPart : `${mainPart}.${mainPart}`;
    }
    // Basic sanitization
    sectionPath = sectionPath.replace(/\.$/, ""); // Remove trailing dot

    // Ensure sectionPath correctly uses partNumber
    const finalSectionPath = sectionPath.startsWith(partNumber + '.') ? sectionPath : `${partNumber}.${sectionPath.split('.').pop()}`;


    return `https://www.ecfr.gov/current/title-${title}/part-${partNumber}/section-${finalSectionPath}`;
  }
  return null;
}

export function linkifyCfrText(text: string): React.ReactNode[] {
  if (!text || typeof text !== 'string') return [text]; // Handle non-string or empty inputs
  // Split by known reference patterns.
  const referencePattern = /(\b(?:(?:\d{1,2})\s*CFR\s*)?(?:§\s*|\bPart\s*)?[\d\w]+(?:\.[\d\w\.\(\)-]+)?\b)/g;
  const parts = text.split(referencePattern);

  return parts.map((part, index) => {
    if (part.match(referencePattern)) { // Check if the part itself is a reference
      const link = createCfrLink(part.trim());
      if (link) {
        return React.createElement('a', {
          href: link,
          key: index,
          target: "_blank",
          rel: "noopener noreferrer",
          className: "text-accent underline hover:text-accent/80"
        }, part);
      }
    }
    return part;
  });
}
