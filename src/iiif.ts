import { IIIFBuilder } from "@iiif/builder";
import {
  homePageBase,
  manifestUriBase,
  objectLabels as labels,
} from "./settings";
import type { ImageTUDRecord, IIIFImageInformation, SAERecord } from "./types";

function parseMetadata(props: ImageTUDRecord) {
  const metadata = new Array();
  for (const [key, label] of Object.entries(labels)) {
    const value = props[key] as string[];
    if (value) {
      metadata.push({
        label,
        value: {
          nl: Array.isArray(value) ? value : [value],
        },
      });
    }
  }
  return metadata;
}

export function createManifest(
  images: IIIFImageInformation[],
  metadata: ImageTUDRecord,
  uuid: string
) {
  const builder = new IIIFBuilder();
  const uri = manifestUriBase + "manifests/" + uuid;
  const manifest = builder.createManifest(uri + ".json", (manifest) => {
    manifest.setLabel({ nl: [metadata.title] });
    manifest.setMetadata(parseMetadata(metadata));
    if (images.length) {
      for (const [index, item] of images.entries()) {
        manifest.createCanvas(uri + "/canvas/" + index, (canvas) => {
          canvas.height = item.height;
          canvas.width = item.width;
          const thumbnail = {
            id:
              item.id.replace("iiif-img", "thumbs") + "/full/max/0/default.jpg",
            type: "Image",
            format: "image/jpeg",
            service: [
              {
                "@context": "http://iiif.io/api/image/3/context.json",
                id: item.id.replace("iiif-img", "thumbs"),
                type: "ImageService3",
                profile: "level0",
                sizes: item.sizes,
              },
            ],
          };
          if (index === 0) {
            manifest.addThumbnail(thumbnail);
          }
          canvas.addThumbnail(thumbnail);
          canvas.createAnnotation(item.id, {
            id: item.id,
            type: "Annotation",
            motivation: "painting",
            body: {
              id: item.id + "/full/max/0/default.jpg",
              type: "Image",
              format: "image/jpeg",
              height: item.height,
              width: item.width,
              service: [
                {
                  "@context": item["@context"],
                  id: item.id,
                  type: item.type,
                  profile: item.profile,
                },
              ],
            },
          });
        });
      }
    }
  });
  return builder.toPresentation3(manifest);
}

export function createCollection(
  records: ImageTUDRecord[],
  label: string,
  id: string
) {
  const builder = new IIIFBuilder();
  const uri = manifestUriBase + id;
  const collection = builder.createCollection(uri + ".json", (collection) => {
    collection.setLabel({ nl: [label] });
    if (records.length) {
      for (const item of records) {
        const uuid = item.uuid.replace("uuid:", "");
        collection.createManifest(
          manifestUriBase + "manifests/" + uuid + ".json",
          (manifest) => {
            manifest.setLabel({ nl: [item.title] });
          }
        );
      }
    }
  });
  return builder.toPresentation3(collection);
}
