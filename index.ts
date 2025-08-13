import {
  loadNdjson,
  filterCollection,
  loadJson,
  saveJson,
  fetchJson,
  addImageEndpointsToAssets,
  listKeysAndTypes,
  fetchJsonWithCache,
  json2csv,
} from "./src/functions";
import { createManifest, createCollection } from "./src/iiif";
import type { IIIFImageInformation, IngestCollection } from "./src/types";
import cliProgress from "cli-progress";

// Add IIIF endpoints to assets
const collection = await loadNdjson("imagetudelft");
const filteredCollection = filterCollection(collection);
const saeIngest = (await loadJson(
  "dlcs/fotoarchief-sae-ingest.json"
)) as IngestCollection;
const hagmanIngest = (await loadJson(
  "dlcs/fotoarchief-hagman-ingest.json"
)) as IngestCollection;
const ingestRecords = saeIngest.member.concat(hagmanIngest.member);
const enrichedCollection = addImageEndpointsToAssets(
  filteredCollection,
  ingestRecords
);

// Write IIIF Object Manifests
console.log("\nGenerating IIIF Manifests...");
const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
bar.start(enrichedCollection.length, 0);
let log = "\n";
for (const [index, record] of enrichedCollection.entries()) {
  const uuid = record.uuid.replace("uuid:", "");
  if (record.assets?.length) {
    const images = (await Promise.all(
      record.assets.filter((i) => i.iiif).map((i) => fetchJsonWithCache(i.iiif))
    )) as IIIFImageInformation[];
    // https://www.geeksforgeeks.org/how-to-return-an-array-of-unique-objects-in-javascript/
    const uniqueImages = Array.from(
      new Set(images.map((i) => JSON.stringify(i)))
    ).map((i) => JSON.parse(i));
    const manifest = createManifest(uniqueImages, record, uuid);
    await saveJson(manifest, uuid, "iiif/manifests");
    bar.update(index + 1);
  } else {
    log += `Record ${uuid} does not have any assets\n`;
  }
}
bar.stop();
console.log(log);

// Write IIIF Collection Manifest
console.log("Writing IIIF Collection...");
const iiifCollection = createCollection(
  enrichedCollection,
  "Beeldbank",
  "collection"
);
await saveJson(iiifCollection, "collection", "iiif");
console.log("Done!");

// Write CSV
const collectionWithoutAssets = filteredCollection.map((i) => {
  delete i.assets;
  return i;
});
await json2csv(collectionWithoutAssets, "fotoarchief-metadata");
console.log("Written metadata csv");

// Uncomment to list types for SAE collection
// const collection = await loadNdjson("imagetudelft");
// const filteredCollection = filterSaeCollection(collection);
// const keys = listKeysAndTypes(filteredCollection, true);
// console.log(keys);
