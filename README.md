# Image Archive to IIIF

The Image Archive of TU Delft Library (now offline) contained items from (or related to) the special collections. This repository contains exports of the metadata (in `ndjson` format) of the following three sets:

- `imagetudelft` (2363)
- `prentenkabinet` (9351 records)
- `bkdia` (13728 records)

The scripts in this repository are used to match records in these sets against IIIF Image API endpoints, and to generate IIIF Presentation Manifests. The resulting manifests will be added to the [Academic Heritage website](https://erfgoed.tudelft.nl), making the data publicly available again.

## Development

First [install](https://bun.sh/docs/installation) the Bun javascript runtime.

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.1.24. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
