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
    <circle cx="12" cy="12" r="2" fill="#22d3ee" stroke="none" />
  </svg>
);

const ZoomIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
    <circle cx="11" cy="11" r="3" fill="#22d3ee" opacity="0.4" stroke="none" />
  </svg>
);

const StackScrollIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="6" rx="1" stroke="#f5b301" />
    <rect x="4" y="10" width="16" height="4" rx="1" fill="#f5b301" opacity="0.8" />
    <rect x="4" y="16" width="16" height="6" rx="1" stroke="#f5b301" />
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
    <circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20" fill="#22d3ee" stroke="none" opacity="0.6"/>
  </svg>
);

const LengthIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="8" width="18" height="8" rx="1" stroke="#f5b301" />
    <line x1="6" y1="8" x2="6" y2="12" stroke="#22d3ee" strokeWidth="2" />
    <line x1="10" y1="8" x2="10" y2="10" stroke="#22d3ee" strokeWidth="2" />
    <line x1="14" y1="8" x2="14" y2="12" stroke="#22d3ee" strokeWidth="2" />
    <line x1="18" y1="8" x2="18" y2="10" stroke="#22d3ee" strokeWidth="2" />
  </svg>
);

const BidirectionalIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <line x1="4" y1="20" x2="20" y2="4"/><line x1="8" y1="8" x2="16" y2="16" stroke="#f5b301" strokeWidth="2" />
  </svg>
);

const EllipseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <ellipse cx="12" cy="12" rx="9" ry="6" strokeDasharray="3 3"/>
    <circle cx="12" cy="12" r="1.5" fill="#ec4899" stroke="none" />
  </svg>
);

const CircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="12" cy="12" r="9" strokeDasharray="3 3"/>
    <circle cx="12" cy="12" r="1.5" fill="#22d3ee" stroke="none" />
  </svg>
);

const RectangleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <rect x="3" y="5" width="18" height="14" rx="1" strokeDasharray="3 3"/>
    <circle cx="12" cy="12" r="1.5" fill="#f5b301" stroke="none" />
  </svg>
);

const AngleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 18 A 9 9 0 0 1 21 18 Z" stroke="#f5b301" />
    <line x1="12" y1="18" x2="16" y2="10" stroke="#22d3ee" strokeWidth="2" />
    <circle cx="12" cy="18" r="1.5" fill="#ec4899" stroke="none" />
    <path d="M8 18 A 4 4 0 0 1 12 14" stroke="#22d3ee" strokeDasharray="1 1" />
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
    <circle cx="5" cy="19" r="2.5" fill="#ec4899" stroke="none" />
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
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
    <circle cx="12" cy="12" r="2.5" fill="#f5b301" stroke="none" />
  </svg>
);

const RotateLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10" stroke="#ec4899" strokeWidth="2" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
  </svg>
);

const RotateRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" stroke="#ec4899" strokeWidth="2" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);

const FlipHIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <line x1="12" y1="2" x2="12" y2="22" stroke="#22d3ee" strokeDasharray="2 2" strokeWidth="2" />
    <polyline points="5 8 2 12 5 16"/><polyline points="19 8 22 12 19 16"/>
  </svg>
);

const FlipVIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <line x1="2" y1="12" x2="22" y2="12" stroke="#22d3ee" strokeDasharray="2 2" strokeWidth="2" />
    <polyline points="8 5 12 2 16 5"/><polyline points="8 19 12 22 16 19"/>
  </svg>
);

const InvertIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 0 0 20" fill="#f5b301" stroke="none" opacity="0.6"/>
  </svg>
);

const CaptureIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="#22d3ee"/>
    <circle cx="12" cy="13" r="4" stroke="#f5b301" strokeWidth="2" />
    <circle cx="12" cy="13" r="1" fill="#ec4899" stroke="none" />
  </svg>
);

const CineIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3" fill="#ec4899" opacity="0.8" stroke="none"/>
  </svg>
);

// MPR & Sync
const MPRIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <rect x="2" y="2" width="9" height="9" rx="1"/><rect x="13" y="2" width="9" height="9" rx="1"/><rect x="2" y="13" width="9" height="9" rx="1"/>
    <circle cx="17.5" cy="17.5" r="3.5" fill="#f5b301" stroke="none" />
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

const GalleryIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <circle cx="8.5" cy="8.5" r="1.5" fill="#f5b301" stroke="none" ></circle>
    <polyline points="21 15 16 10 5 21" stroke="#22d3ee" strokeWidth="2"></polyline>
  </svg>
);

const ReportIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const HistoryIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const ConfigIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

const AboutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);

// Layout
const Layout1x1Icon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <rect x="5" y="5" width="14" height="14" rx="1" fill="#00B5B8" opacity="0.3" stroke="none" />
  </svg>
);
const Layout1x2Icon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <line x1="12" y1="3" x2="12" y2="21" stroke="#f5b301" strokeWidth="2" />
  </svg>
);
const Layout2x1Icon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <line x1="3" y1="12" x2="21" y2="12" stroke="#f5b301" strokeWidth="2" />
  </svg>
);
const Layout2x2Icon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <line x1="12" y1="3" x2="12" y2="21" stroke="#ec4899" strokeWidth="1.6" />
    <line x1="3" y1="12" x2="21" y2="12" stroke="#ec4899" strokeWidth="1.6" />
  </svg>
);
const Layout3x3Icon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <line x1="9" y1="3" x2="9" y2="21" stroke="#22d3ee" /><line x1="15" y1="3" x2="15" y2="21" stroke="#22d3ee" />
    <line x1="3" y1="9" x2="21" y2="9" stroke="#22d3ee" /><line x1="3" y1="15" x2="21" y2="15" stroke="#22d3ee" />
  </svg>
);

// Export/Print
const PrintIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9"></polyline>
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
    <rect x="6" y="14" width="12" height="8"></rect>
  </svg>
);

const CDIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const PolygonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 22 8 18 20 6 20 2 8" strokeDasharray="2 2" />
    <circle cx="12" cy="12" r="2" fill="#22d3ee" stroke="none" />
  </svg>
);

const MirrorIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v20" stroke="#f5b301" strokeDasharray="3 3"/><path d="M8 6l-4 4 4 4"/><path d="M16 6l4 4-4 4"/>
  </svg>
);

const HeartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" fill="#ec4899" opacity="0.3"/>
  </svg>
);

const VideoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7" fill="#f5b301" opacity="0.8" stroke="none"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
);

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10" stroke="#22d3ee" strokeWidth="2"/><line x1="12" y1="15" x2="12" y2="3" stroke="#22d3ee" strokeWidth="2"/>
  </svg>
);

const FolderIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const TextIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>
  </svg>
);

const EraserIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 20H7L3 16C2.5 15.5 2.5 14.5 3 14L13 4C13.5 3.5 14.5 3.5 15 4L20 9C20.5 9.5 20.5 10.5 20 11L11 20" stroke="#22d3ee" />
    <path d="M15 4L20 9L11 18L6 13Z" fill="#ec4899" stroke="none" />
    <line x1="20" y1="20" x2="11" y2="20" stroke="#f5b301" strokeWidth="2" />
  </svg>
);

const CropIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="6" r="3" stroke="#ec4899" />
    <circle cx="6" cy="18" r="3" stroke="#ec4899" />
    <line x1="20" y1="4" x2="8.12" y2="15.88" stroke="#22d3ee" />
    <line x1="14.47" y1="14.48" x2="20" y2="20" stroke="#22d3ee" />
    <line x1="8.12" y1="8.12" x2="12" y2="12" stroke="#22d3ee" />
  </svg>
);

const BoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="12" x2="16" y2="12" strokeWidth="4" stroke="#22d3ee" />
    <circle cx="5" cy="10" r="2" fill="#22d3ee" stroke="none" />
    <circle cx="5" cy="14" r="2" fill="#22d3ee" stroke="none" />
    <circle cx="19" cy="10" r="2" fill="#22d3ee" stroke="none" />
    <circle cx="19" cy="14" r="2" fill="#22d3ee" stroke="none" />
  </svg>
);

const BrainIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4c-3-2-6 0-7 3a4 4 0 0 0-1 6c0 2 1.5 3 2 3 0 2 2 4 4 4 1 0 2-1 2-2s1 2 2 2c2 0 4-2 4-4 1 0 2-1 2-3a4 4 0 0 0-1-6c-1-3-4-5-7-3z" stroke="#ec4899" />
    <path d="M12 4v16" stroke="#22d3ee" strokeDasharray="2 2" />
  </svg>
);

const LungIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v6" stroke="#f5b301" strokeWidth="2" />
    <path d="M12 8l-3 3c-1.5 1.5-2 4-1 6 1 1.5 3 2 5 2V8z" stroke="#22d3ee" />
    <path d="M12 8l3 3c1.5 1.5 2 4 1 6-1 1.5-3 2-5 2V8z" stroke="#ec4899" />
  </svg>
);

const ListIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

const ShareIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" fill="#ec4899" opacity="0.2" stroke="none" />
    <line x1="15" y1="9" x2="9" y2="15" stroke="#ec4899" strokeWidth="2"/><line x1="9" y1="9" x2="15" y2="15" stroke="#ec4899" strokeWidth="2"/>
  </svg>
);

const Box3DIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    <path d="M12 12 l8.7 -5.05 v10 l-8.7 5.05 z" fill="#22d3ee" opacity="0.3" stroke="none" />
  </svg>
);

const AxialIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" opacity="0.3"/>
    <ellipse cx="12" cy="12" rx="9" ry="3" fill="#f5b301" opacity="0.5" stroke="none" />
    <line x1="2" y1="12" x2="22" y2="12"/>
  </svg>
);

const CoronalIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" opacity="0.3"/>
    <ellipse cx="12" cy="12" rx="3" ry="9" fill="#22d3ee" opacity="0.5" stroke="none" />
    <line x1="12" y1="2" x2="12" y2="22"/>
  </svg>
);

const CurvedIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12s5-8 9-8 9 8 9 8"/>
    <circle cx="12" cy="4" r="3.5" fill="#ec4899" stroke="none" />
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
  BrainMirror: MirrorIcon,
  VolumePolygon: PolygonIcon,
  Cardiopulmonary: HeartIcon,
  Mammography: CircleIcon,
  Reconstruction: Box3DIcon,
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
  '3D': Box3DIcon,
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
  Volume: Box3DIcon,
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
  const { toolbarService } = servicesManager.services || servicesManager;

  React.useEffect(() => {
    if (!toolbarService) return;
    const subscription = toolbarService.subscribe(
      toolbarService.EVENTS.TOOL_BAR_STATE_MODIFIED,
      (state: any) => {
        setToggledTools({ ...state.toggles });
        if (state.primaryToolId) {
          setActiveTool(state.primaryToolId);
        }
      }
    );
    // Initial state
    setToggledTools({ ...toolbarService.state.toggles });
    if (toolbarService.state.primaryToolId) {
      setActiveTool(toolbarService.state.primaryToolId);
    }
    return () => subscription.unsubscribe();
  }, [toolbarService]);

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToolClick = (item: MiniPacsTool) => {
    const effectiveId = item.commandName === 'toggleSync' ? 'StackImageSync' : item.id;
    const result = runMiniPacsTool(servicesManager, item, {
      toggledState: !toggledTools[effectiveId],
    });

    if (result.ok) {
      // State updates are now handled by toolbarService subscription
    }
  };



  // ── Rendering helpers ──

  const renderIconButton = (item: MiniPacsTool) => {
    const Icon = getIcon(item.id);
    const isActive = item.type === 'tool' && activeTool === item.id;
    const isToggled = item.type === 'toggle' && toggledTools[item.id];
    const isDisabled = ['backend', 'deferred-advanced', 'deferred-native', 'guarded'].includes(item.status);

    return (
      <button
        key={item.id}
        title={item.label + (isDisabled ? (item.status === 'deferred-native' ? ' (Requires native app)' : ' (Coming soon)') : '')}
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
    const isDisabled = ['backend', 'deferred-advanced', 'deferred-native', 'guarded'].includes(item.status);

    return (
      <button
        key={item.id}
        title={item.label + (isDisabled ? (item.status === 'deferred-native' ? ' (Requires native app)' : ' (Coming soon)') : '')}
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

