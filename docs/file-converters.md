# Local file converters

The `/convert` directory and `/convert/[tool]` pages are part of Utilities. They are linked from the homepage and navigation and use the existing English, Chinese and Spanish language setting. No CloudConvert account or API is used.

| Tool | Input | Output |
| --- | --- | --- |
| Image converter | Static PNG, JPEG, WebP, BMP | PNG, JPEG, WebP; optional resize and quality |
| Images to PDF | The same image formats, ordered by the user | A combined image-based PDF, one image per page |
| PDF to images | Unencrypted PDF; selected pages | PNG or JPEG pages, individual downloads or a ZIP |
| Audio to WAV | MP3, WAV, M4A, OGG, FLAC, WebM or AAC when the browser can decode it | 16-bit PCM WAV at 44.1 or 48 kHz; retain mono/stereo or mix to mono |
| CSV to JSON | UTF-8 CSV, TSV or delimited TXT with unique headers | JSON object array; values remain strings |
| JSON to CSV | UTF-8 JSON array of flat objects | CSV/TSV with UTF-8 BOM; optional formula-text protection |

JPEG output and image-based PDFs use a white background. Image conversion re-encodes pixels and does not preserve original metadata or color profiles. Animated images are rejected. PDF conversion does not run OCR, create editable Office documents or accept password-protected PDFs. JSON null/missing fields become empty CSV cells; nested values and integers beyond JavaScript's safe integer range are rejected. Formula protection prefixes formula-like text with an apostrophe and is explicitly disclosed in the UI.

## Product limits

Up to 10 files per batch, 25 MiB per file (5 MiB for tables), 60 MiB total input and 100 MiB total output. Image inputs/rendered pages are limited to 16 million pixels, selected PDF pages to 20 per source, and audio to 10 minutes with one or two channels. Tables allow at most 50,000 rows, 1,000 columns and one million output cells. These are application safeguards, not guarantees of a device's memory capacity.

Files are processed in browser memory. Input files, names and content are not uploaded or stored in localStorage/accounts. Generated object URLs are released on clear or page unmount. Conversion analytics use the existing opt-in sender and emit only an approved converter ID, never a filename, content or object URL. Local preview disables analytics under the existing policy.

## Dependencies and local assets

- `pdf-lib`: image PDF creation.
- `pdfjs-dist`: local PDF rendering. The locked version requires Node >=22.13 or Node >=24, as declared by that package; the current development environment uses Node 24.
- `fflate`: output ZIP creation; no archive extraction is provided.

`scripts/sync-converter-assets.mjs` runs before development and production builds. It copies the locked PDF.js worker, CMaps, standard fonts, WASM decoders, ICC profiles and license into the ignored `public/vendor/pdfjs` directory. These files are served from this site, not a third-party CDN. Run the script when adding the feature to a server that is already running.

Office conversion, video transcoding, HEIC, archive extraction and OCR require additional implementations and are not advertised as available. A future remote conversion service needs its own backend, credential management and clearly disclosed file-upload flow.

## Verification

`npx tsx --test tests/converters.test.ts tests/collections.test.ts tests/monetization.test.ts tests/audio-diagnostics.test.ts`

The converter tests cover quoted/multiline CSV, Unicode, formula protection, malformed data, dangerous object keys, large identifiers, sparse table bounds, page ranges, animation and image size limits, output filename collisions, discovery and analytics privacy. Browser QA also converts fixture images, creates and renders PDF files, resamples stereo WAV to mono, converts tables, downloads ZIPs, checks invalid files and uses the mobile layout. Browser codec support still varies by device.

## Primary references

Checked 2026-11-12; reference pages do not consistently provide publication dates:

- [CloudConvert format categories and API overview](https://cloudconvert.com/)
- [MDN: canvas toBlob](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob)
- [MDN: decodeAudioData](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/decodeAudioData)
- [PDF-LIB documentation](https://pdf-lib.js.org/)
- [Mozilla PDF.js getting started](https://mozilla.github.io/pdf.js/getting_started/)
