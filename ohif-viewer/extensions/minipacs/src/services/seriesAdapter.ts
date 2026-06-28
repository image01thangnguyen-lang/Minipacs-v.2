import { MiniPacsSeriesItem } from '../types/series';

export function mapDisplaySetsToMiniPacsSeries(
  displaySets: any[],
  thumbnailImageSrcMap: Record<string, string>
): MiniPacsSeriesItem[] {
  const mapped = displaySets
    .filter(ds => !ds.excludeFromThumbnailBrowser)
    .map(ds => {
      const isUnsupported = ds.unsupported === true;
      const thumbnailSrc = thumbnailImageSrcMap[ds.displaySetInstanceUID];

      return {
        displaySetInstanceUID: ds.displaySetInstanceUID,
        SeriesInstanceUID: ds.SeriesInstanceUID,
        StudyInstanceUID: ds.StudyInstanceUID,
        Modality: ds.Modality,
        SeriesNumber: ds.SeriesNumber || 0,
        SeriesDescription: ds.SeriesDescription || '',
        BodyPartExamined: ds.BodyPartExamined || '',
        numInstances: ds.numImageFrames || 0,
        thumbnailSrc,
        isMultiFrame: ds.isMultiFrame === true,
        isVideoLike: ds.isVideoLike === true,
        isUnsupported,
        // Sort key: study date/time, series number, description
        sortKey: `${ds.StudyDate || ''}_${ds.StudyTime || ''}_${String(ds.SeriesNumber || 0).padStart(4, '0')}_${ds.SeriesDescription || ''}`,
      } as MiniPacsSeriesItem;
    });

  // Sort series
  mapped.sort((a, b) => {
    return a.sortKey.localeCompare(b.sortKey);
  });

  return mapped;
}

