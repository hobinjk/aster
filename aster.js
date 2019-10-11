class Asteroid {
  constructor(x, y, velX, velY, r, width, height) {
    this.x = x;
    this.y = y;
    this.velX = velX;
    this.velY = velY;
    this.width = width;
    this.height = height;
    this.r = r;
  }

  clone() {
    return new Asteroid(this.x, this.y, this.velX, this.velY, this.r,
                        this.width, this.height);
  }

  stateAfter(dt) {
    let newX = this.x + this.velX * dt;
    let newY = this.y + this.velY * dt;
    if (newX < -this.r) {
      newX += this.width + 2 * this.r;
    } else if (newX > this.width + this.r) {
      newX -= this.width + 2 * this.r;
    }
    if (newY < -this.r) {
      newY += this.height + 2 * this.r;
    } else if (newY > this.height + this.r) {
      newY -= this.height + 2 * this.r;
    }

    return {
      x: newX,
      y: newY,
    };
  }

  step(dt) {
    let newState = this.stateAfter(dt);
    this.x = newState.x;
    this.y = newState.y;
  }
}

class Player {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.x = width / 2;
    this.y = height / 2;
    this.theta = 0;
    this.velX = 0;
    this.velY = 0;
    this.velMax = 3;
  }

  clone() {
    let p = new Player(this.width, this.height);
    p.x = this.x;
    p.y = this.y;
    p.theta = this.theta;
    p.velX = this.velX;
    p.velY = this.velY;
    return p;
  }

  stateAfter(dt, dTheta, thrust) {
    let newTheta = this.theta + dTheta;
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
    if (newX < 0) {
      newX += this.width;
    } else if (newX > this.width) {
      newX -= this.width;
    }
    if (newY < 0) {
      newY += this.height;
    } else if (newY > this.height) {
      newY -= this.height;
    }

    return {
      x: newX,
      y: newY,
      velX: newVelX,
      velY: newVelY,
      theta: newTheta
    };
  }

  step(dt, dTheta, thrust) {
    let newState = this.stateAfter(dt, dTheta, thrust);
    this.x = newState.x;
    this.y = newState.y;
    this.velX = newState.velX;
    this.velY = newState.velY;
    this.theta = newState.theta;
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
for (let i = 0; i < 30; i++) {
  let x = Math.random() * width;
  let y = Math.random() * height;
  let theta = Math.random() * Math.PI * 2;
  let velX = Math.cos(theta) * (Math.random() + 1);
  let velY = Math.sin(theta) * (Math.random() + 1);
  let r = Math.random() * 30 + 10;
  asteroids.push(new Asteroid(x, y, velX, velY, r, width, height));
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
  gfx.moveTo(0, -8);
  gfx.lineTo(5, 8);
  gfx.lineTo(-5, 8);
  gfx.closePath();
  if (fill) {
    gfx.fill();
  } else {
    gfx.stroke();
  }
  gfx.restore();
}

function draw() {
  let dt = 1;
  let results = search();
  let dTheta = 0.1, thrust = 0;
  for (let result of results) {
    if (result.alive) {
      dTheta = result.dTheta;
      thrust = result.thrust;
      break;
    }
  }

  player.step(dt, dTheta, thrust);
  for (let asteroid of asteroids) {
    asteroid.step(dt);
  }
  gfx.fillStyle = 'black';
  if (!alive(player, asteroids)) {
    gfx.fillStyle = 'red';
  }

  gfx.fillRect(0, 0, width, height);
  gfx.fillStyle = 'white';
  gfx.strokeStyle = 'white';

  drawPlayer(player.x, player.y, player.theta, true);
  gfx.fillStyle = 'red';
  gfx.fillRect(player.x, player.y, 1, 1);

  for (let asteroid of asteroids) {
    gfx.beginPath();
    gfx.arc(asteroid.x, asteroid.y, asteroid.r, 0, 2 * Math.PI);
    gfx.stroke();
  }

  for (let result of results) {
    if (result.alive) {
      gfx.strokeStyle = 'green';
    } else {
      gfx.strokeStyle = 'red';
    }
    drawPlayer(result.x, result.y, result.theta, false);
  }

  requestAnimationFrame(draw);
}

setInterval(function() {
  let x = player.x + width / 2;
  let y = player.y + height / 2;
  if (x > width) {
    x -= width;
  }
  if (y > height) {
    y -= height;
  }
  let theta = Math.random() * 2 * Math.PI;
  let velX = Math.cos(theta) * (Math.random() + 1);
  let velY = Math.sin(theta) * (Math.random() + 1);
  let r = Math.random() * 30 + 10;
  asteroids.push(new Asteroid(x, y, velX, velY, r, width, height));
}, 10000);

function randomInput(weight) {
  let rotating = Math.random();
  let low = 1 + weight;
  let mid = 2;
  let high = 2 - weight;
  let total = low + mid + high;

  if (rotating < low/total) {
    return -1;
  } else if (rotating < (low + mid)/total) {
    return 0;
  }
  return 1;
}

function search() {
  let simCount = 32;
  let simDuration = 16;

  let results = [];

  let anyAlive = false;

  for (let i = 0; i < simCount; i++) {
    let inputs = [];

    for (let j = 0; j < simDuration; j++) {
      let thrust = 0.1;
      let dTheta = 0.1 * randomInput(i/simCount);

      let input = {
        thrust: thrust,
        dTheta: dTheta,
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
      anyAlive = true;
      simCount *= 2;
    }
  }
  return results;
}

function simulate(basePlayer, baseAsteroids, inputs) {
  let dt = 1;
  let player = basePlayer.clone();
  let asteroids = baseAsteroids.map(ba => ba.clone());
  for (let input of inputs) {
    player.step(dt, input.dTheta, input.thrust);
    for (let asteroid of asteroids) {
      asteroid.step(dt, input.dTheta, input.thrust);
    }
    dt += 0.25;
    if (!alive(player, asteroids)) {
      return {
        alive: false,
        x: player.x,
        y: player.y,
        theta: player.theta,
        thrust: inputs[0].thrust,
        dTheta: inputs[0].dTheta,
      };
    }
  }
  return {
    alive: true,
    x: player.x,
    y: player.y,
    theta: player.theta,
    thrust: inputs[0].thrust,
    dTheta: inputs[0].dTheta,
  };
}

draw();
