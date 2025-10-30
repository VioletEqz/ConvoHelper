# Word Cloud Features

## Overview
The word cloud visualization displays the most frequently used words and phrases in your conversations, with support for both English and Vietnamese text.

## Key Features

### 1. **Bilingual Support**
- Supports both English and Vietnamese text
- Comprehensive stopword filtering for both languages
- Stopwords are loaded from `data/stopwords.txt`

### 2. **Vietnamese Text Normalization**
- Automatically removes Vietnamese diacritics
- Example: "Tiếng Việt" → "tieng viet"
- Uses Unicode NFD normalization to strip combining marks
- This ensures better word frequency counting for Vietnamese text

### 3. **Text-Only Filtering**
- Only processes messages where `type === 'text'`
- Ignores media, stickers, links, and other non-text content
- Ensures accurate text analysis

### 4. **Phrase Detection (Bigrams)**
- Detects 2-word phrases in addition to single words
- Examples: "con vo", "love you", "thank you"
- Phrases must appear at least 3 times to be included
- Phrases are displayed in **bold** in the visualization

### 5. **Interactive Visualization**
- Hover over words to see frequency counts
- Words sized by frequency (larger = more frequent)
- Color intensity indicates frequency
- Force-directed layout prevents overlapping
- Distinguishes between single words and phrases in tooltips

## Configuration Options

You can customize the word cloud by passing options to the render function:

```javascript
VizWordCloud.render(container, personName, data, {
    minWordLength: 2,              // Minimum word length (default: 2)
    maxWords: 100,                 // Maximum words to display (default: 100)
    includeBigrams: true,          // Include 2-word phrases (default: true)
    minPhraseOccurrence: 3        // Minimum times phrase must appear (default: 3)
});
```

## Stopwords File

The stopwords are stored in `data/stopwords.txt` and include:

- **English**: Common articles, prepositions, pronouns, verbs (the, be, to, of, and, etc.)
- **Vietnamese** (normalized): Common words (va, cua, co, la, thi, etc.)

The file format is simple:
- One word per line
- Lines starting with `#` are comments
- Words should be lowercase
- Vietnamese words should be normalized (no diacritics)

## Technical Details

### Text Processing Pipeline
1. Filter messages by `type === 'text'`
2. Normalize Vietnamese diacritics
3. Convert to lowercase
4. Remove punctuation
5. Split into words
6. Filter out stopwords and short words
7. Extract bigrams from word sequences
8. Count frequencies
9. Sort by frequency and take top N items

### Normalization Function
```javascript
normalizeVietnamese(text) {
    return text.toLowerCase()
               .normalize('NFD')
               .replace(/[\u0300-\u036f]/g, '');
}
```

This converts: "Xem thử" → "xem thu"

## Usage

The word cloud is automatically rendered on individual person pages. Simply:

1. Upload your conversation data
2. Navigate to any person's detail page
3. Scroll to the "Word Cloud" section
4. The visualization will load automatically

## Performance

- Stopwords are loaded once and cached
- Efficient Map-based counting
- Handles large conversation datasets
- Force simulation runs smoothly with D3.js

## Future Enhancements

Potential improvements:
- Support for 3-word phrases (trigrams)
- Language-specific stemming
- Emoji analysis
- Time-based word cloud evolution
- Comparison between multiple people
