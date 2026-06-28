import React from 'react';
import classNames from 'classnames';
import { useDrag } from 'react-dnd';
import { Icon } from '@ohif/ui';
import { MiniPacsSeriesItem } from '../types/series';

interface MiniPacsSeriesThumbnailProps {
  series: MiniPacsSeriesItem;
  isActive: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

const MiniPacsSeriesThumbnail: React.FC<MiniPacsSeriesThumbnailProps> = ({
  series,
  isActive,
  onClick,
  onDoubleClick,
  onContextMenu,
}) => {
  const {
    displaySetInstanceUID,
    SeriesNumber,
    Modality,
    numInstances,
    SeriesDescription,
    thumbnailSrc,
    isUnsupported,
  } = series;

  // react-dnd drag source — matches OHIF Thumbnail.tsx / ViewportPane.tsx pattern
  const [, drag] = useDrag({
    type: 'displayset',
    item: {
      type: 'displayset',
      displaySetInstanceUID,
    },
    canDrag: () => !isUnsupported,
  });

  return (
    <div
      className={classNames(
        'group relative flex select-none flex-col rounded border transition-all duration-200',
        isUnsupported
          ? 'cursor-not-allowed border-transparent opacity-50'
          : 'cursor-pointer',
        !isUnsupported && isActive
          ? 'border-[#00B5B8] bg-[#102126]'
          : !isUnsupported
            ? 'border-transparent hover:border-[#3A606E] hover:bg-[#1A323A]'
            : ''
      )}
      onClick={isUnsupported ? undefined : onClick}
      onDoubleClick={isUnsupported ? undefined : onDoubleClick}
      onContextMenu={onContextMenu}
      title={SeriesDescription || 'No description'}
    >
      {/* Drag handle wraps the content */}
      <div ref={drag} className="relative aspect-square w-full overflow-hidden rounded bg-black">
        
        {thumbnailSrc ? (
          <img
            src={thumbnailSrc}
            alt={SeriesDescription || 'Thumbnail'}
            className="h-full w-full object-contain"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-[#A0B0B5]">
            <Icon name={isUnsupported ? 'info' : 'group-layers'} className="mb-1 h-5 w-5" />
          </div>
        )}

        {/* Overlay Metadata */}
        <div className="absolute top-0 left-0 flex w-full justify-between drop-shadow-md" style={{ padding: '2px 4px', fontSize: '10px' }}>
          <div className="flex w-full items-center gap-1 overflow-hidden">
            <span className="font-bold text-[#f59e0b] shrink-0">{SeriesNumber}</span>
            <span className="truncate text-white" title={SeriesDescription || ''}>
              {SeriesDescription}
            </span>
          </div>
        </div>
        {numInstances > 0 && (
          <div className="absolute right-0 bottom-0 bg-[#00B5B8] font-bold text-white rounded-tl-sm" style={{ padding: '1px 4px', fontSize: '10px' }}>
            {numInstances}
          </div>
        )}
      </div>
    </div>
  );
};

export default MiniPacsSeriesThumbnail;
