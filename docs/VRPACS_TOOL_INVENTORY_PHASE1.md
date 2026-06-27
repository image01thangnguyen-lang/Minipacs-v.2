# VRPACS Tool Inventory - Phase 1

Updated: 2026-06-27

## Scope

This inventory was collected from the user-authorized VRPACS viewer session in the in-app browser. It is a UI and behavior inventory only: we are not copying vendor source code or assets. The goal is to reproduce equivalent MiniPACS workstation behavior with our own OHIF/Cornerstone implementation.

Observed totals:

- 10 left-panel sections.
- 98 visible labeled controls.
- 91 unique visible labels/tooltips.
- Main areas: top toolbar, left tool accordion, history/series rail, viewport overlay, per-viewport mini tools, dropdown menus.

## Top Toolbar

| Group | Observed controls |
| --- | --- |
| Brand/session | VR-PACS VIEWER, checkbox/state indicator |
| Navigation/image | Default, pointer/select, WW/WL, Zoom, Pan, Scroll/layers |
| Measurement | Length |
| 3D/MPR | Build 3D MPR view, 3D-MPR, MIP |
| Playback/annotation | Cine, Arrow, Eraser, Reset |
| Workflow | Share, Print, Video Conference, 5D reporting, Report, History, Close |

## Left Panel Sections

| Section | Observed controls/content |
| --- | --- |
| History | Study rows by modality/date/time, expand/collapse controls, current/previous count badge, series thumbnails, key image marker, Word/report file item |
| Layout | 1x1, 1x2, 2x1, custom grid |
| Measurement Tools | Length, Caliper, Point, Angle, Angle Vector, Rectangle ROI, Elliptical ROI, Polygon ROI, Mirror ROI |
| Advance Tools | Double Length, NASCET/ESCT, Volume, Brain Mirror, Volume Polygon, Cardiopulmonary, Mammography, Reconstruction, Export All Video |
| Image Tools | Rotate -90, Rotate +90, Flip-H, Flip-V, Free Rotate, Invert color, Magnify |
| Sync Tools | Auto synchronize scrolling, Reference line, Crosshair 3D, Zoom/Pan synchronize, WW/WL synchronize, Manual synchronize scrolling |
| MPR Tools | Axial, Coronal, Sagittal, MIP, 3D, Compare patients on MPR, MPR Curved, Fusion on MPR |
| Annotation Tools | Text Annotation, Arrow, Text Marker Image, AI labeling |
| Capture Tools | Crop Image, Save Image, Gallery, Fullview Snapshot |
| More Tools | Action history, Encode patient, Hide/show DICOM tags, Download manager, Open folder, PACS Config, Print, Config user, About |

## Viewport And Series Behavior

| Area | Observed behavior |
| --- | --- |
| Series rail | Narrow thumbnail column between left tools and viewport, active series highlighted, each item shows series index/name/image count |
| Viewport layout | 1x2 active in the inspected US case, active viewport border in yellow/orange |
| Viewport overlay | Series Index, Image current/total, acquisition timer, patient/study burned-in info from image, zoom, WW/WL, series/body-part text |
| Per-viewport mini toolbar | Copy/export, fullscreen, brightness/window, link/sync controls, overflow menu |
| Color preset | Per-viewport color dropdown, visible value `Default` |

## Dropdowns And Menus

| Menu | Observed entries |
| --- | --- |
| WW/WL presets | Default; Head and Neck: Brain F1, Subdural F2, Stroke F3, Temporal bones F4, Soft tissues F6; Chest: Lung F7, Mediastinum F8; Abdomen: Soft tissues F9, Liver F10; Spine: Soft tissues, Bone |
| MIP/unit dropdown | Unit mm values including 5, 10, 15 through 85 |
| Series overflow | Convert series to key images, Export to video, Download series, Delete series |
| Text Marker Image | Cervical spine, Thoracic spine, Lumbar spine |

## Implementation Readiness

| Status | Tools/features |
| --- | --- |
| Ready through OHIF/Cornerstone commands | Pan, Zoom, StackScroll, WindowLevel, Length, Angle, Rectangle ROI, Elliptical ROI, Probe/Point, Arrow annotation, Magnify, Reset, Rotate, Flip, Invert, Cine, basic layout grid |
| Needs MiniPACS command wrapper/state | VRPACS-style top toolbar, accordion side panel, active tool styling, per-viewport mini toolbar, overlay labels, active viewport border, series rail item selection |
| Needs OHIF services integration | DisplaySetService series ordering, ViewportGridService layout switching, HangingProtocolService compare/MPR layouts, SyncGroupService sync modes, MeasurementService persistence |
| Needs MiniPACS backend/API | Patient history, report/file item, key images, save snapshot/gallery, export video, download manager, audit/action history, encode patient, PACS/user config |
| Advanced/later plugins | NASCET/ESCT, cardiopulmonary, mammography mode, brain mirror, volume polygon, curved MPR, fusion MPR, AI labeling, video conference, 5D reporting |
| Guarded/destructive | Delete series, encode/anonymize patient, PACS config changes, user config changes |

## Priority Backlog

1. Build a central MiniPACS tool registry with the exact VRPACS groups above.
2. Replace hardcoded toolbar/sidebar arrays with registry-driven rendering.
3. Add a real series rail using OHIF DisplaySetService metadata instead of DOM guessing.
4. Add viewport wrapper overlay and per-viewport mini toolbar.
5. Wire first command tier: layout, pan, zoom, stack scroll, WW/WL, measurements, reset, rotate, flip, invert, cine.
6. Add backend-backed workflow tier: history, report, capture/gallery, key images, export/download.
7. Add modality-specific advanced tier after core viewer is stable.

## Phase 1 Acceptance

- The VRPACS-equivalent tool list is documented by section.
- Each tool has a target implementation class: native OHIF command, MiniPACS UI state, OHIF service integration, backend/API, or later advanced module.
- Destructive tools are explicitly identified before implementation.
- The next code step is clear: create the tool registry and render toolbar/sidebar from it.
