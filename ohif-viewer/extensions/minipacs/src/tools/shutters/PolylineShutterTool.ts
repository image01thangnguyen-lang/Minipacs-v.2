import { annotation, drawing } from '@cornerstonejs/tools';
import { ShutterSVGUtils } from './ShutterSVGUtils';
import type { Types } from '@cornerstonejs/core';
import { PlanarFreehandROITool } from '@cornerstonejs/tools';

export class PolylineShutterTool extends PlanarFreehandROITool {
  static toolName = 'PolylineShutter';

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
      console.warn('Failed to render base PlanarFreehandROITool', e);
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
      const data = ann.data;
      const points = data?.contour?.polyline ?? data?.handles?.points;
      if (!points || !points.length) return;
      
      const canvasPoints = points.map((p: any) => viewport.worldToCanvas(p));

      const svgPath = ShutterSVGUtils.drawInvertedPolygon(canvasWidth, canvasHeight, canvasPoints);

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
