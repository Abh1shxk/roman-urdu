# Roman Urdu: learn Urdu in English letters

A small offline web app for learning Urdu written only in Latin letters (Roman Urdu), for example *love* = **mohabbat**.

## How to open it

Double-click **`index.html`**. It opens in your browser (Edge, Chrome or Firefox). There's nothing to install, no internet is needed, and nothing is sent anywhere.

**Online:** https://abh1shxk.github.io/roman-urdu/ opens the same app in any browser, phones included.

## What's inside

| Screen | What it does |
|---|---|
| **Home** | Word of the day, daily goal ring, streak, quick start, all 16 categories with progress |
| **Words** | Browse and search all 543 words and phrases. Each one shows its English meaning, a "sounds like" hint, other common spellings and usage notes. Mark words as learned. |
| **Flashcards** | Spaced repetition: words you miss come back sooner, words you know wait longer. Works both ways (English → Urdu, Urdu → English). Keys: `Space` flips the card, `1` = didn't know, `2` = knew it. |
| **Quiz** | English → Roman Urdu, Roman Urdu → English, or both; multiple choice, typed answers, or a mix. Typed answers accept common spelling variants (mohabbat / muhabbat, bahut / bohat / bohot, nahin / nahi, achha / acha, and so on), and there's an "I was right" button for anything else. |
| **Sounds** | How the spellings map to sounds (aa / ee / oo, the two kinds of kh and gh, breathy h, curled t/d/r, nasal n, q), how to read the hints, quick grammar basics and common spelling variants |
| **Progress** | Current and best streak, words learned, accuracy, the last 45 days of activity, progress per category, daily goal setting, export / import / reset |

**Categories:** Greetings & Courtesy · Everyday Phrases · Pronouns & Questions · Numbers · Family & People · Colours · Food & Drink · Emotions & Feelings · Common Verbs · Days, Time & Seasons · The Body · Home & Things · Nature & Weather · Describing Words · Places & Directions · Animals

A word counts as **learned** once you get it right 3 times in a row, or when you mark it yourself.

## Progress is saved in your browser

Progress is saved in the browser's local storage on each device. Clearing browser data erases it, so use **Progress → Export progress** to keep a backup or move it to another device. (On claude.ai, the app also syncs progress to the viewer's account.)

To update the online version, commit your changes and push to GitHub. GitHub Pages redeploys within a minute or two.

## Files

```
index.html          the app (open this)
css/style.css       styling, light and dark themes
js/data-1..4.js     the vocabulary (easy to edit or extend)
js/core.js          progress storage, spaced repetition, spelling-tolerant answer checking
js/view-*.js        one file per screen
js/main.js          navigation and theme
```

To add words, append entries to a category in `js/data-*.js` in the form
`["roman", "english meaning", "sounds-like hint", "other|spellings", "optional note"]`.
