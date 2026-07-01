import React, { useEffect } from 'react';

interface MiniPacsSeriesContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
}

const disabledItems = [
  { label: 'Convert to Key Images', id: 'key-images' },
  { label: 'Export to Video', id: 'export-video' },
  { label: 'Download Series', id: 'download-series' },
];

const MiniPacsSeriesContextMenu: React.FC<MiniPacsSeriesContextMenuProps> = ({
  x,
  y,
  onClose,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed z-50 min-w-[180px] rounded-md border border-[#1A323A] bg-[#102126] py-1 shadow-lg"
      style={{ top: y, left: x }}
      onClick={e => e.stopPropagation()}
    >
      {disabledItems.map(item => (
        <button
          key={item.id}
          disabled
          className="flex w-full cursor-not-allowed items-center px-3 py-[6px] text-left text-[12px] text-[#5A7A85]"
        >
          {item.label}
          <span className="ml-auto text-[10px] italic text-[#3A606E]">Coming soon</span>
        </button>
      ))}
    </div>
  );
};

export default MiniPacsSeriesContextMenu;
