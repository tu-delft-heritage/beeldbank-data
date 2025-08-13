import { Glob } from "bun";
import type {
  ImageTUDRecord,
  Asset,
  IngestCollection,
  IngestRecord,
} from "./types.ts";
import { dlcsImageBase } from "./settings.ts";
import converter from "json-2-csv";

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

async function getCache(id: string) {
  const file = Bun.file(`.cache/${id}.json`);
  if (await file.exists()) {
    return file.json();
  } else return null;
}

export async function fetchJsonWithCache(
  uuid: string,
  useCache: boolean = true
) {
  if (useCache) {
    const cache = await getCache(uuid);
    if (cache) {
      return cache;
    }
  }
  const url = dlcsImageBase + uuid;
  const resp = await fetch(url).then((resp) => resp.json());
  await saveJson(resp, uuid, ".cache/");
  return resp;
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

// Filter for SAE and Hagman sets
export function filterCollection(collection: ImageTUDRecord[]) {
  return collection.filter((record) => {
    if (record.assets) {
      const sae = record.assets.some((asset) => asset.label.includes("SAETUD"));
      if (sae) return true;
    }
    if (record.photographer) {
      const ritter = record.photographer.some((i) => i.includes("Ritter"));
      if (ritter) return false;
      return record.photographer.some((i) =>
        i.includes("Fotografische Dienst")
      );
    } else return false;
  });
}

export function addImageEndpointsToAssets(
  collection: ImageTUDRecord[],
  ingestRecords: IngestRecord[]
) {
  const imageEndpoints = new Map();
  ingestRecords.forEach(({ id: uuid, origin }) => {
    let filename;
    if (origin.includes("SAE")) {
      filename = origin.replace(/.*\/tif\/\d\d\/(.*)\.tif/, "$1");
    } else {
      filename = origin.replace(/.*\/(.*)\.tif/, "$1").replace(" ", "_");
      const duplicateFilenames = ["69-170_001", "69-170_002", "69-170_003"];
      if (duplicateFilenames.includes(filename)) {
        if (origin.includes("9x12")) {
          filename = filename + "_9x12";
        }
      }
    }
    imageEndpoints.set(filename, uuid);
  });
  console.log(`${ingestRecords.length} images in input collection`);
  let count = 0;
  for (const record of collection) {
    for (const asset of record.assets as Asset[]) {
      let filename;
      if (asset.label.includes("SAE")) {
        filename = asset.label.replace(/(.*?)_U.*/, "$1");
      } else {
        filename = asset.label
          .trim()
          .replace(/_*.jpg/, "")
          .replace("_vitrine_mijnbouwkunde", "");
        if (record.uuid === "cce1d29e-2adc-401f-90b7-b9e5353422ab") {
          filename = filename + "_9x12";
        }
      }
      const iiif = imageEndpoints.get(filename);
      if (iiif) {
        asset.iiif = iiif;
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

export function json2csv(json: any[], filename: string) {
  const csvData = converter.json2csv(json, { emptyFieldValue: "" });
  return Bun.write(`csv/${filename}.csv`, csvData);
}
