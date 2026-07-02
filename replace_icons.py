import sys

target_file = 'C:/App/Antigravity/Minipacs-v.2/ohif-viewer/extensions/minipacs/src/Components/CustomToolsSidebar.tsx'

with open(target_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# find the start and end of the icon registry
start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if "const ChevronDown = () => (" in line:
        start_idx = i
    if "};" in line and "SpineLabel: SpineLabelingIcon," in line:
        pass # just in case
    if "Volume: Box3DIcon," in line or "Volume: VolumeIcon," in line:
        # the end of the iconMap is a few lines below
        for j in range(i, i+10):
            if "};" in lines[j]:
                end_idx = j + 1
                break

if end_idx == -1:
    for i, line in enumerate(lines):
        if "function getIcon(id: string): React.FC {" in line:
            end_idx = i - 1
            break

if start_idx == -1 or end_idx == -1:
    print(f"Could not find boundaries: start={start_idx}, end={end_idx}")
    sys.exit(1)

new_icons = """const ChevronDown = () => (
  <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 1L5 5L9 1" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const FallbackIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Tier 1 - Simple & Monochrome

const PanIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 9l-3 3 3 3"/><path d="M9 5l3-3 3 3"/><path d="M15 19l-3 3-3-3"/><path d="M19 9l3 3-3 3"/>
    <line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/>
  </svg>
);

const ZoomIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    <line x1="11" y1="8" x2="11" y2="14"/>
    <line x1="8" y1="11" x2="14" y2="11"/>
  </svg>
);

const StackScrollIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="6" rx="1" />
    <rect x="4" y="10" width="16" height="4" rx="1" />
    <rect x="4" y="16" width="16" height="6" rx="1" />
  </svg>
);

const MagnifyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const WindowLevelIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 2a10 10 0 0 1 0 20Z"/>
  </svg>
);

const LengthIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="8" x2="21" y2="8" />
    <line x1="3" y1="5" x2="3" y2="11" />
    <line x1="21" y1="5" x2="21" y2="11" />
    <rect x="2" y="14" width="20" height="6" rx="1" />
    <line x1="6" y1="14" x2="6" y2="16" />
    <line x1="10" y1="14" x2="10" y2="17" />
    <line x1="14" y1="14" x2="14" y2="16" />
    <line x1="18" y1="14" x2="18" y2="16" />
  </svg>
);

const BidirectionalIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="20" x2="20" y2="4"/>
    <line x1="8" y1="8" x2="16" y2="16" />
  </svg>
);

const EllipseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="12" rx="9" ry="6" strokeDasharray="3 3"/>
  </svg>
);

const CircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" strokeDasharray="3 3"/>
  </svg>
);

const RectangleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="1" strokeDasharray="3 3"/>
  </svg>
);

const AngleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 18 A 9 9 0 0 1 21 18 Z" />
    <line x1="12" y1="18" x2="16" y2="10" />
    <path d="M8 18 A 4 4 0 0 1 12 14" strokeDasharray="2 2" />
  </svg>
);

const CalibrationIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="8" x2="4" y2="16"/><line x1="20" y1="8" x2="20" y2="16"/><line x1="9" y1="10" x2="9" y2="14"/><line x1="15" y1="10" x2="15" y2="14"/>
  </svg>
);

const ArrowAnnotateIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="19" x2="19" y2="5"/><polyline points="13 5 19 5 19 11"/>
  </svg>
);

const ProbeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="2" />
    <line x1="12" y1="2" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="22"/>
    <line x1="2" y1="12" x2="8" y2="12"/><line x1="16" y1="12" x2="22" y2="12"/>
  </svg>
);

const FreehandIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 16c2-4 4-8 8-8s4 4 8 0"/>
  </svg>
);

const ResetIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
  </svg>
);

const RotateLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
  </svg>
);

const RotateRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

const FlipHIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="2" x2="12" y2="22" strokeDasharray="3 3" />
    <polyline points="5 8 2 12 5 16"/><polyline points="19 8 22 12 19 16"/>
  </svg>
);

const FlipVIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="2" y1="12" x2="22" y2="12" strokeDasharray="3 3" />
    <polyline points="8 5 12 2 16 5"/><polyline points="8 19 12 22 16 19"/>
  </svg>
);

const InvertIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 0 0 20Z"/>
  </svg>
);

const CaptureIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const CineIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);

const MPRIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="9" height="9" rx="1"/><rect x="13" y="2" width="9" height="9" rx="1"/><rect x="2" y="13" width="9" height="9" rx="1"/>
  </svg>
);

const CrosshairsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="8"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
  </svg>
);

const ReferenceLinesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 3">
    <line x1="2" y1="8" x2="22" y2="8"/><line x1="2" y1="16" x2="22" y2="16"/>
  </svg>
);

const StackSyncIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

const OverlayIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
  </svg>
);

const TagBrowserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>
  </svg>
);

const GalleryIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="21 15 16 10 5 21"/>
  </svg>
);

const ReportIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>
);

const HistoryIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

const ConfigIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const AboutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

const Layout1x1Icon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
  </svg>
);
const Layout1x2Icon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21" />
  </svg>
);
const Layout2x1Icon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="12" x2="21" y2="12" />
  </svg>
);
const Layout2x2Icon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21" /><line x1="3" y1="12" x2="21" y2="12" />
  </svg>
);
const Layout3x3Icon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" />
  </svg>
);

const PrintIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
  </svg>
);

const CDIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

const PolygonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 22 8 18 20 6 20 2 8" />
  </svg>
);

const MirrorIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v20" strokeDasharray="3 3"/><path d="M8 6l-4 4 4 4"/><path d="M16 6l4 4-4 4"/>
  </svg>
);

const VideoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const FolderIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const TextIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>
  </svg>
);

const EraserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 20H7L3 16C2.5 15.5 2.5 14.5 3 14L13 4C13.5 3.5 14.5 3.5 15 4L20 9C20.5 9.5 20.5 10.5 20 11L11 20" />
    <line x1="20" y1="20" x2="11" y2="20" />
  </svg>
);

const CropIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>
    <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
  </svg>
);

const ListIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

const ShareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const AxialIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="9" ry="3" /><line x1="2" y1="12" x2="22" y2="12"/>
  </svg>
);

const CoronalIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="3" ry="9" /><line x1="12" y1="2" x2="12" y2="22"/>
  </svg>
);

const CurvedIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12s5-8 9-8 9 8 9 8"/>
  </svg>
);


// Tier 2 - Detailed & Semi-flat Medical Illustration

const SpineLabelingIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 5c0-1 2-2 5-2s5 1 5 2v2c0 1-2 1.5-5 1.5S7 8 7 7V5z" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1" />
    <ellipse cx="12" cy="9.5" rx="4.5" ry="1.2" fill="#06b6d4" stroke="#0891b2" strokeWidth="0.8" />
    <path d="M7 11c0-1 2-2 5-2s5 1 5 2v2c0 1-2 1.5-5 1.5S7 14 7 13v-2z" fill="#e2e8f0" stroke="#64748b" strokeWidth="1" />
    <path d="M7.5 15.5c0-.7 2-1.2 4.5-1.2s4.5.5 4.5 1.2c0 .7-1.5 1.2-4.5 1.2s-4.5-.5-4.5-1.2z" fill="#f43f5e" stroke="#be123c" strokeWidth="0.8" />
    <path d="M16 15c1 0 2 .5 2 1s-1 1-2 1" fill="#f43f5e" stroke="#be123c" strokeWidth="0.8" />
    <path d="M7 17c0-1 2-2 5-2s5 1 5 2v2c0 1-2 1.5-5 1.5S7 20 7 19v-2z" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
  </svg>
);

const BrainIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4c-3-2-6 0-7 3a4 4 0 0 0-1 6c0 2 1.5 3 2 3 0 2 2 4 4 4 1 0 2-1 2-2s1 2 2 2c2 0 4-2 4-4 1 0 2-1 2-3a4 4 0 0 0-1-6c-1-3-4-5-7-3z" fill="#fbcfe8" stroke="#f472b6" strokeWidth="1" />
    <circle cx="15" cy="10" r="2.5" fill="#f43f5e" stroke="#be123c" strokeWidth="1" />
    <path d="M12 4v16" stroke="#94a3b8" strokeDasharray="2 2" strokeWidth="1" />
  </svg>
);

const LungIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v6" stroke="#f1f5f9" strokeWidth="2" />
    <path d="M12 8l-3 3c-1.5 1.5-2 4-1 6 1 1.5 3 2 5 2V8z" fill="#06b6d4" stroke="#0891b2" strokeWidth="1" />
    <path d="M12 8l3 3c1.5 1.5 2 4 1 6-1 1.5-3 2-5 2V8z" fill="#06b6d4" stroke="#0891b2" strokeWidth="1" />
    <circle cx="16" cy="14" r="1.5" fill="#f97316" stroke="#c2410c" strokeWidth="0.5" />
    <circle cx="16" cy="14" r="3" stroke="#f97316" strokeWidth="0.8" strokeDasharray="1 1" />
  </svg>
);

const HeartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="#f43f5e" stroke="#be123c" strokeWidth="1" />
    <path d="M12 5.67v15.56" stroke="#be123c" strokeWidth="1" strokeDasharray="1 2" />
    <ellipse cx="9" cy="10" rx="1.5" ry="3" fill="#fbcfe8" stroke="none" />
  </svg>
);

const BreastIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4c0 0-2 8 8 16 10-8 8-16 8-16" fill="#fbcfe8" stroke="#f472b6" strokeWidth="1" />
    <circle cx="15" cy="10" r="2" fill="#f97316" stroke="#c2410c" strokeWidth="0.8" />
    <path d="M12 20c-5-5-5-10-5-10" stroke="#f472b6" strokeWidth="1" />
  </svg>
);

const BoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 10a2 2 0 1 1-2-3.46A2 2 0 0 1 8 6v12a2 2 0 0 1-2-.54A2 2 0 1 1 8 14h8a2 2 0 1 1 2 3.46A2 2 0 0 1 16 18V6a2 2 0 0 1 2 .54A2 2 0 1 1 16 10H8z" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1" />
  </svg>
);

const VolumeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" stroke="#94a3b8" strokeWidth="1" />
    <line x1="12" y1="22.08" x2="12" y2="12" stroke="#94a3b8" strokeWidth="1" />
    <path d="M12 12 l8.7 -5.05 v10 l-8.7 5.05 z" fill="#f43f5e" stroke="none" opacity="0.8" />
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
  Lung: LungIcon,
  Liver: WindowLevelIcon,
  Bone: BoneIcon,
  Brain: BrainIcon,
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
  RotateLeft: RotateLeftIcon,
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
  Gallery: GalleryIcon,
  Report: ReportIcon,
  StudyHistory: HistoryIcon,
  PACSConfig: ConfigIcon,
  UserConfig: ConfigIcon,
  About: AboutIcon,
  '1x1': Layout1x1Icon,
  '1x2': Layout1x2Icon,
  '2x1': Layout2x1Icon,
  '2x2': Layout2x2Icon,
  '3x3': Layout3x3Icon,
  Print: PrintIcon,
  DirectPrint: PrintIcon,
  CDBurn: CDIcon,
  // New tools mapping
  Caliper: LengthIcon,
  AngleVector: AngleIcon,
  PolygonROI: PolygonIcon,
  MirrorROI: MirrorIcon,
  BrainMirror: BrainIcon,
  VolumePolygon: PolygonIcon,
  Cardiopulmonary: HeartIcon,
  Mammography: BreastIcon,
  Reconstruction: VolumeIcon,
  ExportVideo: VideoIcon,
  FreeRotate: RotateRightIcon,
  AutoSync: StackSyncIcon,
  Crosshair3D: CrosshairsIcon,
  ZoomPanSync: StackSyncIcon,
  WWXLSync: StackSyncIcon,
  ManualSync: StackSyncIcon,
  Axial: AxialIcon,
  Coronal: CoronalIcon,
  Sagittal: CoronalIcon,
  MIP: MPRIcon,
  '3D': VolumeIcon,
  CompareMPR: Layout1x2Icon,
  CurvedMPR: CurvedIcon,
  TextMarker: TextIcon,
  Eraser: EraserIcon,
  CropImage: CropIcon,
  FullviewSnapshot: CaptureIcon,
  ActionHistory: ListIcon,
  EncodePatient: LockIcon,
  DownloadManager: DownloadIcon,
  OpenFolder: FolderIcon,
  VideoConference: VideoIcon,
  FiveDReporting: ReportIcon,
  Share: ShareIcon,
  Close: CloseIcon,
  TextAnnotation: TextIcon,
  AILabeling: TagBrowserIcon,
  DoubleLength: LengthIcon,
  NASCET: AngleIcon,
  Volume: VolumeIcon,
  SpineLabel: SpineLabelingIcon,
};
"""

new_content = "".join(lines[:start_idx]) + new_icons + "".join(lines[end_idx:])

with open(target_file, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Successfully replaced lines {start_idx} to {end_idx}")
