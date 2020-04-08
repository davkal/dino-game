// ES2015

/**
 * TODOS
 * - feedback for typed letter
 * - multiple letters after a while
 * - show/change speed
 * - more attackers
 * - more targets
 */

const MAX_STEPS = 60;
const speed = 6;
const steps = Math.floor(MAX_STEPS / speed);

const soundGameOver = new Audio("audio/gameover.mp3");
const soundDanger = new Audio("audio/danger.mp3");

let sceneWidth;
let sceneHeight;
let unit;
let margin;

let targetRadius;
let targetCenterX;
let targetCenterY;

let attackerRadius;
let attackerCenterX;
let attackerCenterY;

let distanceX;
let distanceY;
let attackers = [];
let control;

function setDimensions() {
  sceneWidth = window.innerWidth;
  sceneHeight = window.innerHeight;
  unit = sceneWidth / 100;
  margin = 3 * unit;

  targetRadius = 8 * unit;
  targetCenterX = sceneWidth - margin - targetRadius;
  targetCenterY = sceneHeight / 2;

  attackerRadius = 8 * unit;
  attackerCenterX = 0 + margin + attackerRadius;
  attackerCenterY = sceneHeight / 3;

  distanceX = d3
    .scaleLinear()
    .domain([steps, 0])
    .range([-attackerRadius, targetCenterX]);

  distanceY = d3.scaleLinear().domain([steps, 0]);
}

function getNextLetter() {
  const index = Math.floor(Math.random() * 26);
  return String.fromCharCode(65 + index);
}

function setScene() {
  d3.select(".title").classed("hidden", true);
  d3.select(".target")
    .classed("hidden", false)
    .style("left", targetCenterX - targetRadius)
    .style("top", targetCenterY - targetRadius)
    .style("width", targetRadius * 2)
    .style("height", targetRadius * 2);
}

function render() {
  d3.select(".attackers")
    .selectAll(".attacker")
    .data(attackers, (d) => d.letter)
    .join(
      (enter) =>
        enter
          .append("div")
          .classed("attacker", true)
          .style("width", attackerRadius * 2)
          .style("height", attackerRadius * 2)
          .style(
            "transform",
            (d) => `translate(${-2 * attackerRadius}px,${d.startY}px)`
          )
          .append("span")
          .classed("letter", true)
          .text((d) => d.letter),
      (update) =>
        update.style("transform", (d) => {
          const x = d.erased
            ? -2 * attackerRadius
            : distanceX(d.distance) - 2 * attackerRadius;
          const y = d.erased
            ? d.startY
            : distanceY.range([d.startY, targetCenterY - attackerRadius])(
                d.distance
              );
          return `translate(${x}px,${y}px)`;
        })
    );
}

function loop(elapsed) {
  // modify state
  for (const attacker of attackers) {
    attacker.distance = Math.max(attacker.distance - 1, 0);
    switch (attacker.distance) {
      case 0:
        soundGameOver.play();
        control.stop();
        setTimeout(reset, 5000);
        break;

      case 3:
        soundDanger.play();
        break;

      default:
        break;
    }
  }

  if (attackers.length === 0) {
    attackers.push(createAttacker());
  }

  // render state
  render();
}

function createAttacker() {
  const y = Math.random() * sceneHeight;
  return {
    letter: getNextLetter(),
    distance: steps,
    startX: 0,
    startY: y,
  };
}

function start() {
  setDimensions();
  setScene();
  return d3.interval(loop, 1000);
}

function reset() {
  control = undefined;
  d3.select(".title").classed("hidden", false);
  d3.select(".target").classed("hidden", true);
  attackers = [];
  render();
}

function handleKey(e) {
  if (e.key === " " && !control) {
    control = start();
    return;
  }

  for (const attacker of attackers) {
    if (attacker.letter === e.key.toUpperCase()) {
      attacker.erased = true;
      setTimeout(() => {
        attackers = attackers.filter((a) => !a.erased);
      }, 1000);
    }
  }
}

function onResize() {
  setDimensions();
  setScene();
}

document.addEventListener("keydown", handleKey);
window.addEventListener("resize", onResize);
