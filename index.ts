import {
  loadNdjson,
  filterSaeCollection,
  loadJson,
  saveJson,
  fetchJson,
  addImageEndpointsToSaeAssets,
  listKeysAndTypes,
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
      record.assets.filter((i) => i.iiif).map((i) => fetchJson(i.iiif))
    )) as IIIFImageInformation[];
    const manifest = createManifest(images, record, uuid);
    await saveJson(manifest, uuid, "iiif");
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

// Uncomment to list types for SAE collection
// const collection = await loadNdjson("imagetudelft");
// const filteredCollection = filterSaeCollection(collection);
// const keys = listKeysAndTypes(filteredCollection, true);
// console.log(keys);
