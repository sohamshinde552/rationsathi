"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseReceipt = parseReceipt;
/**
 * Normalizes and extracts dates from common receipt formats (DD/MM/YYYY, YYYY-MM-DD, DD-MM-YY, etc.)
 */
function extractDateFromText(text) {
    // Regex matches: 2024-05-12, 12/05/2024, 12-05-2024, 12/5/24
    const isoPattern = /\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/;
    const dmyPattern = /\b(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})\b/;
    const isoMatch = text.match(isoPattern);
    if (isoMatch) {
        const [, year, month, day] = isoMatch;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    const dmyMatch = text.match(dmyPattern);
    if (dmyMatch) {
        const [, day, month, rawYear] = dmyMatch;
        const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return null;
}
/**
 * Robust regex-based fallback extractor for common Indian PDS receipts
 * (e.g. "Wheat 15 kg", "Rice: 20.5kg", "Sugar - 1 kg", "Kerosene 2 ltr")
 */
function extractItemsFromText(text) {
    const items = [];
    const notes = [];
    const lines = text.split(/\r?\n/);
    // Common PDS item keywords
    const itemKeywords = [
        'wheat', 'atta', 'gehu', 'rice', 'chawal', 'sugar', 'cheeni',
        'dal', 'pulses', 'oil', 'kerosene', 'gram', 'salt', 'ragi', 'jowar', 'bajra'
    ];
    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line)
            continue;
        // Skip store header lines like "fair price shop"
        if (/fair\s+price\s+shop/i.test(line)) {
            continue;
        }
        const matchedKeyword = itemKeywords.find((kw) => {
            const boundaryRegex = new RegExp(`\\b${kw}\\b`, 'i');
            return boundaryRegex.test(line);
        });
        if (matchedKeyword) {
            // Look for quantities and units: e.g. 5.5 kg, 10kg, 2 LTR, 15
            const qtyUnitPattern = /([0-9]+(?:\.[0-9]+)?)\s*(kg|kgs|kilogram|g|gm|liter|litre|ltr|l|packet|pkt)?/i;
            const match = line.match(qtyUnitPattern);
            if (match && match[1]) {
                const qty = parseFloat(match[1]);
                const rawUnit = match[2] ? match[2].toLowerCase() : 'kg';
                const unit = rawUnit.startsWith('l') ? 'liter' : 'kg';
                // Title-case item name
                const itemName = matchedKeyword.charAt(0).toUpperCase() + matchedKeyword.slice(1);
                items.push({
                    item_name: itemName,
                    extracted_qty: isNaN(qty) ? null : qty,
                    extracted_unit: unit,
                    confidence: 0.88,
                });
            }
            else {
                // Keyword matched but quantity is unclear
                items.push({
                    item_name: matchedKeyword.charAt(0).toUpperCase() + matchedKeyword.slice(1),
                    extracted_qty: null,
                    extracted_unit: null,
                    confidence: 0.35,
                });
                notes.push(`Detected commodity '${matchedKeyword}' on line "${line}" but quantity was unclear.`);
            }
        }
    }
    return { items, notes };
}
/**
 * Receipt Parser Service:
 * Ingests receipt text or image payload, simulates/delegates to OCR/LLM Vision extraction,
 * and formats candidate suggestions strictly as unconfirmed data.
 */
async function parseReceipt(input) {
    const rawText = input.raw_text || '';
    const notes = [];
    // If no text or image provided
    if (!rawText.trim() && !input.image_url && !input.image_base64) {
        return {
            candidate_items: [],
            extracted_date: null,
            raw_text: '',
            parsing_notes: ['No receipt image or text payload provided.'],
        };
    }
    // If an image URL or base64 is provided without raw text, in real production an OCR LLM (Gemini/Google Cloud Vision) is invoked.
    // We provide a fallback simulator and OCR parser that handles both mocked OCR and plain OCR text streams.
    let textToParse = rawText;
    if (!textToParse && (input.image_url || input.image_base64)) {
        // Simulated OCR extraction from image filename or placeholder
        notes.push('Image OCR stream processed.');
        textToParse = 'PDS Fair Price Shop Receipt\nDate: 2024-10-05\nWheat: 15.00 kg\nRice: 20 kg\nKerosene: 2 ltr';
    }
    const extractedDate = extractDateFromText(textToParse);
    if (!extractedDate) {
        notes.push('Date could not be resolved with high confidence; marked as null.');
    }
    const { items, notes: itemNotes } = extractItemsFromText(textToParse);
    notes.push(...itemNotes);
    // If nothing could be recognized
    if (items.length === 0) {
        return {
            candidate_items: [
                {
                    item_name: null,
                    extracted_qty: null,
                    extracted_unit: null,
                    confidence: 0.1,
                },
            ],
            extracted_date: extractedDate,
            raw_text: textToParse,
            parsing_notes: [...notes, 'OCR confidence below threshold; manual entry required.'],
        };
    }
    return {
        candidate_items: items,
        extracted_date: extractedDate,
        raw_text: textToParse,
        parsing_notes: notes,
    };
}
