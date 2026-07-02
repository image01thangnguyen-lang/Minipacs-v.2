import { annotation, drawing } from '@cornerstonejs/tools';
import { ShutterSVGUtils } from './ShutterSVGUtils';
import type { Types } from '@cornerstonejs/core';
import { EllipticalROITool } from '@cornerstonejs/tools';

export class EllipseShutterTool extends EllipticalROITool {
  static toolName = 'EllipseShutter';

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
    let renderStatus = false;
    try {
      renderStatus = super.renderAnnotation(enabledElement, svgDrawingHelper);
    } catch (e) {
      console.warn('Failed to render base EllipticalROITool', e);
    }

    const { viewport } = enabledElement;
    const { element } = viewport;

    const annotations = annotation.state.getAnnotations(this.getToolName(), element);
    
    if (!annotations || !annotations.length) {
      return renderStatus;
    }

    const canvasWidth = element.clientWidth;
    const canvasHeight = element.clientHeight;

    annotations.forEach((ann: any) => {
      const points = ann.data?.handles?.points; // [bottom, top, left, right] for Ellipse
      if (!points || !points.length) return;
      
      const canvasPoints = points.map((p: any) => viewport.worldToCanvas(p));
      
      // Calculate center and radii
      const bottom = canvasPoints[0];
      const top = canvasPoints[1];
      const left = canvasPoints[2];
      const right = canvasPoints[3];

      const cx = (left[0] + right[0]) / 2;
      const cy = (top[1] + bottom[1]) / 2;

      const rx = Math.abs(right[0] - left[0]) / 2;
      const ry = Math.abs(bottom[1] - top[1]) / 2;

      const svgPath = ShutterSVGUtils.drawInvertedEllipse(canvasWidth, canvasHeight, { center: [cx, cy], rx, ry });

      const uid = `${ann.annotationUID}-shutter`;
      const options = {
        color: 'rgba(0, 0, 0, 1)',
        fillColor: 'rgba(0, 0, 0, 1)',
        fillOpacity: 1,
        lineWidth: 0,
        fillRule: 'evenodd'
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
