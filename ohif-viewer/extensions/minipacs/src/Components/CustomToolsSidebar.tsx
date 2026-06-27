import React, { useState } from 'react';

/**
 * CustomToolsSidebar – Full-featured tool sidebar for MiniPACS Viewer.
 *
 * Contains ALL tools available in OHIF v3.7.0 longitudinal mode,
 * organized into logical radiology-workflow groups:
 *
 *  1. Navigation Tools     – Pan, Zoom, Stack Scroll, Magnify
 *  2. Window/Level         – W/L Manual + 5 organ presets
 *  3. Measurement Tools    – Length, Bidirectional, Ellipse, Circle, Rectangle, Angle, Calibration
 *  4. Annotation Tools     – Arrow Annotate, Probe, Freehand ROI
 *  5. Image Manipulation   – Reset, Rotate, Flip H/V, Invert, Capture, Cine
 *  6. MPR & Sync           – MPR, Crosshairs, Reference Lines, Stack Image Sync
 *  7. Overlay & Info       – Image Overlay, DICOM Tag Browser
 *  8. Layout               – 1×1, 1×2, 2×1, 2×2, 3×3
 */

// ──────────────────── SVG Icon Components ────────────────────
// Inline SVGs so the sidebar works independently of OHIF's Icon registry.

const ChevronDown = () => (
  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Generic fallback icon (small square)
const FallbackIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.2"/>
  </svg>
);

// Navigation
const PanIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 9l-3 3 3 3"/><path d="M9 5l3-3 3 3"/><path d="M15 19l-3 3-3-3"/><path d="M19 9l3 3-3 3"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/>
  </svg>
);

const ZoomIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
  </svg>
);

const StackScrollIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="6" rx="1"/><rect x="4" y="10" width="16" height="4" rx="1"/><rect x="4" y="16" width="16" height="6" rx="1"/>
  </svg>
);

const MagnifyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

// Window/Level
const WindowLevelIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20" fill="currentColor" opacity="0.3"/>
  </svg>
);

// Measurement
const LengthIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <line x1="4" y1="20" x2="20" y2="4"/><line x1="4" y1="20" x2="4" y2="16"/><line x1="4" y1="20" x2="8" y2="20"/><line x1="20" y1="4" x2="20" y2="8"/><line x1="20" y1="4" x2="16" y2="4"/>
  </svg>
);

const BidirectionalIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <line x1="4" y1="20" x2="20" y2="4"/><line x1="8" y1="8" x2="16" y2="16"/>
  </svg>
);

const EllipseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <ellipse cx="12" cy="12" rx="9" ry="6"/>
  </svg>
);

const CircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="12" cy="12" r="9"/>
  </svg>
);

const RectangleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <rect x="3" y="5" width="18" height="14" rx="1"/>
  </svg>
);

const AngleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20L12 4L20 20"/>
  </svg>
);

const CalibrationIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="8" x2="4" y2="16"/><line x1="20" y1="8" x2="20" y2="16"/><line x1="9" y1="10" x2="9" y2="14"/><line x1="15" y1="10" x2="15" y2="14"/>
  </svg>
);

// Annotation
const ArrowAnnotateIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="19" x2="19" y2="5"/><polyline points="13 5 19 5 19 11"/>
  </svg>
);

const ProbeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <circle cx="12" cy="12" r="2" fill="currentColor"/><line x1="12" y1="2" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="22"/><line x1="2" y1="12" x2="8" y2="12"/><line x1="16" y1="12" x2="22" y2="12"/>
  </svg>
);

const FreehandIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 16c2-4 4-8 8-8s4 4 8 0"/>
  </svg>
);

// Image Manipulation
const ResetIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
  </svg>
);

const RotateRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

const FlipHIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <line x1="12" y1="2" x2="12" y2="22"/><polyline points="5 8 2 12 5 16"/><polyline points="19 8 22 12 19 16"/>
  </svg>
);

const FlipVIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <line x1="2" y1="12" x2="22" y2="12"/><polyline points="8 5 12 2 16 5"/><polyline points="8 19 12 22 16 19"/>
  </svg>
);

const InvertIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 0 0 20" fill="currentColor" opacity="0.5"/>
  </svg>
);

const CaptureIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
  </svg>
);

const CineIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" opacity="0.3"/>
  </svg>
);

// MPR & Sync
const MPRIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <rect x="2" y="2" width="9" height="9" rx="1"/><rect x="13" y="2" width="9" height="9" rx="1"/><rect x="2" y="13" width="9" height="9" rx="1"/>
  </svg>
);

const CrosshairsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <circle cx="12" cy="12" r="8"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
  </svg>
);

const ReferenceLinesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="3 3">
    <line x1="2" y1="8" x2="22" y2="8"/><line x1="2" y1="16" x2="22" y2="16"/>
  </svg>
);

const StackSyncIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

// Overlay & Info
const OverlayIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
  </svg>
);

const TagBrowserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/>
  </svg>
);

// Layout
const Layout1x1Icon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
);
const Layout1x2Icon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
);
const Layout2x1Icon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="12" x2="21" y2="12"/></svg>
);
const Layout2x2Icon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/></svg>
);
const Layout3x3Icon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/>
  </svg>
);

// ──────────────────── Icon Registry ────────────────────

const iconMap: Record<string, React.FC> = {
  Pan: PanIcon,
  Zoom: ZoomIcon,
  StackScroll: StackScrollIcon,
  Magnify: MagnifyIcon,
  WindowLevel: WindowLevelIcon,
  'Soft tissue': WindowLevelIcon,
  Lung: WindowLevelIcon,
  Liver: WindowLevelIcon,
  Bone: WindowLevelIcon,
  Brain: WindowLevelIcon,
  Length: LengthIcon,
  Bidirectional: BidirectionalIcon,
  EllipticalROI: EllipseIcon,
  CircleROI: CircleIcon,
  RectangleROI: RectangleIcon,
  Angle: AngleIcon,
  CalibrationLine: CalibrationIcon,
  ArrowAnnotate: ArrowAnnotateIcon,
  Probe: ProbeIcon,
  PlanarFreehandROI: FreehandIcon,
  Reset: ResetIcon,
  RotateRight: RotateRightIcon,
  FlipHorizontal: FlipHIcon,
  FlipVertical: FlipVIcon,
  Invert: InvertIcon,
  Capture: CaptureIcon,
  Cine: CineIcon,
  MPR: MPRIcon,
  Crosshairs: CrosshairsIcon,
  ReferenceLines: ReferenceLinesIcon,
  StackImageSync: StackSyncIcon,
  ImageOverlayViewer: OverlayIcon,
  TagBrowser: TagBrowserIcon,
  '1x1': Layout1x1Icon,
  '1x2': Layout1x2Icon,
  '2x1': Layout2x1Icon,
  '2x2': Layout2x2Icon,
  '3x3': Layout3x3Icon,
};

function getIcon(id: string): React.FC {
  return iconMap[id] || FallbackIcon;
}

import { minipacsToolRegistry, minipacsToolSections, MiniPacsTool, MiniPacsToolSection } from '../config/minipacsToolRegistry';
import { runMiniPacsTool } from '../services/commandBridge';

// ──────────────────── Sidebar Component ────────────────────



export default function CustomToolsSidebar({ servicesManager }) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    minipacsToolSections.forEach((s) => {
      initial[s.id] = s.defaultOpen ?? true;
    });
    return initial;
  });

  const [activeTool, setActiveTool] = useState<string | null>('WindowLevel');
  const [toggledTools, setToggledTools] = useState<Record<string, boolean>>({});

  const { commandsManager } = servicesManager;

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToolClick = (item: MiniPacsTool) => {
    const result = runMiniPacsTool(servicesManager, commandsManager, item, {
      toggledState: !toggledTools[item.id],
    });

    if (result.ok) {
      if (item.type === 'tool') {
        setActiveTool(item.id);
      } else if (item.type === 'toggle') {
        setToggledTools((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
      }
    } else if (result.reason === 'not_implemented') {
      alert(result.message || 'Tính năng chưa được hỗ trợ.');
    }
  };



  // ── Rendering helpers ──

  const renderIconButton = (item: MiniPacsTool) => {
    const Icon = getIcon(item.id);
    const isActive = item.type === 'tool' && activeTool === item.id;
    const isToggled = item.type === 'toggle' && toggledTools[item.id];
    const isDisabled = ['backend', 'advanced', 'guarded'].includes(item.status);

    return (
      <button
        key={item.id}
        title={item.label + (isDisabled ? ' (Coming soon)' : '')}
        disabled={isDisabled}
        className={`
          w-[36px] h-[36px] flex items-center justify-center rounded
          transition-all duration-150
          ${isDisabled
            ? 'text-[#4A5B66] cursor-not-allowed opacity-50'
            : isActive || isToggled
              ? 'bg-[#00B5B8] bg-opacity-20 text-[#00B5B8] border border-[#00B5B8] cursor-pointer'
              : 'text-[#8899A6] hover:text-[#00B5B8] hover:bg-[#1A323A] border border-transparent cursor-pointer'
          }
        `}
        onClick={() => handleToolClick(item)}
      >
        <Icon />
      </button>
    );
  };

  const renderListItem = (item: MiniPacsTool) => {
    const Icon = getIcon(item.id);
    const isActive = item.type === 'tool' && activeTool === item.id;
    const isDisabled = ['backend', 'advanced', 'guarded'].includes(item.status);

    return (
      <button
        key={item.id}
        title={item.label + (isDisabled ? ' (Coming soon)' : '')}
        disabled={isDisabled}
        className={`
          w-full flex items-center gap-2 px-2 py-1 text-left rounded
          transition-all duration-150
          ${isDisabled
            ? 'text-[#4A5B66] cursor-not-allowed opacity-50'
            : isActive
              ? 'bg-[#00B5B8] bg-opacity-20 text-[#00B5B8] cursor-pointer'
              : 'text-[#8899A6] hover:text-[#00B5B8] hover:bg-[#1A323A] cursor-pointer'
          }
        `}
        onClick={() => handleToolClick(item)}
      >
        <Icon />
        <span className="text-[11px]">{item.label}</span>
      </button>
    );
  };

  const renderGridButton = (item: MiniPacsTool) => {
    const Icon = getIcon(item.id);
    return (
      <button
        key={item.id}
        title={item.label}
        className="w-[36px] h-[36px] flex items-center justify-center border border-[#1A323A] rounded text-[#8899A6] hover:border-[#00B5B8] hover:text-[#00B5B8] hover:bg-[#1A323A] transition-all cursor-pointer"
        onClick={() => handleToolClick(item)}
      >
        <Icon />
      </button>
    );
  };

  return (
    <div className="w-[180px] bg-[#102126] h-full flex flex-col overflow-y-auto"
         style={{ scrollbarWidth: 'thin', scrollbarColor: '#1A323A #102126' }}>
      {minipacsToolSections.map((section) => {
        const sectionTools = minipacsToolRegistry.filter((t) => section.toolIds.includes(t.id));
        return (
        <div key={section.id} className="flex flex-col">
          {/* ── Section Header (clickable toggle) ── */}
          <button
            className="flex justify-between items-center px-3 py-1.5 bg-[#0D1B20] text-white text-[11px] font-semibold tracking-wide
                       hover:bg-[#152A30] transition-colors border-b border-[#1A323A] cursor-pointer select-none"
            onClick={() => toggleSection(section.id)}
          >
            <span>{section.title}</span>
            <span
              className="text-[#00B5B8] transition-transform duration-200"
              style={{ transform: openSections[section.id] ? 'rotate(0deg)' : 'rotate(-90deg)' }}
            >
              <ChevronDown />
            </span>
          </button>

          {/* ── Section Content (toggled) ── */}
          {openSections[section.id] && sectionTools.length > 0 && (
            <div className="px-1.5 py-1.5 bg-[#152A30] border-b border-[#1A323A]">
              {section.renderType === 'icons' && (
                <div className="flex flex-wrap gap-1">
                  {sectionTools.map(renderIconButton)}
                </div>
              )}
              {section.renderType === 'list' && (
                <div className="flex flex-col gap-0">
                  {sectionTools.map(renderListItem)}
                </div>
              )}
              {section.renderType === 'grid' && (
                <div className="flex flex-wrap gap-1">
                  {sectionTools.map(renderGridButton)}
                </div>
              )}
            </div>
          )}
        </div>
      )})}
    </div>
  );
}

