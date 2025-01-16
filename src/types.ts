// DLCS types
export type IngestRecord = {
  origin: string;
  id: string;
};

export type IngestCollection = {
  member: IngestRecord[];
};

// Beeldbank export types
export type Asset = {
  mimetype: string;
  extension: string;
  ref_url: string;
  label: string;
  filename: string;
  id: string;
  md5: string;
  size: number;
  iiif?: string;
};

export type ImageTUDRecord = {
  set: string[];
  description?: string;
  title: string;
  photographer?: string[];
  rights?: string[];
  settlement?: string[];
  materiaal?: string;
  note?: string;
  assets?: Asset[];
  faculty?: string;
  date?: string;
  subject?: string[];
  type: string;
  uuid: string;
  width?: string;
  length?: string;
  embargo?: string;
  creator?: string[];
  embargodisplay?: string;
  datedisplay?: string;
  notes?: string;
  relation_link?: boolean;
  conditionandeffects?: string;
  relation?: string;
  units?: string;
  submitter_email?: string[];
  embargo_active?: boolean;
  nation?: string[];
  coordinates?: string;
  longitude?: string;
  latitude?: string;
  source?: string;
  duration?: string;
  scale?: string;
  relationtype?: string;
  architect?: string[];
  straat?: string;
  department?: string;
  Length?: string;
  Width?: string;
  engraver?: string[];
  draftsman?: string[];
  yearconstructionbegin?: string;
  identifier?: string[];
};

export type SAERecord = {
  set: string[];
  description?: string;
  rights: string[];
  photographer?: string[];
  title: string;
  materiaal: string;
  settlement?: string[];
  width?: string;
  length: string;
  assets: Asset[];
  faculty?: string;
  date?: string;
  subject?: string[];
  type: string;
  uuid: string;
  notes?: string;
  creator?: string[];
  note?: string;
  relation_link?: boolean;
  relation?: string;
  conditionandeffects?: string;
  straat?: string;
  submitter_email?: string[];
  units?: string;
  department?: string;
  Length?: string;
  Width?: string;
  yearconstructionbegin?: string;
};

export type IIIFImageInformation = {
  "@context": string;
  id: string;
  type: string;
  profile: string;
  protocol: string;
  width: number;
  height: number;
  maxArea: number;
  sizes: [{ width: number; height: number }];
  tiles: [
    {
      width: number;
      height: number;
      scaleFactors: number[];
    }
  ];
  extraQualities: string[];
  extraFormats: string[];
  extraFeatures: string[];
};
