import { Glob } from "bun";
import type { ImageTUDRecord, Asset, IngestCollection } from "./types.ts";
import { dlcsImageBase } from "./constants.ts";

export async function createNdjson(collectionsSlugs: string[]) {
  for (const collection of collectionsSlugs) {
    const glob = new Glob(`${collection}/**/*.json`);
    const outputFile = Bun.file(`${collection}.ndjson`);
    const writer = outputFile.writer();
    for await (const file of glob.scan(".")) {
      const data = await Bun.file(file).text();
      writer.write(data + "\n");
    }
    writer.end();
  }
}

export function parseNdjson(ndjson: string) {
  return ndjson
    .split("\n")
    .filter((line) => line)
    .map((line) => JSON.parse(line));
}

export async function loadNdjson(collectionSlug: string) {
  const ndjson = await Bun.file(`ndjson/${collectionSlug}.ndjson`).text();
  return parseNdjson(ndjson);
}

export function loadJson(path: string) {
  return Bun.file(path).json();
}

export function saveJson(json: any, filename: string, path: string) {
  return Bun.write(`${path}/${filename}.json`, JSON.stringify(json, null, 4));
}

export function fetchJson(url: string) {
  return fetch(url).then((resp) => resp.json());
}

function getType(value: unknown) {
  if (Array.isArray(value)) {
    return "array";
  } else {
    return typeof value;
  }
}

export function listKeysAndTypes(collection: any[], asTypes: boolean = false) {
  const keys = new Map();
  const totalRecords = collection.length;
  // Get keys and types for keys
  for (const record of collection) {
    const arr = Object.entries(record);
    arr.forEach(([key, value]) => {
      const foundKey = keys.get(key);
      if (foundKey) {
        foundKey.count++;
        foundKey.types.push(getType(value));
      } else {
        keys.set(key, {
          count: 1,
          types: new Array(getType(value)),
        });
      }
    });
  }
  // Check if keys are optional
  for (const [key, value] of keys) {
    value.types = [...new Set(value.types)];
    if (value.count === totalRecords) {
      value.all = true;
    } else value.all = false;
  }
  if (asTypes) {
    // Will not output valid TypeScript but a helpful start!
    return Array.from(
      keys
        .entries()
        .map(
          ([key, value]) =>
            key +
            (value.all ? ": " : "?: ") +
            (value.types[0] === "array" ? "string[]" : value.types[0])
        )
    ).join("\n");
  } else return keys.entries();
}

// Filter for SAE items
export function filterSaeCollection(collection: ImageTUDRecord[]) {
  return collection.filter((record) => {
    try {
      const filteredAssets = record.assets?.filter((asset) =>
        asset.label.includes("SAETUD")
      );
      if (filteredAssets?.length) return true;
      else return false;
    } catch {
      if (!record.embargo_active) {
        console.log(`No assets found for record ${record.uuid}`);
      }
      return false;
    }
  });
}

export function addImageEndpointsToSaeAssets(
  collection: ImageTUDRecord[],
  ingestCollection: IngestCollection
) {
  const imageEndpoints = new Map();
  ingestCollection.member.forEach(({ id: uuid, origin }) => {
    const filename = origin.replace(/.*\/tif\/\d\d\/(.*)\.tif/, "$1");
    imageEndpoints.set(filename, uuid);
  });
  console.log(`${ingestCollection.member.length} images in input collection`);
  let count = 0;
  for (const record of collection) {
    for (const asset of record.assets as Asset[]) {
      const filename = asset.label.replace(/(.*?)_U.*/, "$1");
      const iiif = imageEndpoints.get(filename);
      if (iiif) {
        asset.iiif = dlcsImageBase + iiif;
        count++;
      } else {
        console.log(
          `IIIF Endpoint not found for asset ${asset.label} from record ${record.uuid}`
        );
      }
    }
  }
  console.log(`${count} image endpoints have been added`);
  return collection;
}
