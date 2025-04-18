import {
  loadNdjson,
  filterSaeCollection,
  loadJson,
  saveJson,
  fetchJson,
  addImageEndpointsToSaeAssets,
  listKeysAndTypes,
  fetchJsonWithCache,
  json2csv,
} from "./src/functions";
import { createManifest, createCollection } from "./src/iiif";
import type { IIIFImageInformation } from "./src/types";
import cliProgress from "cli-progress";

// Add IIIF endpoints to assets
const collection = await loadNdjson("imagetudelft");
const filteredCollection = filterSaeCollection(collection);
const ingestCollection = await loadJson("dlcs/fotoarchief-sae-ingest.json");
const enrichedCollection = addImageEndpointsToSaeAssets(
  filteredCollection,
  ingestCollection
);

// Write IIIF Object Manifests
console.log("Generating IIIF Manifests...");
const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
bar.start(enrichedCollection.length, 0);
for (const [index, record] of enrichedCollection.entries()) {
  const uuid = record.uuid.replace("uuid:", "");
  if (record.assets) {
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
    throw new Error(`Record ${uuid} does not have any assets`);
  }
}
bar.stop();

// Write IIIF Collection Manifest
console.log("Writing IIIF Collection...");
const iiifCollection = createCollection(
  enrichedCollection,
  "Beeldbank (SAE)",
  "collection"
);
await saveJson(iiifCollection, "collection", "iiif");
console.log("Done!");

// Write CSV
const collectionWithoutAssets = filteredCollection.map((i) => {
  delete i.assets;
  return i;
});
await json2csv(collectionWithoutAssets, "sae-metadata");
console.log("Written metadata csv");

// Uncomment to list types for SAE collection
// const collection = await loadNdjson("imagetudelft");
// const filteredCollection = filterSaeCollection(collection);
// const keys = listKeysAndTypes(filteredCollection, true);
// console.log(keys);
