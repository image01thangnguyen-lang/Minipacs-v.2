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
        'group relative flex select-none flex-col rounded-md border-2 p-1 transition-all duration-200',
        isUnsupported
          ? 'cursor-not-allowed opacity-50 border-transparent'
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
    >
      {/* Drag handle wraps the content */}
      <div ref={drag}>
        <div className="flex w-full items-center justify-between text-[11px] text-[#A0B0B5]">
          <span className="font-bold text-white">S: {SeriesNumber}</span>
          <span className="flex items-center gap-1">
            {Modality}
            <span className="text-[#00B5B8]">{numInstances > 0 ? numInstances : ''}</span>
          </span>
        </div>

        <div className="relative mt-1 flex aspect-square w-full items-center justify-center overflow-hidden rounded bg-black">
          {thumbnailSrc ? (
            <img
              src={thumbnailSrc}
              alt={SeriesDescription || 'Thumbnail'}
              className="h-full w-full object-contain"
              draggable={false}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-[#A0B0B5]">
              <Icon name={isUnsupported ? 'info' : 'group-layers'} className="mb-1 h-6 w-6" />
              <span className="text-[10px]">No Image</span>
            </div>
          )}
        </div>

        <div className="mt-1 truncate text-center text-[10px] text-[#A0B0B5] group-hover:text-white">
          {SeriesDescription || 'No description'}
        </div>
      </div>
    </div>
  );
};

export default MiniPacsSeriesThumbnail;
