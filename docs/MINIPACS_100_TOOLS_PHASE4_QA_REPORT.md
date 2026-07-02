# MiniPACS Phase 4 QA Report: MPR, MIP, VR, Volume Imaging

## Overview
Phase 4 introduces advanced 3D Volume workflows including Orthogonal MPR, MIP, VR, and basic crosshair synchronization. The architecture enforces strict eligibility guards to ensure that only reconstructable studies (e.g. CT, MR, PET) can enter this mode, protecting the performance and stability of the standard 2D viewer.

## Implemented Features (Ready)
| Feature | Tool ID | Description |
|---|---|---|
| **Orthogonal MPR** | `MPR` | Toggles the 3-viewport MPR layout. Ensures non-reconstructable studies show a friendly alert instead of crashing. Exiting MPR safely restores the original 2D layout. |
| **MIP / 3D VR** | `MIP`, `3D` | Toggles the MPR + 3D Volume rendering layout, providing Maximum Intensity Projection or Volume Rendering based on predefined transfer functions. |
| **Crosshairs** | `Crosshairs` | Synchronized 3D cursor linking Axial, Coronal, and Sagittal viewports. |
| **View Selection** | `Axial`, `Coronal`, `Sagittal` | Explicit actions allowing the user to override the current viewport's orientation when inside MPR mode. |

## Measurement Persistence Guard
> [!IMPORTANT]
> To comply with Phase 2 persistence safety rules, all 2D measurements (Length, Area, etc.) drawn on a Volume Viewport inside MPR mode will **NOT** be persisted. The `viewerMeasurementPersistenceService` explicitly skips annotations missing `SOPInstanceUID` (characteristic of reconstructed views). This ensures coordinates aren't misaligned upon study reload.

## Deferred Features (Deferred-Advanced)
The following features were successfully audited but deliberately marked `deferred-advanced` pending proper Cornerstone3D WebGL support and validation.

1. **Oblique, Curved, Freehand MPR** (`CurvedMPR`, `CompareMPR`)
   - *Reason:* Pending reslice engine stability. Existing OHIF implementations for custom path reslicing on the browser can cause severe GPU/memory leaks without rigorous bounds.
2. **Advanced 3D Annotations** (`Volume`, `VolumePolygon`, etc.)
   - *Reason:* Mapping world coordinates (3D) back to precise 2D SOP Instances for DICOM SR persistence requires a validated transform matrix workflow.

## Hardware / GPU Limitations
- **Memory Consumption:** Volume rendering (especially high-res CTs > 1000 slices) consumes significant VRAM. 
- **Graceful Fallback:** If the browser cannot allocate sufficient WebGL contexts, the MPR viewport may fail to render. Users are encouraged to reload the tab or use standard 2D scrolling for excessively large series.
