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
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Open hand / grab icon */}
    <path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12" stroke="#ffffff" strokeWidth="1.5" />
    <path d="M11 5.5v-2a1.5 1.5 0 0 1 3 0V12" stroke="#ffffff" strokeWidth="1.5" />
    <path d="M14 5.5a1.5 1.5 0 0 1 3 0V12" stroke="#ffffff" strokeWidth="1.5" />
    <path d="M17 7.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-2a7 7 0 0 1-7-7V9.5a1.5 1.5 0 0 1 3 0V12" stroke="#ffffff" strokeWidth="1.5" />
  </svg>
);

const ZoomIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Magnifying glass with + */}
    <circle cx="10" cy="10" r="7" stroke="#ffffff" strokeWidth="1.5" />
    <circle cx="10" cy="10" r="5" stroke="#ffffff" strokeWidth="0.5" opacity="0.3" />
    <line x1="15.5" y1="15.5" x2="21" y2="21" stroke="#ffffff" strokeWidth="2" />
    <line x1="10" y1="7" x2="10" y2="13" stroke="#ffffff" strokeWidth="1.5" />
    <line x1="7" y1="10" x2="13" y2="10" stroke="#ffffff" strokeWidth="1.5" />
  </svg>
);

const StackScrollIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Stack of DICOM slices with scroll indicator */}
    <rect x="5" y="2" width="14" height="4" rx="1" stroke="#ffffff" strokeWidth="1" opacity="0.35" />
    <rect x="4" y="6" width="16" height="4" rx="1" stroke="#ffffff" strokeWidth="1" opacity="0.55" />
    <rect x="3" y="10" width="18" height="5" rx="1" stroke="#ffffff" strokeWidth="1.5" fill="#ffffff" fillOpacity="0.1" />
    <rect x="4" y="16" width="16" height="4" rx="1" stroke="#ffffff" strokeWidth="1" opacity="0.55" />
    <rect x="5" y="20" width="14" height="2" rx="1" stroke="#ffffff" strokeWidth="1" opacity="0.35" />
    {/* Scroll arrows */}
    <path d="M21 6l1.5 2.5L21 11" stroke="#ffffff" strokeWidth="1" opacity="0.6" />
  </svg>
);

const MagnifyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Magnifying loupe with glass highlight */}
    <circle cx="10" cy="10" r="7" stroke="#ffffff" strokeWidth="1.5" />
    <circle cx="10" cy="10" r="4.5" stroke="#ffffff" strokeWidth="0.8" strokeDasharray="2 1.5" />
    <ellipse cx="8" cy="8" rx="2" ry="1.5" stroke="#ffffff" strokeWidth="0.5" opacity="0.4" transform="rotate(-30 8 8)" />
    <line x1="15" y1="15" x2="21" y2="21" stroke="#ffffff" strokeWidth="2.5" />
    <line x1="15" y1="15" x2="21" y2="21" stroke="#ffffff" strokeWidth="1.5" />
  </svg>
);

const WindowLevelIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Brightness/contrast dial */}
    <circle cx="12" cy="12" r="10" stroke="#ffffff" strokeWidth="1.5" />
    <path d="M12 2a10 10 0 0 1 0 20Z" fill="#ffffff" stroke="#ffffff" strokeWidth="1" />
    {/* Sun rays on bright side */}
    <line x1="12" y1="5" x2="12" y2="7" stroke="#000000" strokeWidth="1" />
    <line x1="16" y1="8" x2="14.5" y2="9.5" stroke="#000000" strokeWidth="1" />
    <line x1="17" y1="12" x2="15" y2="12" stroke="#000000" strokeWidth="1" />
  </svg>
);

const LengthIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Realistic ruler with tick marks and mm scale */}
    <rect x="1" y="8" width="22" height="8" rx="1" stroke="#ffffff" strokeWidth="1.2" fill="#ffffff" fillOpacity="0.08" />
    {/* Major ticks */}
    <line x1="4" y1="8" x2="4" y2="13" stroke="#ffffff" strokeWidth="1" />
    <line x1="12" y1="8" x2="12" y2="13" stroke="#ffffff" strokeWidth="1" />
    <line x1="20" y1="8" x2="20" y2="13" stroke="#ffffff" strokeWidth="1" />
    {/* Medium ticks */}
    <line x1="8" y1="8" x2="8" y2="11.5" stroke="#ffffff" strokeWidth="0.8" />
    <line x1="16" y1="8" x2="16" y2="11.5" stroke="#ffffff" strokeWidth="0.8" />
    {/* Minor ticks */}
    <line x1="6" y1="8" x2="6" y2="10.5" stroke="#ffffff" strokeWidth="0.5" />
    <line x1="10" y1="8" x2="10" y2="10.5" stroke="#ffffff" strokeWidth="0.5" />
    <line x1="14" y1="8" x2="14" y2="10.5" stroke="#ffffff" strokeWidth="0.5" />
    <line x1="18" y1="8" x2="18" y2="10.5" stroke="#ffffff" strokeWidth="0.5" />
    {/* Scale numbers */}
    <text x="3.5" y="15" fill="#ffffff" fontSize="3" fontFamily="monospace" opacity="0.7">0</text>
    <text x="11" y="15" fill="#ffffff" fontSize="3" fontFamily="monospace" opacity="0.7">5</text>
    <text x="18.5" y="15" fill="#ffffff" fontSize="3" fontFamily="monospace" opacity="0.7">10</text>
  </svg>
);

const BidirectionalIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Cross measurement - two perpendicular rulers with endpoints */}
    <line x1="3" y1="19" x2="21" y2="5" stroke="#ffffff" strokeWidth="1.5" />
    <line x1="7" y1="5" x2="17" y2="19" stroke="#ffffff" strokeWidth="1.5" />
    {/* Endpoint markers */}
    <circle cx="3" cy="19" r="1.5" fill="#ffffff" />
    <circle cx="21" cy="5" r="1.5" fill="#ffffff" />
    <circle cx="7" cy="5" r="1.5" fill="#ffffff" />
    <circle cx="17" cy="19" r="1.5" fill="#ffffff" />
    {/* Dimension lines */}
    <line x1="2" y1="3" x2="22" y2="3" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.4" />
  </svg>
);

const EllipseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Elliptical ROI with measurement handles */}
    <ellipse cx="12" cy="12" rx="9" ry="6" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="3 2" fill="#ffffff" fillOpacity="0.05" />
    {/* Handles at cardinal points */}
    <rect x="2" y="11" width="2" height="2" fill="#ffffff" rx="0.5" />
    <rect x="20" y="11" width="2" height="2" fill="#ffffff" rx="0.5" />
    <rect x="11" y="5" width="2" height="2" fill="#ffffff" rx="0.5" />
    <rect x="11" y="17" width="2" height="2" fill="#ffffff" rx="0.5" />
    {/* Crosshair center */}
    <line x1="10" y1="12" x2="14" y2="12" stroke="#ffffff" strokeWidth="0.5" opacity="0.5" />
    <line x1="12" y1="10" x2="12" y2="14" stroke="#ffffff" strokeWidth="0.5" opacity="0.5" />
  </svg>
);

const CircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Circle ROI with radius line */}
    <circle cx="12" cy="12" r="9" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="3 2" fill="#ffffff" fillOpacity="0.05" />
    {/* Radius line */}
    <line x1="12" y1="12" x2="19" y2="8" stroke="#ffffff" strokeWidth="1" />
    <circle cx="12" cy="12" r="1.5" fill="#ffffff" />
    {/* Radius endpoint */}
    <rect x="18" y="7" width="2" height="2" fill="#ffffff" rx="0.5" />
  </svg>
);

const RectangleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Rectangle ROI with corner handles */}
    <rect x="3" y="5" width="18" height="14" rx="1" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="3 2" fill="#ffffff" fillOpacity="0.05" />
    {/* Corner handles */}
    <rect x="2" y="4" width="2.5" height="2.5" fill="#ffffff" rx="0.5" />
    <rect x="19.5" y="4" width="2.5" height="2.5" fill="#ffffff" rx="0.5" />
    <rect x="2" y="17.5" width="2.5" height="2.5" fill="#ffffff" rx="0.5" />
    <rect x="19.5" y="17.5" width="2.5" height="2.5" fill="#ffffff" rx="0.5" />
  </svg>
);

const AngleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Protractor / angle measurement tool */}
    {/* Base arc */}
    <path d="M4 20 A 12 12 0 0 1 20 20" stroke="#ffffff" strokeWidth="1" opacity="0.3" />
    {/* Angle arms */}
    <line x1="4" y1="20" x2="20" y2="20" stroke="#ffffff" strokeWidth="1.5" />
    <line x1="4" y1="20" x2="16" y2="5" stroke="#ffffff" strokeWidth="1.5" />
    {/* Angle arc */}
    <path d="M9 20 A 5 5 0 0 1 8.2 15" stroke="#ffffff" strokeWidth="1.2" />
    {/* Degree text */}
    <text x="10" y="18" fill="#ffffff" fontSize="4" fontFamily="monospace" opacity="0.7">°</text>
    {/* Vertex dot */}
    <circle cx="4" cy="20" r="1.5" fill="#ffffff" />
  </svg>
);

const CalibrationIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Calibration line (ruler with known distance) */}
    <line x1="4" y1="12" x2="20" y2="12" stroke="#ffffff" strokeWidth="1.5" />
    <line x1="4" y1="8" x2="4" y2="16" stroke="#ffffff" strokeWidth="1.5" />
    <line x1="20" y1="8" x2="20" y2="16" stroke="#ffffff" strokeWidth="1.5" />
    {/* Middle tick mark */}
    <line x1="12" y1="10" x2="12" y2="14" stroke="#ffffff" strokeWidth="1" />
    {/* Small inner ticks */}
    <line x1="8" y1="11" x2="8" y2="13" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" />
    <line x1="16" y1="11" x2="16" y2="13" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" />
  </svg>
);

const ArrowAnnotateIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Arrow pointer with text label bubble */}
    <line x1="4" y1="20" x2="14" y2="10" stroke="#ffffff" strokeWidth="1.5" />
    <polygon points="14,10 10,11 11,14" fill="#ffffff" stroke="#ffffff" strokeWidth="0.5" />
    {/* Label bubble */}
    <rect x="14" y="3" width="8" height="5" rx="1.5" stroke="#ffffff" strokeWidth="1" fill="#ffffff" fillOpacity="0.1" />
    <line x1="16" y1="5" x2="20" y2="5" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" />
    <line x1="16" y1="6.5" x2="19" y2="6.5" stroke="#ffffff" strokeWidth="0.8" opacity="0.4" />
  </svg>
);

const ProbeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Pixel probe / pipette with crosshair */}
    <circle cx="12" cy="12" r="3" stroke="#ffffff" strokeWidth="1" />
    <circle cx="12" cy="12" r="1" fill="#ffffff" />
    <line x1="12" y1="2" x2="12" y2="8" stroke="#ffffff" strokeWidth="1.2" />
    <line x1="12" y1="16" x2="12" y2="22" stroke="#ffffff" strokeWidth="1.2" />
    <line x1="2" y1="12" x2="8" y2="12" stroke="#ffffff" strokeWidth="1.2" />
    <line x1="16" y1="12" x2="22" y2="12" stroke="#ffffff" strokeWidth="1.2" />
    {/* Value readout */}
    <rect x="16" y="2" width="6" height="4" rx="1" stroke="#ffffff" strokeWidth="0.7" fill="#ffffff" fillOpacity="0.1" />
    <text x="17" y="4.8" fill="#ffffff" fontSize="3" fontFamily="monospace" opacity="0.7">HU</text>
  </svg>
);

const FreehandIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Freehand drawing pen with curved path */}
    {/* Pen body */}
    <path d="M17 3l4 4-10 10H7v-4L17 3z" stroke="#ffffff" strokeWidth="1.2" fill="#ffffff" fillOpacity="0.05" />
    <line x1="14" y1="6" x2="18" y2="10" stroke="#ffffff" strokeWidth="0.8" />
    {/* Freehand curve below */}
    <path d="M3 20c3-1 5-3 8-2s4 2 7 0" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="2 1.5" fill="none" />
  </svg>
);

const ResetIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Reset / restore icon with circular arrow */}
    <path d="M3 12a9 9 0 1 1 3 6.7" stroke="#ffffff" strokeWidth="1.5" />
    <polyline points="3 18 3 12 9 12" stroke="#ffffff" strokeWidth="1.5" />
    {/* Center square = original state */}
    <rect x="9" y="9" width="6" height="6" rx="1" stroke="#ffffff" strokeWidth="1" fill="#ffffff" fillOpacity="0.15" />
  </svg>
);

const RotateLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Rotate left with image frame */}
    <rect x="5" y="5" width="14" height="14" rx="2" stroke="#ffffff" strokeWidth="1" opacity="0.4" transform="rotate(-15 12 12)" />
    <rect x="5" y="5" width="14" height="14" rx="2" stroke="#ffffff" strokeWidth="1.2" fill="#ffffff" fillOpacity="0.05" />
    <path d="M8 3 A 10 10 0 0 0 3 8" stroke="#ffffff" strokeWidth="1.5" />
    <polyline points="3 4 3 8 7 8" stroke="#ffffff" strokeWidth="1.5" fill="none" />
  </svg>
);

const RotateRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Rotate right with image frame */}
    <rect x="5" y="5" width="14" height="14" rx="2" stroke="#ffffff" strokeWidth="1" opacity="0.4" transform="rotate(15 12 12)" />
    <rect x="5" y="5" width="14" height="14" rx="2" stroke="#ffffff" strokeWidth="1.2" fill="#ffffff" fillOpacity="0.05" />
    <path d="M16 3 A 10 10 0 0 1 21 8" stroke="#ffffff" strokeWidth="1.5" />
    <polyline points="21 4 21 8 17 8" stroke="#ffffff" strokeWidth="1.5" fill="none" />
  </svg>
);

const FlipHIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Flip horizontal - mirrored triangles */}
    <line x1="12" y1="2" x2="12" y2="22" stroke="#ffffff" strokeWidth="1" strokeDasharray="3 2" opacity="0.5" />
    {/* Left triangle (solid) */}
    <polygon points="10,6 3,12 10,18" fill="#ffffff" fillOpacity="0.2" stroke="#ffffff" strokeWidth="1.2" />
    {/* Right triangle (outline only = mirror) */}
    <polygon points="14,6 21,12 14,18" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeDasharray="2 1.5" />
  </svg>
);

const FlipVIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Flip vertical - mirrored triangles */}
    <line x1="2" y1="12" x2="22" y2="12" stroke="#ffffff" strokeWidth="1" strokeDasharray="3 2" opacity="0.5" />
    {/* Top triangle (solid) */}
    <polygon points="6,10 12,3 18,10" fill="#ffffff" fillOpacity="0.2" stroke="#ffffff" strokeWidth="1.2" />
    {/* Bottom triangle (outline only = mirror) */}
    <polygon points="6,14 12,21 18,14" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeDasharray="2 1.5" />
  </svg>
);

const InvertIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Invert colors - yin-yang style */}
    <circle cx="12" cy="12" r="10" stroke="#ffffff" strokeWidth="1.5" />
    <path d="M12 2a10 10 0 0 0 0 20Z" fill="#ffffff" />
    {/* Contrast indicators */}
    <circle cx="12" cy="7" r="1.5" fill="#000000" />
    <circle cx="12" cy="17" r="1.5" fill="#ffffff" stroke="#ffffff" strokeWidth="0.5" />
  </svg>
);

const CaptureIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Camera with lens detail */}
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="#ffffff" strokeWidth="1.2" fill="#ffffff" fillOpacity="0.05" />
    <circle cx="12" cy="13" r="4" stroke="#ffffff" strokeWidth="1.2" />
    <circle cx="12" cy="13" r="2" stroke="#ffffff" strokeWidth="0.8" fill="#ffffff" fillOpacity="0.15" />
    {/* Flash indicator */}
    <circle cx="18" cy="8" r="1" fill="#ffffff" opacity="0.5" />
  </svg>
);

const CineIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Film reel / cine playback */}
    <circle cx="12" cy="12" r="10" stroke="#ffffff" strokeWidth="1.2" />
    <circle cx="12" cy="12" r="6" stroke="#ffffff" strokeWidth="0.8" opacity="0.3" />
    {/* Play triangle */}
    <polygon points="10,7 18,12 10,17" fill="#ffffff" fillOpacity="0.9" stroke="none" />
    {/* Film sprockets */}
    <circle cx="12" cy="2.5" r="1" fill="#ffffff" opacity="0.5" />
    <circle cx="12" cy="21.5" r="1" fill="#ffffff" opacity="0.5" />
    <circle cx="2.5" cy="12" r="1" fill="#ffffff" opacity="0.5" />
    <circle cx="21.5" cy="12" r="1" fill="#ffffff" opacity="0.5" />
  </svg>
);

const MPRIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* 3-plane MPR cube with colored planes */}
    {/* Axial plane (top) */}
    <polygon points="4,8 12,4 20,8 12,12" fill="#60a5fa" fillOpacity="0.3" stroke="#60a5fa" strokeWidth="1" />
    {/* Sagittal plane (right) */}
    <polygon points="20,8 20,16 12,20 12,12" fill="#f87171" fillOpacity="0.25" stroke="#f87171" strokeWidth="1" />
    {/* Coronal plane (left) */}
    <polygon points="4,8 4,16 12,20 12,12" fill="#4ade80" fillOpacity="0.25" stroke="#4ade80" strokeWidth="1" />
  </svg>
);

const CrosshairsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Crosshair scope with RGB lines */}
    <circle cx="12" cy="12" r="8" stroke="#ffffff" strokeWidth="1" opacity="0.4" />
    <circle cx="12" cy="12" r="4" stroke="#ffffff" strokeWidth="0.8" opacity="0.3" />
    {/* Colored crosshair lines */}
    <line x1="12" y1="2" x2="12" y2="8" stroke="#60a5fa" strokeWidth="1.5" />
    <line x1="12" y1="16" x2="12" y2="22" stroke="#60a5fa" strokeWidth="1.5" />
    <line x1="2" y1="12" x2="8" y2="12" stroke="#f87171" strokeWidth="1.5" />
    <line x1="16" y1="12" x2="22" y2="12" stroke="#f87171" strokeWidth="1.5" />
    {/* Center dot */}
    <circle cx="12" cy="12" r="1.5" fill="#4ade80" />
  </svg>
);

const ReferenceLinesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Reference lines on viewport frame */}
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="#ffffff" strokeWidth="1" opacity="0.3" />
    <line x1="3" y1="9" x2="21" y2="15" stroke="#f59e0b" strokeWidth="1.5" />
    <line x1="3" y1="15" x2="21" y2="9" stroke="#f59e0b" strokeWidth="1.5" />
    {/* Small triangle indicators */}
    <polygon points="2,8 2,10 4,9" fill="#f59e0b" opacity="0.7" />
    <polygon points="22,14 22,16 20,15" fill="#f59e0b" opacity="0.7" />
  </svg>
);

const StackSyncIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Sync chain link */}
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="#ffffff" strokeWidth="1.5" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="#ffffff" strokeWidth="1.5" />
    {/* Sync arrows */}
    <path d="M7 3l-2 2 2 2" stroke="#ffffff" strokeWidth="1" opacity="0.6" />
    <path d="M17 17l2 2-2 2" stroke="#ffffff" strokeWidth="1" opacity="0.6" />
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

// Dedicated Caliper Icon (Vernier Caliper - separate from CalibrationIcon)
const CaliperIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Vernier caliper body - horizontal beam */}
    <rect x="1" y="9" width="22" height="3" rx="0.5" stroke="#ffffff" strokeWidth="1" fill="#ffffff" fillOpacity="0.08" />
    {/* Fixed jaw (left tall jaw) */}
    <rect x="1" y="4" width="2.5" height="16" rx="0.5" stroke="#ffffff" strokeWidth="1.2" fill="#ffffff" fillOpacity="0.12" />
    {/* Movable jaw (right) */}
    <rect x="14" y="4" width="2.5" height="13" rx="0.5" stroke="#ffffff" strokeWidth="1.2" fill="#ffffff" fillOpacity="0.15" />
    {/* Inner jaws (smaller, pointing inward at top) */}
    <line x1="3.5" y1="5" x2="3.5" y2="9" stroke="#ffffff" strokeWidth="1" />
    <line x1="14" y1="5" x2="14" y2="9" stroke="#ffffff" strokeWidth="1" />
    {/* Main scale ticks */}
    <line x1="6" y1="9" x2="6" y2="10.5" stroke="#ffffff" strokeWidth="0.5" />
    <line x1="8" y1="9" x2="8" y2="11" stroke="#ffffff" strokeWidth="0.5" />
    <line x1="10" y1="9" x2="10" y2="10.5" stroke="#ffffff" strokeWidth="0.5" />
    <line x1="12" y1="9" x2="12" y2="11" stroke="#ffffff" strokeWidth="0.5" />
    <line x1="19" y1="9" x2="19" y2="10.5" stroke="#ffffff" strokeWidth="0.5" />
    <line x1="21" y1="9" x2="21" y2="11" stroke="#ffffff" strokeWidth="0.5" />
    {/* Depth rod extending right */}
    <line x1="16.5" y1="10.5" x2="23" y2="10.5" stroke="#ffffff" strokeWidth="0.8" />
    {/* Lock screw */}
    <circle cx="15.25" cy="19" r="1" stroke="#ffffff" strokeWidth="0.7" fill="#ffffff" fillOpacity="0.2" />
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

// --- Phase 3 Advanced Icons ---

const DisplayImageOnlyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="14" rx="2" stroke="#ffffff" strokeWidth="1.5" fill="#ffffff" fillOpacity="0.1" />
    <path d="M8 22h8" stroke="#ffffff" strokeWidth="1.5" />
    <path d="M12 18v4" stroke="#ffffff" strokeWidth="1.5" />
    <polyline points="7 10 7 7 10 7" stroke="#ffffff" strokeWidth="1.2" opacity="0.7" />
    <polyline points="17 14 17 17 14 17" stroke="#ffffff" strokeWidth="1.2" opacity="0.7" />
  </svg>
);

const Zoom100Icon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="10" r="8" stroke="#ffffff" strokeWidth="1.2" fill="#ffffff" fillOpacity="0.05" />
    <line x1="16" y1="16" x2="22" y2="22" stroke="#ffffff" strokeWidth="2.5" />
    <text x="6" y="12.5" fill="#ffffff" fontSize="6.5" fontFamily="sans-serif" fontWeight="bold">1:1</text>
  </svg>
);

const ActualSizeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="8" width="20" height="8" rx="1" stroke="#ffffff" strokeWidth="1.2" fill="#ffffff" fillOpacity="0.1" />
    <line x1="6" y1="8" x2="6" y2="12" stroke="#ffffff" strokeWidth="1" />
    <line x1="12" y1="8" x2="12" y2="14" stroke="#ffffff" strokeWidth="1.2" />
    <line x1="18" y1="8" x2="18" y2="12" stroke="#ffffff" strokeWidth="1" />
    <text x="10" y="16.5" fill="#ffffff" fontSize="4.5" fontFamily="monospace">1X</text>
  </svg>
);

const MonitorCineIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="14" rx="2" stroke="#ffffff" strokeWidth="1.2" />
    <line x1="8" y1="22" x2="16" y2="22" stroke="#ffffff" strokeWidth="1.5" />
    <line x1="12" y1="18" x2="12" y2="22" stroke="#ffffff" strokeWidth="1.5" />
    <polygon points="10 8 16 11 10 14" fill="#ffffff" />
  </svg>
);

const AutoScrollIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <rect x="7" y="5" width="10" height="14" rx="5" stroke="#ffffff" strokeWidth="1.2" />
    <line x1="12" y1="8" x2="12" y2="11" stroke="#ffffff" strokeWidth="1.5" />
    <polyline points="15 15 12 18 9 15" stroke="#ffffff" strokeWidth="1.2" />
    <polyline points="15 3 12 0 9 3" stroke="#ffffff" strokeWidth="1.2" />
  </svg>
);

const EllipseShutterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="2" stroke="#ffffff" strokeWidth="1.2" fill="url(#diagonal-hatch)" />
    <ellipse cx="12" cy="12" rx="6" ry="4" stroke="#ffffff" strokeWidth="1.5" fill="#000000" />
    <defs>
      <pattern id="diagonal-hatch" width="4" height="4" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="4" stroke="#ffffff" strokeWidth="0.5" opacity="0.3" />
      </pattern>
    </defs>
  </svg>
);

const RectangleShutterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="2" stroke="#ffffff" strokeWidth="1.2" fill="url(#diagonal-hatch-rect)" />
    <rect x="6" y="6" width="12" height="12" rx="1" stroke="#ffffff" strokeWidth="1.5" fill="#000000" />
    <defs>
      <pattern id="diagonal-hatch-rect" width="4" height="4" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="4" stroke="#ffffff" strokeWidth="0.5" opacity="0.3" />
      </pattern>
    </defs>
  </svg>
);

const PolylineShutterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="2" stroke="#ffffff" strokeWidth="1.2" fill="url(#diagonal-hatch-poly)" />
    <polygon points="12,5 18,10 15,18 8,15 6,10" stroke="#ffffff" strokeWidth="1.5" fill="#000000" />
    <defs>
      <pattern id="diagonal-hatch-poly" width="4" height="4" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="4" stroke="#ffffff" strokeWidth="0.5" opacity="0.3" />
      </pattern>
    </defs>
  </svg>
);

const FilterSharpenIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4,16 9,7 15,19 20,4" stroke="#ffffff" strokeWidth="1.5" />
    <circle cx="9" cy="7" r="1.5" fill="#ffffff" />
    <circle cx="20" cy="4" r="1.5" fill="#ffffff" />
  </svg>
);

const FilterAverageIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 18 C 8 18, 6 6, 12 6 C 18 6, 16 18, 21 18" stroke="#ffffff" strokeWidth="2" opacity="0.7" />
    <path d="M3 18 C 8 18, 6 6, 12 6 C 18 6, 16 18, 21 18" stroke="#ffffff" strokeWidth="1" filter="blur(1px)" />
  </svg>
);

const PseudoColorIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="#ffffff" strokeWidth="1" />
    <path d="M2 12A10 10 0 0 0 12 22V2A10 10 0 0 0 2 12Z" fill="#ef4444" opacity="0.8" />
    <path d="M12 22A10 10 0 0 0 22 12H2A10 10 0 0 0 12 22Z" fill="#3b82f6" opacity="0.8" />
    <path d="M22 12A10 10 0 0 0 12 2V22A10 10 0 0 0 22 12Z" fill="#eab308" opacity="0.8" />
  </svg>
);

const CTRatioIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="8" stroke="#ffffff" strokeWidth="1.2" strokeDasharray="2 1" />
    <circle cx="12" cy="12" r="4" stroke="#ffffff" strokeWidth="1.2" />
    <line x1="4" y1="12" x2="20" y2="12" stroke="#ffffff" strokeWidth="1" opacity="0.5" />
    <text x="7" y="11" fill="#ffffff" fontSize="4" fontFamily="monospace">A</text>
    <text x="15" y="11" fill="#ffffff" fontSize="4" fontFamily="monospace">B</text>
  </svg>
);

const LLDIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <line x1="6" y1="4" x2="6" y2="20" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
    <line x1="14" y1="4" x2="14" y2="16" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    <line x1="2" y1="4" x2="18" y2="4" stroke="#ffffff" strokeWidth="1" strokeDasharray="2 2" />
    <line x1="2" y1="20" x2="10" y2="20" stroke="#ffffff" strokeWidth="1" strokeDasharray="2 2" />
    <line x1="10" y1="16" x2="18" y2="16" stroke="#ffffff" strokeWidth="1" strokeDasharray="2 2" />
  </svg>
);

const ProfileGraphIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 20 21 20" stroke="#ffffff" strokeWidth="1.5" />
    <polyline points="3 20 3 4" stroke="#ffffff" strokeWidth="1.5" />
    <path d="M3 15 Q 8 15 12 8 T 21 12" stroke="#4ade80" strokeWidth="1.5" />
  </svg>
);

const Table2DIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="#ffffff" strokeWidth="1.5" />
    <line x1="3" y1="9" x2="21" y2="9" stroke="#ffffff" strokeWidth="1.5" />
    <line x1="3" y1="15" x2="21" y2="15" stroke="#ffffff" strokeWidth="1.5" />
    <line x1="9" y1="3" x2="9" y2="21" stroke="#ffffff" strokeWidth="1.5" />
    <line x1="15" y1="3" x2="15" y2="21" stroke="#ffffff" strokeWidth="1.5" />
  </svg>
);

const CenterLineIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <line x1="6" y1="4" x2="6" y2="20" stroke="#ffffff" strokeWidth="1" opacity="0.4" />
    <line x1="18" y1="4" x2="18" y2="20" stroke="#ffffff" strokeWidth="1" opacity="0.4" />
    <line x1="12" y1="4" x2="12" y2="20" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="3 3" />
  </svg>
);

const CenterLineAngleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <line x1="6" y1="4" x2="18" y2="20" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="3 3" />
    <line x1="18" y1="4" x2="6" y2="20" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="3 3" />
    <path d="M12 8 A 4 4 0 0 1 15.5 12" stroke="#ffffff" strokeWidth="1" />
  </svg>
);

const MultipleCircleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="4" stroke="#ffffff" strokeWidth="1.2" />
    <circle cx="16" cy="16" r="4" stroke="#ffffff" strokeWidth="1.2" />
    <circle cx="16" cy="8" r="4" stroke="#ffffff" strokeWidth="1.2" opacity="0.4" />
  </svg>
);

const MultipleCobbIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="6" x2="20" y2="10" stroke="#ffffff" strokeWidth="1.2" />
    <line x1="4" y1="18" x2="20" y2="14" stroke="#ffffff" strokeWidth="1.2" />
    <path d="M10 8 Q 12 12 10 16" stroke="#4ade80" strokeWidth="1.5" strokeDasharray="2 2" />
    <path d="M14 9 Q 16 12 14 15" stroke="#f87171" strokeWidth="1.5" strokeDasharray="2 2" />
  </svg>
);

const CurveIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20 Q 12 4 20 20" stroke="#ffffff" strokeWidth="1.5" />
    <circle cx="4" cy="20" r="1.5" fill="#ffffff" />
    <circle cx="12" cy="12" r="1.5" fill="#ffffff" />
    <circle cx="20" cy="20" r="1.5" fill="#ffffff" />
  </svg>
);

const AcetabularAngleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="12" x2="20" y2="12" stroke="#ffffff" strokeWidth="1" strokeDasharray="2 2" />
    <line x1="12" y1="12" x2="4" y2="6" stroke="#ffffff" strokeWidth="1.5" />
    <line x1="12" y1="12" x2="20" y2="6" stroke="#ffffff" strokeWidth="1.5" />
    <path d="M8 9 A 6 6 0 0 0 16 9" stroke="#ffffff" strokeWidth="1" />
  </svg>
);

const SpineBalanceIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="4" x2="12" y2="20" stroke="#4ade80" strokeWidth="1.2" />
    <circle cx="12" cy="4" r="1.5" fill="#ffffff" />
    <path d="M14 6 Q 16 12 14 18" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="2 2" />
    <line x1="12" y1="18" x2="14" y2="18" stroke="#ffffff" strokeWidth="1" />
  </svg>
);

const SpinePelvicIncidenceIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="16" cy="16" r="3" stroke="#ffffff" strokeWidth="1" />
    <line x1="8" y1="8" x2="16" y2="16" stroke="#ffffff" strokeWidth="1.5" />
    <line x1="8" y1="8" x2="12" y2="2" stroke="#ffffff" strokeWidth="1.5" />
    <path d="M12 6 A 4 4 0 0 1 14 10" stroke="#ffffff" strokeWidth="1" />
  </svg>
);

const ParallelLineIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <line x1="6" y1="4" x2="18" y2="8" stroke="#ffffff" strokeWidth="1.5" />
    <line x1="6" y1="16" x2="18" y2="20" stroke="#ffffff" strokeWidth="1.5" />
    <line x1="12" y1="6" x2="12" y2="18" stroke="#ffffff" strokeWidth="1" strokeDasharray="2 2" />
  </svg>
);

const CobbAngleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="8" x2="20" y2="12" stroke="#ffffff" strokeWidth="1.5" />
    <line x1="4" y1="16" x2="20" y2="12" stroke="#ffffff" strokeWidth="1.5" />
    <path d="M12 9.5 Q 15 12 12 14.5" stroke="#4ade80" strokeWidth="1.5" strokeDasharray="2 2" />
  </svg>
);

const FusionMPRIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Base CT scan */}
    <rect x="4" y="4" width="12" height="12" rx="1" stroke="#94a3b8" strokeWidth="1.2" fill="#e2e8f0" fillOpacity="0.1" />
    {/* Overlapping PET/Color fusion */}
    <rect x="8" y="8" width="12" height="12" rx="1" stroke="#f43f5e" strokeWidth="1.2" fill="#f43f5e" fillOpacity="0.2" />
    {/* Fusion connection */}
    <line x1="10" y1="10" x2="14" y2="14" stroke="#ffffff" strokeWidth="1.5" />
  </svg>
);

const ReportWorkspaceIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="#ffffff" strokeWidth="1.2" />
    <line x1="11" y1="3" x2="11" y2="21" stroke="#ffffff" strokeWidth="1.2" />
    {/* Viewer side */}
    <rect x="5" y="6" width="4" height="4" rx="0.5" stroke="#ffffff" strokeWidth="1" />
    <rect x="5" y="12" width="4" height="4" rx="0.5" stroke="#ffffff" strokeWidth="1" />
    {/* Report side lines */}
    <line x1="14" y1="7" x2="19" y2="7" stroke="#ffffff" strokeWidth="1" />
    <line x1="14" y1="11" x2="19" y2="11" stroke="#ffffff" strokeWidth="1" />
    <line x1="14" y1="15" x2="17" y2="15" stroke="#ffffff" strokeWidth="1" />
  </svg>
);

const DiagnosticsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {/* Gear base */}
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="#ffffff" strokeWidth="1.5" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke="#ffffff" strokeWidth="1.2" opacity="0.6" />
    {/* Stethoscope/Medical node inside */}
    <circle cx="12" cy="12" r="1.5" fill="#4ade80" />
  </svg>
);

const SelectAllIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="6" height="6" rx="1" stroke="#ffffff" strokeWidth="1.2" fill="#ffffff" fillOpacity="0.4" />
    <rect x="14" y="4" width="6" height="6" rx="1" stroke="#ffffff" strokeWidth="1.2" fill="#ffffff" fillOpacity="0.4" />
    <rect x="4" y="14" width="6" height="6" rx="1" stroke="#ffffff" strokeWidth="1.2" fill="#ffffff" fillOpacity="0.4" />
    <rect x="14" y="14" width="6" height="6" rx="1" stroke="#ffffff" strokeWidth="1.2" fill="#ffffff" fillOpacity="0.4" />
  </svg>
);

const SelectInverseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="6" height="6" rx="1" stroke="#ffffff" strokeWidth="1.2" fill="#ffffff" fillOpacity="0.4" />
    <rect x="14" y="4" width="6" height="6" rx="1" stroke="#ffffff" strokeWidth="1.2" />
    <rect x="4" y="14" width="6" height="6" rx="1" stroke="#ffffff" strokeWidth="1.2" />
    <rect x="14" y="14" width="6" height="6" rx="1" stroke="#ffffff" strokeWidth="1.2" fill="#ffffff" fillOpacity="0.4" />
  </svg>
);

const SelectSetIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="6" width="12" height="12" rx="1" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="3 2" />
    <circle cx="12" cy="12" r="2" fill="#ffffff" />
  </svg>
);

const RefreshExamIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 4v5h-5" stroke="#ffffff" strokeWidth="1.5" />
    <path d="M4 20v-5h5" stroke="#ffffff" strokeWidth="1.5" />
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L4 9" stroke="#ffffff" strokeWidth="1.5" />
    <path d="M3.51 15A9 9 0 0 0 18.36 18.36L20 15" stroke="#ffffff" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="3" fill="#ffffff" fillOpacity="0.2" />
  </svg>
);

const ApplyHPIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="14" rx="2" stroke="#ffffff" strokeWidth="1.2" />
    <line x1="12" y1="3" x2="12" y2="17" stroke="#ffffff" strokeWidth="1.2" />
    <polyline points="9 21 12 24 15 21" stroke="#ffffff" strokeWidth="1.5" />
    <line x1="12" y1="17" x2="12" y2="23" stroke="#ffffff" strokeWidth="1.5" />
  </svg>
);

const AdvancedThumbnailIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" stroke="#ffffff" strokeWidth="1.2" />
    <rect x="14" y="3" width="7" height="7" rx="1" stroke="#ffffff" strokeWidth="1.2" />
    <rect x="3" y="14" width="7" height="7" rx="1" stroke="#ffffff" strokeWidth="1.2" />
    <circle cx="17.5" cy="17.5" r="2.5" fill="#ffffff" />
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
  Caliper: CaliperIcon,
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

  // Phase 3 Tool Mappings
  DisplayImageOnly: DisplayImageOnlyIcon,
  Zoom100: Zoom100Icon,
  ActualSize: ActualSizeIcon,
  SelectAll: SelectAllIcon,
  SelectAllInverse: SelectInverseIcon,
  SelectImageSet: SelectSetIcon,
  MonitorCine: MonitorCineIcon,
  AutoScroll: AutoScrollIcon,
  RefreshExam: RefreshExamIcon,
  AutoRefresh: RefreshExamIcon, // Reusing refresh
  ApplyPreviousHP: ApplyHPIcon,
  ApplyNextHP: ApplyHPIcon,
  AdvancedThumbnail: AdvancedThumbnailIcon,
  EllipseShutter: EllipseShutterIcon,
  RectangleShutter: RectangleShutterIcon,
  PolylineShutter: PolylineShutterIcon,
  FilterSharpen: FilterSharpenIcon,
  FilterAverage: FilterAverageIcon,
  PseudoColor: PseudoColorIcon,
  CTRatio: CTRatioIcon,
  CTRatio2: CTRatioIcon,
  LLD: LLDIcon,
  Profile: ProfileGraphIcon,
  Table2D: Table2DIcon,
  TimeIntensityCurve: ProfileGraphIcon, // Reusing profile graph for time intensity
  CenterLine: CenterLineIcon,
  CenterLineAngle: CenterLineAngleIcon,
  MultipleCircle: MultipleCircleIcon,
  MultipleCobb: MultipleCobbIcon,
  Curve: CurveIcon,
  AcetabularAngle: AcetabularAngleIcon,
  SpineBalance: SpineBalanceIcon,
  SpinePelvicIncidence: SpinePelvicIncidenceIcon,
  ParallelLine: ParallelLineIcon,
  CobbAngle: CobbAngleIcon,
  FusionMPR: FusionMPRIcon,
  ReportWorkspace: ReportWorkspaceIcon,
  Diagnostics: DiagnosticsIcon,
  SaveSnapshot: CaptureIcon,
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
        aria-disabled={isDisabled}
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
        aria-disabled={isDisabled}
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

