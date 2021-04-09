import { FilterMeta, GeneratorMeta } from '../../common/registry'
import { Image } from '../../common/image'
import { clear, display } from './view'

export enum BlockType {
	GENERATOR,
	FILTER,
	OUTPUT,
}

export enum IOType {
	INPUT,
	OUTPUT,
}

export interface Block {
	type: BlockType;
	element: HTMLDivElement;
	meta?: GeneratorMeta | FilterMeta;
	inputs: IO[];
	outputs: IO[];
}

export interface IO {
	type: IOType;
	element: HTMLDivElement;
	parent: Block;
	edge?: Edge;
}

export interface Edge {
	from: IO;
	to: IO;
	element: SVGLineElement;
}

const graph = document.getElementById('graph');
const lines = document.getElementById('lines');
const output = createBlock(BlockType.OUTPUT,1, 0);
let zIndex = 1;
let overedIO: IO = null;

function createIO(type: IOType, parent: Block): IO {
	const element = document.createElement('div');
	const ioType = ['in', 'out'][type];
	element.className = `io ${ioType}`;

	const io = {
		type,
		element,
		parent,
	};

	switch (type) {
		case IOType.INPUT:
			element.addEventListener('mouseenter', () => overedIO = io);
			element.addEventListener('mouseleave', () => overedIO = null);
			break;
		case IOType.OUTPUT:
			makeLinkable(io);
			break;
	}

	return io;
}

function createIOBar(type: IOType, parent: Block, nbOfIO: number): HTMLDivElement {
	if (nbOfIO === 0) return null;

	const bar = document.createElement('div');
	const arrayType = ['inputs', 'outputs'][type] as 'inputs' | 'outputs';

	bar.className = 'io-bar';
	for (let i = 0; i < nbOfIO; ++i) {
		const io = createIO(type, parent);
		parent[arrayType].push(io);
		bar.appendChild(io.element);
	}

	return bar;
}

function createBlockBody(title: string): HTMLDivElement {
	const titleElement = document.createElement('h2');
	titleElement.textContent = title;

	const body = document.createElement('div');
	body.className = 'block-body';
	body.appendChild(titleElement);

	return body;
}

export function createBlock(type: BlockType, nbOfInputs: number, nbOfOutputs: number, meta?: GeneratorMeta | FilterMeta): Block {
	const parentBox = graph.getClientRects()[0];
	const element = document.createElement('div');
	const blockType = ['generator', 'filter', 'output'][type];
	element.className = `block ${blockType}`;
	element.style.left = parentBox.x + 'px';
	element.style.top = parentBox.y + 'px';
	element.style.zIndex = (zIndex++).toString();
	graph.appendChild(element);

	const block: Block = {
		type,
		element,
		inputs: [],
		outputs: [],
	}
	if (meta) block.meta = meta;

	makeDraggable(block);

	const inputs = createIOBar(IOType.INPUT, block, nbOfInputs);
	const outputs = createIOBar(IOType.OUTPUT, block, nbOfOutputs);

	if (inputs) element.appendChild(inputs);
	element.appendChild(createBlockBody(meta?.name ?? 'Afficher'));
	if (outputs) element.appendChild(outputs);

	return block;
}

function makeDraggable(block: Block) {
	const { element } = block;

	element.addEventListener('mousedown', (e: MouseEvent) => {
		// move to the top
		element.style.zIndex = (zIndex++).toString();

		const mouseElementOffset = {
			x: element.offsetLeft - e.clientX,
			y: element.offsetTop - e.clientY,
		};

		function drag(e: MouseEvent) {
			const box = element.parentElement.getClientRects()[0];
			element.style.left = Math.min(box.x + box.width - element.clientWidth - 2, Math.max(box.x, e.clientX + mouseElementOffset.x)) + 'px';
			element.style.top = Math.min(box.y + box.height - element.clientHeight - 2, Math.max(box.y, e.clientY + mouseElementOffset.y)) + 'px';

			[...block.inputs, ...block.outputs].forEach(io => updateEdgeCoordinates(io));
		}

		function stopDrag() {
			document.removeEventListener('mousemove', drag);
			document.removeEventListener('mouseup', stopDrag);
		}

		document.addEventListener('mouseup', stopDrag);
		document.addEventListener('mousemove', drag);
	});
}

function makeLinkable(io: IO) {
	io.element.addEventListener('mousedown', e => {
		e.stopPropagation();

		graph.classList.add('link-building');

		removeEdge(io.edge);

		const linesBox = lines.getClientRects()[0];
		const line = createLine(io, e.clientX - linesBox.x, e.clientY - linesBox.y);

		document.addEventListener('mousemove', dragLink);
		document.addEventListener('mouseup', dropLink);

		function dragLink(e: MouseEvent) {
			setCoordinate(line, 'x2', e.clientX - linesBox.x);
			setCoordinate(line, 'y2', e.clientY - linesBox.y);
		}

		function dropLink() {
			document.removeEventListener('mousemove', dragLink);
			document.removeEventListener('mouseup', dropLink);

			graph.classList.remove('link-building');

			if (overedIO === null) {
				lines.removeChild(line);

			} else {
				removeEdge(overedIO.edge);

				io.edge = overedIO.edge = {
					from: io,
					to: overedIO,
					element: line,
				};

				updateEdgeCoordinates(overedIO);
			}

			evaluateGraph();
		}
	});
}

function removeEdge(edge: Edge) {
	if (!edge) return;

	lines.removeChild(edge.element);
	delete edge.from.edge;
	delete edge.to.edge;
}

function createLine(from: IO, toX: number, toY: number): SVGLineElement {
	const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
	line.style.stroke = 'var(--font-color)';
	line.style.strokeWidth = '2px';

	updateEdgeCoordinates(from, line);
	setCoordinate(line, 'x2', toX);
	setCoordinate(line, 'y2', toY);

	lines.appendChild(line);
	return line;
}

function setCoordinate(line: SVGLineElement, coordinate: 'x1' | 'y1' | 'x2' | 'y2', value: number) {
	line[coordinate].baseVal.newValueSpecifiedUnits(line[coordinate].baseVal.SVG_LENGTHTYPE_PX, value);
}

function updateEdgeCoordinates(io: IO, edgeElement?: SVGLineElement) {
	if (!edgeElement) edgeElement = io.edge?.element;
	if (!edgeElement) return;

	const input = io.type === IOType.OUTPUT;
	const ioBox = io.element.getClientRects()[0];
	const linesBox = lines.getClientRects()[0];

	setCoordinate(edgeElement, input ? 'x1' : 'x2', ioBox.x + ioBox.width / 2 - linesBox.x);
	setCoordinate(edgeElement, input ? 'y1' : 'y2', ioBox.y + ioBox.height / 2 - linesBox.y);
}

function evaluateGraph() {
	const image = evaluateBlock(output);

	if (image) display(image);
	else clear();

	function evaluateBlock(block: Block): Image {
		if (block.type === BlockType.GENERATOR) {
			const meta = block.meta as GeneratorMeta;
			return meta.generator.call(this);
		}

		const edge = block.inputs[0].edge;
		if (!edge) return null;

		const input = evaluateBlock(edge.from.parent);
		if (!input) return null;

		switch (block.type) {
			case BlockType.FILTER:
				const meta = block.meta as FilterMeta;
				return meta.filter.call(this, input);

			case BlockType.OUTPUT:
				return input;
		}
	}
}
