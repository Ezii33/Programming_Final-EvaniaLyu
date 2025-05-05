var mode = 0;
let scl = 20;
let snake;
let food;
let cols, rows;

let level = 1;
let maxLevels = 3;
let obstacles = [];
let foodEaten = 0;
let foodToNextLevel = 5;
let fontSize = 20;

let slowSpeed = 5;
let fastSpeed = 15;

let prevBody = [];
let isPaused = false;

let levelMusics = [];
let currentMusic;

function preload() {
  levelMusics[1] = loadSound('Level 1.wav');
  levelMusics[2] = loadSound('Level 2.wav');
  levelMusics[3] = loadSound('Level 3.wav');
}

function setup() {
  createCanvas(600, 600);
  splash = new Splash();
  cols = floor(width / scl);
  rows = floor(height / scl);
  startLevel(level);
}

function startLevel(lv) {
  if (currentMusic && currentMusic.isPlaying()) {
    currentMusic.stop();
  }
  currentMusic = levelMusics[lv];
  if (currentMusic && !currentMusic.isPlaying()) {
    currentMusic.loop();
  }

  frameRate(slowSpeed);
  foodEaten = 0;
  snake = new Snake(prevBody);
  generateObstacles(lv);
  pickLocation();
}

function pickLocation() {
  let valid = false;
  while (!valid) {
    let x = floor(random(cols));
    let y = floor(random(rows));
    let newPos = createVector(x, y);
    let onSnake = snake.body.some(seg => seg.x === newPos.x && seg.y === newPos.y);
    let onObstacle = obstacles.some(obs => collisionWithRect(newPos, obs));
    if (!onSnake && !onObstacle) {
      food = newPos;
      valid = true;
    }
  }
}

function collisionWithRect(pos, obs) {
  return pos.x >= obs.x && pos.x < obs.x + obs.w &&
         pos.y >= obs.y && pos.y < obs.y + obs.h;
}

function generateObstacles(lv) {
  obstacles = [];
  let obstacleCount = lv === 2 ? 16 : 4;
  let head = prevBody.length > 0 ? prevBody[prevBody.length - 1] : createVector(floor(cols / 2), floor(rows / 2));
  for (let i = 0; i < obstacleCount; i++) {
    let tries = 0;
    while (tries < 50) {
      let ox = floor(random(cols - 1));
      let oy = floor(random(rows - 10));
      let ow = 1;
      let oh = floor(random(5, 10));
      if (ox >= head.x - 1 && ox <= head.x + 1 && oy >= head.y - 1 && oy <= head.y + 1) {
        tries++;
        continue;
      }
      obstacles.push({ x: ox, y: oy, w: ow, h: oh });
      break;
    }
  }
}

function draw() {
   if (mouseIsPressed == true) {
    mode = 1;
  }
  
  if (mode == 1) {
    splash.hide();
  if (isPaused) {
    drawPausedScreen();
    return;
  }
  }
  background(51);
  drawBorders();
  drawUI();

  if (keyIsPressed) frameRate(fastSpeed);
  else frameRate(slowSpeed);

  snake.update();
  snake.show();

  // draw food
  fill(255, 255, 0);
  noStroke();
  rect(food.x * scl, food.y * scl, scl, scl);

  // draw obstacles
  fill(255, 0, 0);
  for (let obs of obstacles) {
    rect(obs.x * scl, obs.y * scl, obs.w * scl, obs.h * scl);
  }

  // fog
  if (level === 3) drawFog();

  // check death
  if (snake.death() || snake.hitObstacle(obstacles)) {
    noLoop();
    textSize(26);
    fill(255);
    textAlign(CENTER, CENTER);
    text("💀 Game Over!\nWow... you lost? That’s kinda sad 😒", width / 2, height / 2);
    return;
  }

  // check food
  if (snake.eat(food)) {
    foodEaten++;
    if (foodEaten >= foodToNextLevel) {
      level++;
      if (level > maxLevels) {
        noLoop();
        textSize(26);
        fill(0, 255, 0);
        textAlign(CENTER, CENTER);
        text("🏆 You Win!\nBeginner’s luck. Bet you can’t win again 😎", width / 2, height / 2);
        return;
      } else {
        prevBody = snake.body.map(p => p.copy());
        startLevel(level);
        return;
      }
    }
    pickLocation();
  }
}

function drawBorders() {
  stroke(255, 0, 0);
  strokeWeight(4);
  noFill();
  rect(0, 0, width, height);
}

function drawUI() {
  noStroke();
  fill(255);
  textSize(fontSize);
  textAlign(LEFT, TOP);
  text(`Level: ${level} | Score: ${foodEaten} / ${foodToNextLevel}`, 10, 10);
}

function drawPausedScreen() {
  background(0, 0, 0, 180);
  textAlign(CENTER, CENTER);
  textSize(20);
  fill(255);
  text("⏸️ Paused\nAre you a grandma? Why do you need a pause? 😏", width / 2, height / 2);
}

function drawFog() {
  fill(0, 0, 0, 220);
  rect(0, 0, width, height);
  let head = snake.body[snake.body.length - 1];
  let r = 3 * scl;
  erase();
  ellipse(head.x * scl + scl / 2, head.y * scl + scl / 2, r * 2, r * 2);
  noErase();
}

function keyPressed() {
  if (key === ' ') {
    isPaused = !isPaused;
    return;
  }
  if (key === 'w' || key === 'W') snake.dir(0, -1);
  else if (key === 's' || key === 'S') snake.dir(0, 1);
  else if (key === 'a' || key === 'A') snake.dir(-1, 0);
  else if (key === 'd' || key === 'D') snake.dir(1, 0);
}

class Snake {
  constructor(prev = []) {
    this.body = prev.length > 0 ? prev : [createVector(floor(cols / 2), floor(rows / 2))];
    this.xdir = 0;
    this.ydir = 0;
    this.growPending = 0;
  }

  dir(x, y) {
    this.xdir = x;
    this.ydir = y;
  }

  update() {
    if (this.xdir === 0 && this.ydir === 0) return;
    let head = this.body[this.body.length - 1].copy();
    head.x += this.xdir;
    head.y += this.ydir;
    this.body.push(head);
    if (this.growPending > 0) this.growPending--;
    else this.body.shift();
  }

  grow() {
    this.growPending += 3;
  }

  eat(pos) {
    let head = this.body[this.body.length - 1];
    if (head.x === pos.x && head.y === pos.y) {
      this.grow();
      return true;
    }
    return false;
  }

  death() {
    let head = this.body[this.body.length - 1];
    if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) return true;
    for (let i = 0; i < this.body.length - 1; i++) {
      let part = this.body[i];
      if (part.x === head.x && part.y === head.y) return true;
    }
    return false;
  }

  hitObstacle(obsList) {
    let head = this.body[this.body.length - 1];
    return obsList.some(obs =>
      head.x >= obs.x && head.x < obs.x + obs.w &&
      head.y >= obs.y && head.y < obs.y + obs.h
    );
  }

  show() {
    for (let i = 0; i < this.body.length; i++) {
      fill(0, 100, 255);
      noStroke();
      rect(this.body[i].x * scl, this.body[i].y * scl, scl, scl);
    }
  }
}