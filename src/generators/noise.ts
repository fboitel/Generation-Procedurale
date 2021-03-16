import { Image } from '../image';
import { rand } from '../random';
import { Color, color } from '../color';

function randomColor(): Color {
	function randomChannel(): number {
		return Math.floor(rand() * 255);
	}
	return color(randomChannel(), randomChannel(), randomChannel(), 255);
}

export function whiteNoise(width: number, height: number): Image {
	return {
		width,
		height,
		function: randomColor,
	};
}

export function limitedByFrequencyWhiteNoise(width: number, height: number, frequency: number): Image {
	let cache: Color[] = []

	return {
		width,
		height,
		function: (x, y) => {
			const index = width * Math.floor(y / frequency) + Math.floor(x / frequency);
			if (x % frequency === 0 && y % frequency === 0) {
				cache[index] = randomColor()
			}
			return cache[index]
		}
	};
}

export function perlinNoise(width: number, height: number, gridSize: number): Image {
	type Vector = [number, number];
	const gradients: Vector[] = []

	function randomGradient(x: number, y: number): Vector {
		const index = Math.round(y / gridSize) * Math.ceil(width / gridSize) + Math.round(x / gridSize);

		if (gradients[index] === undefined) {
			const angle = rand() * 2 * Math.PI - Math.PI;
			gradients[index] = [
				Math.cos(angle),
				Math.sin(angle),
			];
		}

		return gradients[index];
	}

	function dotGridGradient(gridX: number, gridY: number, x: number, y: number): number {
		// gradient vector
		const [gradientX, gradientY] = randomGradient(gridX, gridY);

		// distance vector
		const distanceX = (x - gridX) / gridSize;
		const distanceY = (y - gridY) / gridSize;

		// dot-product
		return distanceX * gradientX + distanceY * gradientY;
	}

	function interpolate(min: number, max: number, cursor: number) {
		return (max - min) * ((cursor * (cursor * 6 - 15) + 10) * cursor**3) + min;
	}

	function perlin(x: number, y: number): Color {
		// grid cell coordinates
		const x0 = Math.floor(x / gridSize) * gridSize;
		const x1 = x0 + gridSize;
		const y0 = Math.floor(y / gridSize) * gridSize;
		const y1 = y0 + gridSize;

		// weights
		const weightX = (x - x0) / gridSize;
		const weightY = (y - y0) / gridSize;

		// interpolation
		const value = interpolate(
			interpolate(
				dotGridGradient(x0, y0, x, y),
				dotGridGradient(x1, y0, x, y),
				weightX
			),
			interpolate(
				dotGridGradient(x0, y1, x, y),
				dotGridGradient(x1, y1, x, y),
				weightX
			),
			weightY
		);

		const greyLevel = (value + 1) * 255 / 2;

		return color(greyLevel, greyLevel, greyLevel);
	}

	return {
		width,
		height,
		function: perlin,
	}
}
