export type MiniPacsSeriesItem = {
  displaySetInstanceUID: string;
  SeriesInstanceUID?: string;
  StudyInstanceUID?: string;
  Modality?: string;
  SeriesNumber?: number;
  SeriesDescription?: string;
  BodyPartExamined?: string;
  numInstances?: number;
  thumbnailSrc?: string;
  isMultiFrame?: boolean;
  isVideoLike?: boolean;
  sortKey: string;
  isUnsupported?: boolean;
};
