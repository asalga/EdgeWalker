/*
  Andor Saga
  March 2020

  Get the edge points of an image

  Assumptions:
    - each pixel has an adjacent left, top, right or bottom pixels
    - transparent pixels define the outside of the hull

  Usage:
  	// defaults to find anything that isn't transparent.
    let edgeWalker = new EdgeWalker(img);
    let arr = edgeWalker.getEdgePoints();

	// or provide a color to look for
    let edgeWalker = new EdgeWalker(img, {edgeColor: [255,0,0]});
    let arr = edgeWalker.getEdgePoints();
	
  TODO: fix issue with walking life eyebrow bug
*/

class EdgeWalker {

  constructor(img, obj) {

    if (obj) {
      this.edgeColor = obj.edgeColor;
    }

    this.img = img;
    this.img.loadPixels();

    this.W = img.width;
    this.H = img.height;

    this.history = [];
    this.numMoves = 0;

    this.grid = [];
    for (let x = 0; x < this.W; x++) {
      this.grid[x] = new Array(this.H);

      for (let y = 0; y < this.H; y++) {

        let idx = (y * img.width + x) * 4;

        let r = this.img.pixels[idx + 0];
        let g = this.img.pixels[idx + 1];
        let b = this.img.pixels[idx + 2];
        let a = this.img.pixels[idx + 3];

        this.grid[x][y] = {
          visited: false,
          col: [r, g, b, a]
        };
      }
    }

    this.curr = this.findLeftmost();

    this.x = this.curr.x;
    this.y = this.curr.y;
    this.c = this.curr.c;

    this.visitCurr();

    this.start = { x: this.curr.x, y: this.curr.y };
  }

  getEdgePoints() {
    let arr = [];
    let finished = false;

    for (let i = 0; !finished; i++) {

      let success = this.move(-1, 0); // left
      if (!success) success = this.move(0, -1); // up
      if (!success) success = this.move(1, 0); // right
      if (!success) success = this.move(0, 1); // down

      if (this.x === this.start.x && this.y === this.start.y) {
        finished = true;
      }

      if (success) {
        this.history.push({ x: this.x, y: this.y, c: this.c });
        arr.push({ x: this.x, y: this.y, c: this.c });
      }
      // If we reached this point and we are still unsuccessful
      else {
        this.history.pop();

        let last = this.history[this.history.length - 1];

        if (!last) {
          return arr;
        }
        this.x = last.x;
        this.y = last.y;
      }

      this.numMoves++;
    }

    return arr;
  }

  move(xOff, yOff) {
    // check OOB / hit wall
    if (this.x + xOff < 0) return false;
    if (this.x + xOff > this.W) return false;
    if (this.y + yOff < 0) return false;
    if (this.y + yOff > this.H) return false;

    let newX = this.x + xOff;
    let newY = this.y + yOff;

    let start = this.isStart(newX, newY);

    let cell = this.grid[newX][newY];
    if ((this.isEdgeColor(cell.col) && !cell.visited && this.touchesOutside(newX, newY)) || start) {
      this.x = newX;
      this.y = newY;
      this.visitCurr();
      return true;
    }

    return false;
  }

  isStart(x, y) {
    return x === this.start.x && y === this.start.y && this.numMoves > 10;
  }

  visitCurr() {
    this.grid[this.x][this.y].visited = true;
  }

  findLeftmost() {
    let test = 0;
    for (let x = 0; x < this.W; x++) {
      for (let y = 0; y < this.H; y++) {
        test++;
        if (this.isEdgeColor(this.grid[x][y].col)) {

          // let c = [
          // 	this.grid[x][y].col[0],
          // 	this.grid[x][y].col[1],
          // 	this.grid[x][y].col[2],
          // 	this.grid[x][y].col[3]
          // ]
          return { x, y };
        }
      }
    }
  }

  // we need a way to prevent going 'inside' the shape.
  // the marker should always have a transparent pixel relative to its 
  // top-left, top, top-right, right, bottom-right etc.
  touchesOutside(x, y) {

    if (x - 1 < 0 || x + 1 >= this.W || y - 1 < 0 || y + 1 >= this.H) return true;

    if (
      !this.isEdgeColor(this.grid[x - 1][y].col) ||
      !this.isEdgeColor(this.grid[x - 1][y - 1].col) ||
      !this.isEdgeColor(this.grid[x][y - 1].col) ||
      !this.isEdgeColor(this.grid[x + 1][y - 1].col) ||
      !this.isEdgeColor(this.grid[x + 1][y].col) ||
      !this.isEdgeColor(this.grid[x + 1][y + 1].col) ||
      !this.isEdgeColor(this.grid[x][y + 1].col) ||
      !this.isEdgeColor(this.grid[x - 1][y + 1].col)) {
      return true;
    }
    return false;
  }

  isEdgeColor(c) {

    if (this.edgeColor) {
      return c[0] === this.edgeColor[0] &&
        c[1] === this.edgeColor[1] &&
        c[2] === this.edgeColor[2] &&
        c[3] === this.edgeColor[3];
    } else {
      return c[3] !== 0;
    }
  }
}