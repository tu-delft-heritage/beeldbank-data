import {
  loadNdjson,
  filterSaeCollection,
  loadJson,
  addImageEndpointsToSaeAssets,
  listKeysAndTypes,
} from "./src/functions";

// Uncomment to add IIIF endpoints to assets
// const collection = await loadNdjson("imagetudelft");
// const filteredCollection = filterSaeCollection(collection);
// const ingestCollection = await loadJson("dlcs/fotoarchief-sae-ingest.json");
// const enrichedCollection = addImageEndpointsToSaeAssets(
//   filteredCollection,
//   ingestCollection
// );

// Uncomment to list types for SAE collection
// const collection = await loadNdjson("imagetudelft");
// const filteredCollection = filterSaeCollection(collection);
// const keys = listKeysAndTypes(filteredCollection, true);
// console.log(keys);
