import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import { ageProfiles, getAgeRange, getStationRecommendations } from "../js/products.js";

const profileKeys = ["18-29", "30-44", "45-59", "60+", "all"];

test("age estimates map to the requested broad bands", () => {
  const boundaries = [
    [17, "all"],
    [18, "18-29"],
    [29.9, "18-29"],
    [30, "30-44"],
    [44.9, "30-44"],
    [45, "45-59"],
    [59.9, "45-59"],
    [60, "60+"]
  ];
  for (const [age, expected] of boundaries) {
    assert.equal(getAgeRange(age), expected, `age ${age}`);
  }
});

test("each of five stations defines content and media slots for all five profiles", async () => {
  const data = JSON.parse(await readFile(new URL("../data/contenido.json", import.meta.url), "utf8"));
  assert.equal(data.stations.length, 5);
  const videoPaths = new Set();
  for (const station of data.stations) {
    for (const key of profileKeys) {
      assert.equal(typeof station.video[key], "string", `${station.id} video ${key}`);
      assert.equal(typeof station.posterByAge[key], "string", `${station.id} poster ${key}`);
      assert.equal(typeof station.ageContent[key].headline, "string", `${station.id} headline ${key}`);
      assert.equal(station.ageContent[key].tags.length, 3, `${station.id} tags ${key}`);
      assert.deepEqual(getStationRecommendations(station, key), {
        headline: station.ageContent[key].headline,
        copy: station.ageContent[key].copy,
        products: station.ageContent[key].tags
      }, `${station.id} recommendations ${key}`);
      const videoPath = station.video[key];
      const posterPath = station.posterByAge[key];
      assert.match(videoPath, /^assets\/videos\/age-recommendations\/[a-z0-9-]+\.mp4$/);
      assert.match(posterPath, /^assets\/videos\/age-recommendations\/[a-z0-9-]+\.jpg$/);
      assert.ok(!videoPaths.has(videoPath), `video reused for ${station.id} ${key}`);
      videoPaths.add(videoPath);
      const videoFile = new URL(`../${videoPath}`, import.meta.url);
      const posterFile = new URL(`../${posterPath}`, import.meta.url);
      await access(videoFile);
      await access(posterFile);
      assert.ok((await stat(videoFile)).size > 10_000, `${station.id} video ${key} is empty`);
      assert.ok((await stat(posterFile)).size > 5_000, `${station.id} poster ${key} is empty`);
    }
  }
  assert.equal(videoPaths.size, 25);
});

test("all-ages suggestions are available and no exact age is exposed", () => {
  assert.equal(Object.keys(ageProfiles).length, 5);
  assert.equal(ageProfiles.all.label, "Todas las edades");
  assert.deepEqual(ageProfiles.all.products.length, 3);
  assert.equal(getAgeRange(-1), null);
});
