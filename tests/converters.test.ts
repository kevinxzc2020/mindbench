import test from "node:test";
import assert from "node:assert/strict";
import { CONVERTERS, ConversionError, csvToJson, imageDimensions, inspectRaster, jsonToCsv, outputName, pageSelection, uniqueOutputName, validateConversionFile } from "../src/lib/converters";
import { CATALOG, matchesEntry } from "../src/lib/collections";
import { activeCollection } from "../src/lib/collection-navigation";
import { analyticsPath, setAnalyticsSender, trackConversion } from "../src/lib/analytics";

const error = (code: string) => (e: unknown) => e instanceof ConversionError && e.code === code;

test("CSV preserves quoted separators, escaped quotes, multiline Unicode and string values", () => {
  assert.deepEqual(csvToJson('\uFEFFname,note,id\r\n张三,"hello, ""world""\n下一行",0012\r\n'), [{ name: "张三", note: 'hello, "world"\n下一行', id: "0012" }]);
  assert.deepEqual(csvToJson("a;b\r1;2", ";"), [{ a: "1", b: "2" }]);
  assert.deepEqual(csvToJson("a\tb\n1\t2", "\t"), [{ a: "1", b: "2" }]);
  assert.deepEqual(csvToJson('name\n""'), [{ name: "" }]);
});
test("CSV rejects ambiguous headers, irregular rows and invalid quoting", () => {
  for (const text of ["a,a\n1,2", "a,\n1,2", " ,b\n1,2"]) assert.throws(() => csvToJson(text), error("headers"));
  assert.throws(() => csvToJson("a,b\n1"), error("columns"));
  for (const text of ['a\n"unterminated', 'a\n"closed"junk', 'a\na"b']) assert.throws(() => csvToJson(text), error("csv"));
  assert.throws(() => csvToJson(""), error("empty"));
});
test("CSV keys named __proto__ remain plain data and do not mutate a prototype", () => {
  const row = csvToJson("__proto__,constructor\nx,y")[0];
  assert.equal(Object.hasOwn(row, "__proto__"), true);
  assert.equal(row.__proto__, "x");
  assert.equal(Object.getPrototypeOf(row), Object.prototype);
});
test("JSON to CSV unifies columns and escapes values without losing Unicode", () => {
  const result = jsonToCsv('[{"name":"张三","value":"a,b"},{"name":"Jane","note":"x\\ny","value":null}]');
  assert.equal(result.csv, 'name,value,note\r\n张三,"a,b",\r\nJane,,"x\ny"\r\n');
  assert.equal(result.protectedCells, 0);
  assert.deepEqual(csvToJson(jsonToCsv('[{"x":"quote\\\"","y":42}]').csv), [{ x: 'quote"', y: "42" }]);
});
test("CSV formula protection includes headers and leading whitespace, while numeric negatives stay numeric", () => {
  const source = JSON.stringify([{ "=header": "\t=1+2", safe: -12, text: "-12" }]);
  const result = jsonToCsv(source);
  assert.equal(result.protectedCells, 3);
  assert.match(result.csv, /'=header/);
  assert.match(result.csv, /'\t=1\+2,-12,'-12/);
  assert.equal(jsonToCsv(source, ",", false).protectedCells, 0);
});
test("JSON rejects invalid, nested and empty data rather than silently serializing it", () => {
  for (const source of ["{}", "[]", "[null]", "[3]", "bad", '[{"a":Infinity}]']) assert.throws(() => jsonToCsv(source), error("json"));
  for (const source of ['[{"a":{}}]', '[{"a":[]}]']) assert.throws(() => jsonToCsv(source), error("nested"));
  assert.throws(() => jsonToCsv('[{}]'), error("headers"));
});
test("large numeric identifiers and sparse tables fail instead of losing precision or allocating a huge table", () => {
  assert.throws(() => jsonToCsv('[{"id":12345678901234567890}]'), error("precision"));
  assert.throws(() => jsonToCsv(JSON.stringify(Array.from({ length: 2000 }, (_, i) => ({ [`column${i}`]: i })))), error("size"));
});
test("animated WebP and oversized PNG dimensions are rejected before image decoding", () => {
  const webp = new Uint8Array(30); webp.set(new TextEncoder().encode("RIFF")); webp.set(new TextEncoder().encode("WEBPVP8X"), 8); webp[20] = 2;
  assert.throws(() => inspectRaster(webp), error("animated"));
  const png = new Uint8Array(24); png[0] = 137; png.set(new TextEncoder().encode("PNG"), 1); new DataView(png.buffer).setUint32(16, 10000); new DataView(png.buffer).setUint32(20, 10000);
  assert.throws(() => inspectRaster(png), error("pixels"));
  assert.throws(() => inspectRaster(new TextEncoder().encode("not an image")), error("decode"));
});
test("page selection is bounded, preserves requested order, deduplicates and never silently drops pages", () => {
  assert.deepEqual(pageSelection("3, 1-2, 3", 8), [3, 1, 2]);
  assert.deepEqual(pageSelection("", 3), [1, 2, 3]);
  assert.throws(() => pageSelection("", 21), error("pages"));
  assert.throws(() => pageSelection("1-1000000000", 1_000_000_000), error("pages"));
  for (const range of ["0", "3-1", "1,", "foo", "99"]) assert.throws(() => pageSelection(range, 8), error("range"));
});
test("resizing preserves aspect ratio and input pixel bounds", () => {
  assert.deepEqual(imageDimensions(3000, 2000, 1024), { width: 1024, height: 683 });
  assert.deepEqual(imageDimensions(640, 480, 1024), { width: 640, height: 480 });
  assert.throws(() => imageDimensions(20000, 20000, 1024), error("pixels"));
});
test("file validation rejects empty, oversized and unsupported inputs before conversion", () => {
  validateConversionFile({ name: "PHOTO.JPG", size: 1024 }, "image");
  assert.throws(() => validateConversionFile({ name: "document.pdf", size: 10 }, "image"), error("type"));
  assert.throws(() => validateConversionFile({ name: "empty.png", size: 0 }, "image"), error("empty"));
  assert.throws(() => validateConversionFile({ name: "data.csv", size: 6 * 1024 ** 2 }, "csv-to-json"), error("size"));
});
test("download filenames are safe and colliding names never overwrite another ZIP entry", () => {
  assert.equal(outputName("../secret.png", "jpg"), ".._secret.jpg");
  const used = new Set<string>();
  assert.equal(uniqueOutputName("photo.png", used), "photo.png");
  assert.equal(uniqueOutputName("PHOTO.png", used), "PHOTO-2.png");
  assert.equal(uniqueOutputName("photo.png", used), "photo-3.png");
});
test("every converter is discoverable in utilities with translated text and a stable route", () => {
  assert.equal(activeCollection("/convert"), "utilities");
  for (const tool of CONVERTERS) {
    const entry = CATALOG.utilities.find(entry => entry.href === `/convert/${tool.id}`)!;
    assert.ok(entry && matchesEntry(entry, "conversion") && matchesEntry(entry, "转换"));
    for (const lang of ["en", "zh", "es"] as const) assert.ok(tool.title[lang] && tool.description[lang]);
    assert.equal(activeCollection(entry.href!), "utilities");
  }
});
test("conversion analytics use only approved identifiers and do not replay before consent", () => {
  const calls: unknown[] = [];
  setAnalyticsSender(null);
  assert.equal(trackConversion("conversion_start", "image"), false);
  setAnalyticsSender((name, data) => calls.push({ name, data }));
  assert.deepEqual(calls, []);
  assert.equal(trackConversion("conversion_complete", "image"), true);
  assert.deepEqual(calls, [{ name: "conversion_complete", data: { converter_id: "image" } }]);
  assert.equal(trackConversion("conversion_start", "private.pdf" as "image"), false);
  assert.equal(analyticsPath("/convert/pdf-to-images?name=private.pdf#secret"), "/convert/pdf-to-images");
  assert.equal(analyticsPath("/convert/private.pdf"), "/other");
  setAnalyticsSender(null);
});
