import { domReady } from './utils';
import Point from './Point';
import Line from './Line';
import Rect from './Rect';

class Panel {
    public canvas: HTMLCanvasElement;
    public ctx: CanvasRenderingContext2D;
    public bgCanvas: HTMLCanvasElement;
    public bgCtx: CanvasRenderingContext2D;
    private isDrawing: boolean;
    private selectionFrameStart: Point;
    private cubesMatrix: Rect[][];
    private gap: number;
    private rectWidth: number;

    constructor() {
        this.canvas = document.querySelector('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.bgCanvas = document.createElement('canvas');
        this.bgCtx = this.bgCanvas.getContext('2d');
        this.gap = 10;
        this.rectWidth = 15;
        this.canvas.width = 801;
        this.canvas.height = 801;
        this.bgCanvas.width = 801;
        this.bgCanvas.height = 801;

        this.isDrawing = false;
        this.selectionFrameStart = null;
        this.cubesMatrix = [[]] as Rect[][];

        this.drawCubes(this.bgCtx);
        this.drawBackground(this.ctx);
        this.initEventHandlers();
    }

    public initEventHandlers() {
        this.canvas.addEventListener('mousemove', (evt: MouseEvent) => {
            if (!this.isDrawing) return;
            const { offsetX: x, offsetY: y } = evt;
            const endPoint = new Point(x, y);

            this.drawSelectionFrame(this.ctx, this.selectionFrameStart, endPoint);
            this.drawSelection(this.ctx, this.selectionFrameStart, endPoint);
        });

        this.canvas.addEventListener('mousedown', (evt: MouseEvent) => {
            const { offsetX: x, offsetY: y } = evt;

            this.selectionFrameStart = new Point(x, y);
            this.isDrawing = true;
        });

        this.canvas.addEventListener('mouseup', (evt: MouseEvent) => {
            this.reset(this.ctx);
            this.isDrawing = false;
        });
    }

    public drawSelectionFrame(ctx: CanvasRenderingContext2D, start: Point, end: Point) {
        this.reset(ctx);

        const line = new Line(ctx, {
            offset: 0.5,
            lineWidth: 1,
            lineJoin: 'round',
            strokeStyle: 'red'
        });
        const rect = new Rect({ start, end });
        rect.drawRectFrame(this.ctx, line);
    }

    private isNullSelection(startIndex: number, endIndex: number, startPixel: number, endPixel: number) {
        if (startIndex === endIndex) {
            return this.isInGap(startPixel) && this.isInGap(endPixel);
        }
        return false;
    }

    private isInGap(pixel: number) {
        return pixel % (this.gap + this.rectWidth) > this.rectWidth;
    }

    private findSelection(rect: Rect): Rect | null {
        const leftIndex = Math.floor(rect.left / (this.gap + this.rectWidth));
        const rightIndex = Math.floor(rect.right / (this.gap + this.rectWidth));
        const topIndex = Math.floor(rect.top / (this.gap + this.rectWidth));
        const bottomIndex = Math.floor(rect.bottom / (this.gap + this.rectWidth));
        if (this.isNullSelection(leftIndex, rightIndex, rect.left, rect.left)
            || this.isNullSelection(topIndex, bottomIndex, rect.top, rect.bottom)
        ) {
            return null
        }
        const start = new Point(
            this.isInGap(rect.left) ? leftIndex + 1 : leftIndex,
            this.isInGap(rect.top) ? topIndex + 1 : topIndex,
        );
        const end = new Point(rightIndex, bottomIndex);
        return new Rect({start, end});
    }

    public drawSelection(ctx: CanvasRenderingContext2D, start: Point, end: Point) {
        const rectSelection = new Rect({ start, end });
        const selectedIndex = this.findSelection(rectSelection);
        if (!selectedIndex) {
            return;
        }
        for (let x = selectedIndex.left; x <= selectedIndex.right; x ++) {
            for (let y = selectedIndex.top; y <= selectedIndex.bottom; y++) {
                const curRect = this.cubesMatrix[y][x];
                curRect.activate();
                curRect.fillRect(this.ctx);
            }
        }
    }

    public drawBackground(ctx: CanvasRenderingContext2D) {
        ctx.drawImage(this.bgCanvas, 0, 0, this.bgCanvas.width, this.bgCanvas.height);
    }

    public drawCubes(ctx: CanvasRenderingContext2D) {
        const line = new Line(ctx, {
            offset: 0.5,
            lineWidth: 1,
            lineJoin: 'round',
            strokeStyle: 'black'
        });

        const matrix: Rect[][] = [[]];

        for (let i = 0; i < 200; i++) {
            for (let j = 0; j < 200; j++) {
                const start = new Point(j * (this.rectWidth + this.gap), i * (this.rectWidth + this.gap));
                const end = new Point(j * (this.rectWidth + this.gap) + this.rectWidth, i * (this.rectWidth + this.gap) + this.rectWidth);
                const rect = new Rect({ start, end });

                rect.drawRectFrame(ctx, line);

                matrix[i] = matrix[i] || [];
                matrix[i][j] = rect;
            }
        }

        this.cubesMatrix = matrix;
    }

    public clear(ctx: CanvasRenderingContext2D) {
        const { width, height } = ctx.canvas;
        ctx.clearRect(0, 0, width, height);
    }

    public reset(ctx: CanvasRenderingContext2D) {
        this.clear(ctx);
        this.drawBackground(ctx);
    }
}

domReady(() => {
    const panel = new Panel();
});
