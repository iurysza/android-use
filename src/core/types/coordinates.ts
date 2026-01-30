/**
 * 2D point (tap target, etc.)
 */
export interface Point {
	x: number;
	y: number;
}

/**
 * Rectangle bounds (UI element bounds)
 */
export interface Rect {
	left: number;
	top: number;
	right: number;
	bottom: number;
}

/**
 * Swipe gesture definition
 */
export interface SwipeGesture {
	startX: number;
	startY: number;
	endX: number;
	endY: number;
	durationMs: number;
}

/**
 * Named swipe directions
 */
export type SwipeDirection = "up" | "down" | "left" | "right";

/**
 * Get center point of a rectangle
 */
export function rectCenter(rect: Rect): Point {
	return {
		x: Math.round((rect.left + rect.right) / 2),
		y: Math.round((rect.top + rect.bottom) / 2),
	};
}

/**
 * Check if point is inside rect
 */
export function pointInRect(point: Point, rect: Rect): boolean {
	return (
		point.x >= rect.left &&
		point.x <= rect.right &&
		point.y >= rect.top &&
		point.y <= rect.bottom
	);
}
