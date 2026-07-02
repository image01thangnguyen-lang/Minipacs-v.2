/**
 * Shutter SVG Utility Functions
 * Generates SVG path commands with fill-rule="evenodd" to create a "shutter" hole effect.
 */

export const ShutterSVGUtils = {
  /**
   * Generates a path that covers the entire canvas, and punches a rectangular hole.
   * @param canvasWidth Total width of the viewport canvas
   * @param canvasHeight Total height of the viewport canvas
   * @param rect Top-left [x, y] and bottom-right [x, y] of the hole
   */
  drawInvertedRect: (canvasWidth: number, canvasHeight: number, rect: { topLeft: [number, number], bottomRight: [number, number] }) => {
    // Outer boundary (canvas)
    const outer = `M 0 0 L ${canvasWidth} 0 L ${canvasWidth} ${canvasHeight} L 0 ${canvasHeight} Z`;
    
    // Inner hole (rectangle)
    const [x1, y1] = rect.topLeft;
    const [x2, y2] = rect.bottomRight;
    const inner = `M ${x1} ${y1} L ${x2} ${y1} L ${x2} ${y2} L ${x1} ${y2} Z`;

    return `${outer} ${inner}`;
  },

  /**
   * Generates a path that covers the entire canvas, and punches an elliptical hole.
   * @param canvasWidth 
   * @param canvasHeight 
   * @param ellipse Center [x, y] and radii [rx, ry]
   */
  drawInvertedEllipse: (canvasWidth: number, canvasHeight: number, ellipse: { center: [number, number], rx: number, ry: number }) => {
    // Outer boundary (canvas)
    const outer = `M 0 0 L ${canvasWidth} 0 L ${canvasWidth} ${canvasHeight} L 0 ${canvasHeight} Z`;
    
    // Inner hole (ellipse approximation using two arcs)
    const [cx, cy] = ellipse.center;
    const { rx, ry } = ellipse;
    
    const inner = `
      M ${cx - rx} ${cy}
      A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy}
      A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy}
    `.trim();

    return `${outer} ${inner}`;
  },

  /**
   * Generates a path that covers the entire canvas, and punches a polygon hole.
   * @param canvasWidth 
   * @param canvasHeight 
   * @param points Array of [x, y] points defining the polygon
   */
  drawInvertedPolygon: (canvasWidth: number, canvasHeight: number, points: [number, number][]) => {
    // Outer boundary (canvas)
    const outer = `M 0 0 L ${canvasWidth} 0 L ${canvasWidth} ${canvasHeight} L 0 ${canvasHeight} Z`;
    
    if (!points || points.length < 3) return outer;

    // Inner hole (polygon)
    const [startX, startY] = points[0];
    let inner = `M ${startX} ${startY}`;
    for (let i = 1; i < points.length; i++) {
      inner += ` L ${points[i][0]} ${points[i][1]}`;
    }
    inner += ' Z';

    return `${outer} ${inner}`;
  }
};
