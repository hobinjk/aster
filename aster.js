class Asteroid {
  constructor(x, y, velX, velY, r, width, height) {
    this.x = x;
    this.y = y;
    this.velX = velX;
    this.velY = velY;
    this.width = width;
    this.height = height;
    this.r = r;
    this.alive = true;
  }

  clone() {
    return new Asteroid(this.x, this.y, this.velX, this.velY, this.r,
                        this.width, this.height);
  }

  stateAfter(dt) {
    let newX = this.x + this.velX * dt;
    let newY = this.y + this.velY * dt;
    let alive = this.alive;
    if (newX < -this.r) {
      alive = false;
    } else if (newX > this.width + this.r) {
      alive = false;
    }
    if (newY < -this.r) {
      alive = false;
    } else if (newY > this.height + this.r) {
      alive = false;
    }

    return {
      x: newX,
      y: newY,
      alive,
    };
  }

  step(dt) {
    let newState = this.stateAfter(dt);
    this.x = newState.x;
    this.y = newState.y;
    this.alive = newState.alive;
  }
}

class Player {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.x = width / 3;
    this.y = height / 3;
    this.velX = 0;
    this.velY = 0;
    this.velMax = 1;
    this.r = 8;
  }

  clone() {
    let p = new Player(this.width, this.height);
    p.x = this.x;
    p.y = this.y;
    p.velX = this.velX;
    p.velY = this.velY;
    return p;
  }

  stateAfter(dt, theta, thrust) {
    let newTheta = theta;
    let newVelX = this.velX + Math.cos(newTheta) * thrust * dt;
    let newVelY = this.velY + Math.sin(newTheta) * thrust * dt;

    let magSq = newVelX * newVelX + newVelY * newVelY;
    if (magSq > this.velMax * this.velMax) {
      let mag = Math.sqrt(magSq);
      newVelX = newVelX / mag * this.velMax;
      newVelY = newVelY / mag * this.velMax;
    }
    let newX = this.x + newVelX * dt;
    let newY = this.y + newVelY * dt;
    if (newX < this.r) {
      newX = this.r;
    } else if (newX > this.width - this.r) {
      newX = this.width - this.r;
    }
    if (newY < this.r) {
      newY = this.r;
    } else if (newY > this.height - this.r) {
      newY = this.height - this.r;
    }

    return {
      x: newX,
      y: newY,
      velX: newVelX,
      velY: newVelY,
    };
  }

  step(dt, theta, thrust) {
    let newState = this.stateAfter(dt, theta, thrust);
    this.x = newState.x;
    this.y = newState.y;
    this.velX = newState.velX;
    this.velY = newState.velY;
  }
}

const width = 512; // window.innerWidth;
const height = 512; // window.innerHeight;

const canvas = document.getElementById('sky');
const gfx = canvas.getContext('2d');
canvas.width = width * window.devicePixelRatio;
canvas.height = height * window.devicePixelRatio;
gfx.width = width * window.devicePixelRatio;
gfx.height = height * window.devicePixelRatio;

gfx.scale(window.devicePixelRatio, window.devicePixelRatio);

let player = new Player(width, height);
let asteroids = [];
let asteroidTheta = 0;
let asteroidSpeed = 1;


function spawnAsteroid(theta) {
  let x = width / 2;
  let y = height / 2;
  let velX = Math.cos(theta) * asteroidSpeed;
  let velY = Math.sin(theta) * asteroidSpeed;
  let r = 6;
  asteroids.push(new Asteroid(x, y, velX, velY, r, width, height));
}

function spawnNextAsteroid() {
  let theta = asteroidTheta;
  spawnAsteroid(asteroidTheta);
  spawnAsteroid(asteroidTheta + 2 * Math.PI / 3);
  spawnAsteroid(asteroidTheta + 4 * Math.PI / 3);
  spawnAsteroid(-asteroidTheta / 2);
  spawnAsteroid(-asteroidTheta / 2 + Math.PI);
  asteroidTheta += 0.2;
}

function alive(player, asteroids) {
  for (let asteroid of asteroids) {
    let dx = player.x - asteroid.x;
    let dy = player.y - asteroid.y;
    if (asteroid.r * asteroid.r > dx * dx + dy * dy) {
      return false;
    }
  }
  return true;
}

function drawPlayer(x, y, theta, fill) {
  gfx.save();
  gfx.translate(x, y);
  gfx.rotate(theta + Math.PI / 2);
  gfx.beginPath();
  gfx.moveTo(8, 0);
  gfx.lineTo(0, 8);
  gfx.lineTo(-8, 0);
  gfx.lineTo(0, -8);
  gfx.closePath();
  if (fill) {
    gfx.fill();
  } else {
    gfx.stroke();
  }
  gfx.restore();
}

let frame = 0;
function draw() {
  let dt = 1;
  let results = search();
  let theta = 0, thrust = 0;
  let maxDist = 0;
  results.sort((a, b) => {
    return b.score - a.score;
  });
  for (let result of results) {
    if (result.alive && result.steps.length > maxDist) {
      theta = result.theta;
      thrust = result.thrust;
      maxDist = result.steps.length;
      if (maxDist === SIM_DURATION) {
        break;
      }
    }
  }

  player.step(dt, theta, thrust);
  asteroids = asteroids.filter((a) => {
    return a.alive;
  });
  for (let asteroid of asteroids) {
    asteroid.step(dt);
  }
  gfx.fillStyle = 'black';
  if (!alive(player, asteroids)) {
    gfx.fillStyle = 'red';
  }

  gfx.fillRect(0, 0, width, height);

  for (let result of results) {
    if (result.alive) {
      gfx.strokeStyle = '#00ff0030';
    } else {
      gfx.strokeStyle = '#ff000030';
    }
    if (result.steps.length > 1) {
      gfx.beginPath();
      let lastX = width / 2;
      let lastY = height / 2;
      for (let step of result.steps) {
        let wrappedX = Math.abs(step.x - lastX) > width / 2;
        let wrappedY = Math.abs(step.y - lastY) > height / 2;
        if (!wrappedX && !wrappedY) {
          gfx.lineTo(step.x, step.y);
        } else {
          let unwrapStepX = step.x;
          let unwrapStepY = step.y;
          let unwrapLastX = lastX;
          let unwrapLastY = lastY;

          if (wrappedX) {
            if (lastX < width / 2) {
              unwrapStepX -= width;
              unwrapLastX += width;
            } else {
              unwrapStepX += width;
              unwrapLastX -= width;
            }
          }
          if (wrappedY) {
            if (lastY < height / 2) {
              unwrapStepY -= height;
              unwrapLastY += height;
            } else {
              unwrapStepY += height;
              unwrapLastY -= height;
            }
          }

          gfx.lineTo(unwrapStepX, unwrapStepY);
          gfx.moveTo(unwrapLastX, unwrapLastY);
          gfx.lineTo(step.x, step.y);
        }
        lastX = step.x;
        lastY = step.y;
      }
      gfx.stroke();
    }
    // drawPlayer(result.x, result.y, 0, false);
  }

  gfx.fillStyle = 'white';
  gfx.strokeStyle = 'white';

  drawPlayer(player.x, player.y, 0, true);
  gfx.fillStyle = 'red';
  gfx.fillRect(player.x, player.y, 1, 1);

  for (let asteroid of asteroids) {
    gfx.beginPath();
    gfx.arc(asteroid.x, asteroid.y, asteroid.r, 0, 2 * Math.PI);
    gfx.stroke();
  }
  frame += 1;
  if (frame % 4 === 0) {
    spawnNextAsteroid();
  }

  requestAnimationFrame(draw);
}

const SIM_DURATION = 24;
const SIM_COUNT = 128;
function search() {
  let simCount = SIM_COUNT;
  let simDuration = SIM_DURATION;
  let results = [];

  let anyAlive = false;

  for (let i = 0; i < simCount; i++) {
    let inputs = [];

    for (let j = 0; j < simDuration; j++) {
      let thrust = 0.1 + Math.random() / 5;
      let theta = Math.random() * 2 * Math.PI;

      let input = {
        thrust: thrust,
        theta: theta,
      };
      inputs.push(input);
    }

    let result = simulate(player, asteroids, inputs);
    if (result.alive) {
      anyAlive = true;
    }
    results.push(result);

    if (!anyAlive && i === simCount - 1) {
      i = 0;
      simCount *= 2;
      if (simCount > 10000) {
        anyAlive = true;
      }
      if (simDuration > 4) {
        simDuration -= 1;
      }
    }
  }
  return results;
}

function simulate(basePlayer, baseAsteroids, inputs) {
  let dt = 1;
  let player = basePlayer.clone();
  let asteroids = baseAsteroids.map(ba => ba.clone());
  let steps = [];
  for (let input of inputs) {
    player.step(dt, input.theta, input.thrust);
    steps.push({
      x: player.x,
      y: player.y,
    });
    for (let asteroid of asteroids) {
      asteroid.step(dt);
    }
    dt += 0.25;
    if (!alive(player, asteroids)) {
      return {
        alive: false,
        x: player.x,
        y: player.y,
        thrust: inputs[0].thrust,
        theta: inputs[0].theta,
        steps: steps,
        score: 0,
      };
    }
  }
  let score = -(player.x - width / 2) * (player.x - width / 2) - (player.y - height / 2) * (player.y - height / 2);
  return {
    alive: true,
    x: player.x,
    y: player.y,
    thrust: inputs[0].thrust,
    theta: inputs[0].theta,
    steps: steps,
    score: score,
  };
}

draw();
