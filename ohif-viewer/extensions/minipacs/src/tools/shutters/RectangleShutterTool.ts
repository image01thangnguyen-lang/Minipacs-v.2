import { annotation, drawing, utilities } from '@cornerstonejs/tools';
import { ShutterSVGUtils } from './ShutterSVGUtils';
import type { Types } from '@cornerstonejs/core';

// Note: Cornerstone3D beta / 1.x exports tools from the main package or annotation.
// Assuming RectangleROITool is accessible via standard imports. If not, it can be aliased.
import { RectangleROITool } from '@cornerstonejs/tools';

export class RectangleShutterTool extends RectangleROITool {
  static toolName = 'RectangleShutter';

  constructor(
    toolProps = {},
    defaultToolProps = {
      supportedInteractionTypes: ['Mouse', 'Touch'],
      configuration: {
        shadow: true,
        preventHandleOutsideImage: false,
      },
    }
  ) {
    super(toolProps, defaultToolProps);
  }

  renderAnnotation(
    enabledElement: Types.IEnabledElement,
    svgDrawingHelper: any
  ): boolean {
    // 1. Call the base class to handle standard rendering (handles, lines)
    // If we only want the shutter, we might skip calling super.renderAnnotation and draw handles ourselves.
    // However, to keep interaction (resize/move) alive, we can call super and then draw our mask.
    let renderStatus = false;
    try {
      renderStatus = super.renderAnnotation(enabledElement, svgDrawingHelper);
    } catch (e) {
      console.warn('Failed to render base RectangleROITool', e);
    }

    const { viewport } = enabledElement;
    const { element } = viewport;

    // 2. Extract the annotation data for this tool
    const annotations = annotation.state.getAnnotations(this.getToolName(), element);
    
    if (!annotations || !annotations.length) {
      return renderStatus;
    }

    // Canvas dimensions for the outer boundary
    const canvasWidth = element.clientWidth;
    const canvasHeight = element.clientHeight;

    // 3. For each shutter annotation, draw the inverted mask
    annotations.forEach((ann: any, index: number) => {
      const points = ann.data?.handles?.points; // [topLeft, topRight, bottomRight, bottomLeft]
      if (!points || !points.length) return;
      
      // Convert 3D world coordinates to 2D canvas coordinates
      const canvasPoints = points.map((p: any) => viewport.worldToCanvas(p));
      
      const topLeft = canvasPoints[0];
      const bottomRight = canvasPoints[2];

      const svgPath = ShutterSVGUtils.drawInvertedRect(canvasWidth, canvasHeight, { topLeft, bottomRight });

      // Draw using Cornerstone's SVG drawing helper
      const uid = `${ann.annotationUID}-shutter`;
      const options = {
        color: 'rgba(0, 0, 0, 1)', // Solid black
        fillColor: 'rgba(0, 0, 0, 1)',
        fillOpacity: 1, // Full opacity for the mask
        lineWidth: 0,
        fillRule: 'evenodd' // Crucial for punching the hole
      };

      drawing.drawPath(
        svgDrawingHelper,
        this.getToolName(),
        uid,
        svgPath,
        options
      );
    });

    return renderStatus;
  }
}
