export type SeriesClass =
  | 'xr_primary'
  | 'ct_axial'
  | 'ct_sagittal'
  | 'ct_coronal'
  | 'ct_localizer'
  | 'ct_thin_slice'
  | 'mr_t1'
  | 'mr_t2'
  | 'mr_flair'
  | 'mr_dwi'
  | 'us_cine'
  | 'us_still'
  | 'unknown';

export type NormalizedSeries = {
  displaySetInstanceUID: string;
  SeriesInstanceUID: string;
  SeriesNumber: number;
  SeriesDescription: string;
  Modality: string;
  BodyPartExamined: string;
  ImageType: string[];
  ProtocolName: string;
  numImageFrames: number;
  isMultiFrame: boolean;
  isReconstructable: boolean;
  instanceCount: number;
  firstInstanceNumber: number;
  seriesClass: SeriesClass;
  originalDisplaySet: any;
};

export const seriesClassificationAdapter = {
  normalizeDisplaySet(displaySet: any): NormalizedSeries {
    const Modality = displaySet.Modality || '';
    const SeriesDescription = (displaySet.SeriesDescription || '').toUpperCase();
    const SeriesNumber = displaySet.SeriesNumber ?? 99999;
    const BodyPartExamined = displaySet.BodyPartExamined || '';
    const ImageType = Array.isArray(displaySet.ImageType) ? displaySet.ImageType : (displaySet.ImageType ? [displaySet.ImageType] : []);
    const ProtocolName = displaySet.ProtocolName || '';
    const numImageFrames = displaySet.numImageFrames || 0;
    const isMultiFrame = !!displaySet.isMultiFrame;
    const isReconstructable = !!displaySet.isReconstructable;
    const instanceCount = displaySet.instances?.length || 1;
    const firstInstanceNumber = displaySet.instances?.[0]?.InstanceNumber ?? 99999;

    let seriesClass: SeriesClass = 'unknown';

    if (Modality === 'CR' || Modality === 'DX' || Modality === 'XR') {
      seriesClass = 'xr_primary';
    } else if (Modality === 'CT') {
      const isLocalizer = SeriesDescription.includes('LOCALIZER') || SeriesDescription.includes('SCOUT') || SeriesDescription.includes('TOPO') || SeriesDescription.includes('SURVIEW');
      if (isLocalizer) {
        seriesClass = 'ct_localizer';
      } else if (SeriesDescription.includes('SAG') || SeriesDescription.includes('SAGITTAL')) {
        seriesClass = 'ct_sagittal';
      } else if (SeriesDescription.includes('COR') || SeriesDescription.includes('CORONAL')) {
        seriesClass = 'ct_coronal';
      } else if (SeriesDescription.includes('AX') || SeriesDescription.includes('AXIAL') || SeriesDescription.includes('TRA') || SeriesDescription.includes('TRANSVERSE')) {
        seriesClass = 'ct_axial';
      } else {
        // Fallback for CT, guess axial by default if it's reconstructable or has many frames
        seriesClass = instanceCount > 20 ? 'ct_axial' : 'unknown';
      }
    } else if (Modality === 'MR') {
      if (SeriesDescription.includes('FLAIR')) {
        seriesClass = 'mr_flair';
      } else if (SeriesDescription.includes('DWI') || SeriesDescription.includes('DIFF') || SeriesDescription.includes('ADC')) {
        seriesClass = 'mr_dwi';
      } else if (SeriesDescription.includes('T1')) {
        seriesClass = 'mr_t1';
      } else if (SeriesDescription.includes('T2')) {
        seriesClass = 'mr_t2';
      }
    } else if (Modality === 'US') {
      if (isMultiFrame || numImageFrames > 1) {
        seriesClass = 'us_cine';
      } else {
        seriesClass = 'us_still';
      }
    }

    return {
      displaySetInstanceUID: displaySet.displaySetInstanceUID,
      SeriesInstanceUID: displaySet.SeriesInstanceUID,
      SeriesNumber,
      SeriesDescription,
      Modality,
      BodyPartExamined,
      ImageType,
      ProtocolName,
      numImageFrames,
      isMultiFrame,
      isReconstructable,
      instanceCount,
      firstInstanceNumber,
      seriesClass,
      originalDisplaySet: displaySet,
    };
  },

  sortSeriesForModality(seriesList: NormalizedSeries[], modality: string): NormalizedSeries[] {
    // Sort logic to make sure the order is stable and deterministic
    return [...seriesList].sort((a, b) => {
      // Common rules
      
      // Fallback
      if (a.SeriesNumber !== b.SeriesNumber) {
        return a.SeriesNumber - b.SeriesNumber;
      }
      if (a.instanceCount !== b.instanceCount) {
        return b.instanceCount - a.instanceCount;
      }
      return a.SeriesDescription.localeCompare(b.SeriesDescription);
    });
  }
};
