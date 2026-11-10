import test from "node:test";
import assert from "node:assert/strict";
import { DRIVER_DEVICES, driverPath, filterDrivers, getDriverDevice, isOfficialDriverUrl, matchesDriver } from "../src/lib/driver-library";

const viper = getDriverDevice("razer", "viper-v2-pro")!;
test("model lookup is exact and does not substitute a similar model", () => {
  assert.equal(viper.modelCode, "RZ01-04390");
  assert.equal(getDriverDevice("razer", "viper-v3-pro"), undefined);
  assert.equal(getDriverDevice("unknown", "viper-v2-pro"), undefined);
  assert.equal(driverPath(viper), "/drivers/razer/viper-v2-pro");
});
test("model search accepts Chinese brand, compact names, casing and model-code punctuation", () => {
  for (const query of ["viper V2 pro", "ViperV2Pro", "雷蛇 v2", "RZ01-04390", "rz0104390", "ＲＺ０１－０４３９０", "synapse", " "]) assert.ok(matchesDriver(viper, query), query);
  assert.equal(matchesDriver(viper, "Viper V3 Pro"), false);
  assert.equal(matchesDriver(viper, "RZ01-0512"), false);
});
test("brand, category and model filters are combined rather than ignored", () => {
  assert.equal(filterDrivers("viper", "razer", "mouse").length, 1);
  assert.equal(filterDrivers("viper", "other", "mouse").length, 0);
  assert.equal(filterDrivers("viper", "razer", "keyboard").length, 0);
  assert.equal(filterDrivers("no matching model").length, 0);
});
test("official links cannot use lookalike hosts, credentials or non-HTTPS schemes", () => {
  assert.ok(isOfficialDriverUrl(viper, "https://mysupport.razer.com/app/answers/detail/a_id/6385"));
  for (const url of ["https://razer-synapse.com/", "https://www.razer.com.example.com/", "https://www.razer.com@evil.example/", "https://someone@www.razer.com/", "http://www.razer.com/", "javascript:alert(1)", "https://www.razer.com:8080/", "/download"]) assert.equal(isOfficialDriverUrl(viper, url), false, url);
});
test("published records have unique model routes, official destinations and all interface languages", () => {
  assert.equal(new Set(DRIVER_DEVICES.map(driverPath)).size, DRIVER_DEVICES.length);
  for (const device of DRIVER_DEVICES) {
    assert.equal(device.resources.filter(r => r.kind === "downloads").length, 1);
    assert.match(device.reviewedAt, /^\d{4}-\d{2}-\d{2}$/);
    for (const resource of device.resources) {
      assert.ok(isOfficialDriverUrl(device, resource.url));
      assert.ok(resource.sourceTitle);
      for (const lang of ["en", "zh", "es"] as const) { assert.ok(resource.title[lang]); assert.ok(resource.description[lang]); }
      for (const related of resource.related ?? []) assert.ok(isOfficialDriverUrl(device, related.url));
    }
  }
});
