# DICOM Object Strategy (GSPS / KO / SR)

Updated: 2026-07-02

This document outlines the strategy for persisting clinical 2D annotations, measurements, and key images in MiniPACS.

## 1. JSON-First Persistence (Phase 2)

In Phase 2, MiniPACS uses a JSON-first persistence strategy for all viewer state, including measurements, annotations, key images, and snapshots.

**Why JSON?**
- Allows rapid iteration of clinical 2D tools without being bottlenecked by strict DICOM SR/GSPS schemas.
- Perfectly maps to the web viewer’s internal state (Cornerstone3D and OHIF tool states).
- Provides instant reload capabilities when the same study is opened.
- Safe integration with the web-based report workspace (transmitting measurement summaries as structured JSON payloads rather than forcing the report engine to parse DICOM SR).

**Data Model**
- All stored JSON records are tied to explicit DICOM hierarchy identifiers: `StudyInstanceUID`, `SeriesInstanceUID`, `SOPInstanceUID`, and `frameNumber`.
- Measurements include `value`, `unit`, and tool metadata to warn when images lack pixel spacing (uncalibrated).

## 2. Key Object Selection (KO) Strategy

**Current State (Phase 2):**
- Key images are stored as JSON metadata referencing the `SOPInstanceUID` and frame number.
- OHIF natively has some support for reading KO documents, but authoritative authoring is complex and error-prone without strict validation.

**Future State (Phase 3+):**
- **Requirements for KO:** Once the JSON-based key image workflow is fully validated clinically, MiniPACS backend or a dedicated microservice (e.g., using `dcmjs` or `fo-dicom`) will generate standard DICOM Key Object Selection (KO) documents.
- These KO documents will ensure interoperability with external PACS and VNA systems.

## 3. Grayscale Softcopy Presentation State (GSPS) Strategy

**Current State (Phase 2):**
- Window/Level, zoom, pan, rotation, and flips are saved within Snapshot metadata or re-applied via user preferences.
- 2D annotations (arrows, text, ROIs) are saved as Cornerstone-specific JSON.

**Future State (Phase 3+):**
- **Requirements for GSPS:** True GSPS authoring requires precise mapping of browser canvas coordinates to the DICOM image plane, accounting for shutters, pixel padding, and display transformations.
- OHIF has basic GSPS display capabilities. Authoring GSPS will be deferred until Phase 3 to avoid rendering discrepancies across different PACS vendors.

## 4. DICOM Structured Reporting (SR) Strategy

**Current State (Phase 2):**
- OHIF can read and display basic DICOM SR objects if they conform to standard TID 1500 (Measurement Report).
- Authoring DICOM SR from the web client is explicitly **deferred**. Sending measurements to the report workspace is done via a proprietary MiniPACS API.

**Future State (Phase 3+):**
- **Requirements for SR Export:** The backend will aggregate the JSON measurements and convert them into a valid DICOM SR (TID 1500) using a tested DICOM toolkit.
- This ensures that measurements are mathematically valid, codes (SNOMED, LOINC) are correctly mapped, and the resulting SR passes strict DICOM validation before being committed to the central archive.

## Conclusion

By adopting a JSON-first approach for Phase 2, MiniPACS achieves the clinical functionality required for a 2D workstation without introducing the interoperability risks of improperly formatted DICOM objects. DICOM GSPS, KO, and SR authoring remain strategic goals for Phase 3+.
