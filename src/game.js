/**
 * TODOS
 * - multiple letters after a while
 * - show/change speed
 * - more attackers
 * - more targets
 */

var MAX_STEPS = 50;
var DEFAULT_SPEED = 5;
var MIN_SPEED = 1;
var MAX_SPEED = 10;

var soundGameOver = new Audio("audio/gameover.mp3");
var soundDanger = new Audio("audio/danger.mp3");

var sceneWidth;
var sceneHeight;
var unit;
var margin;

var targetRadius;
var targetCenterX;
var targetCenterY;

var attackerRadius;
var attackerCenterX;
var attackerCenterY;

var steps;
var speed = DEFAULT_SPEED;
var distanceX;
var distanceY;
var attackers = [];
var control;

function setSpeed(change) {
  if (change) {
    speed += change;
    speed = Math.max(speed, MIN_SPEED);
    speed = Math.min(speed, MAX_SPEED);
  }
  steps = Math.floor(MAX_STEPS / speed);
}

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

function getNextCharCode() {
  return Math.floor(Math.random() * 26) + 65;
}

function setScene() {
  d3.select(".title").classed("hidden", true);
  d3.select(".target")
    .classed("hidden", false)
    .style("left", targetCenterX - targetRadius)
    .style("top", targetCenterY - targetRadius)
    .style("width", targetRadius * 2)
    .style("height", targetRadius * 2);
  d3.select("footer").classed("hidden", false);
  d3.select("#tempo").text(speed);
}

function render() {
  d3.select(".attackers")
    .selectAll(".attacker")
    .data(attackers, function (d) {
      return d.letter;
    })
    .join(
      function (enter) {
        return enter
          .append("div")
          .classed("attacker", true)
          .style("width", attackerRadius * 2)
          .style("height", attackerRadius * 2)
          .style("transform", function (d) {
            return [
              "translate(",
              -2 * attackerRadius,
              "px,",
              d.startY,
              "px)",
            ].join("");
          })
          .append("span")
          .classed("letter", true)
          .text(function (d) {
            return d.letter;
          });
      },
      function (update) {
        return update
          .classed("erased", function (d) {
            return d.erased;
          })
          .style("transform", function (d) {
            const x = d.erased
              ? -2 * attackerRadius
              : distanceX(d.distance) - 2 * attackerRadius;
            const y = d.erased
              ? d.startY
              : distanceY.range([d.startY, targetCenterY - attackerRadius])(
                  d.distance
                );
            return ["translate(", x, "px,", y, "px)"].join("");
          });
      }
    );
}

function loop(elapsed) {
  // modify state
  attackers.forEach(function (attacker) {
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
  });

  if (attackers.length === 0) {
    attackers.push(createAttacker());
  }

  // render state
  render();
}

function createAttacker() {
  var y = Math.random() * (sceneHeight - 2 * attackerRadius);
  var charCode = getNextCharCode();
  return {
    charCode: charCode,
    letter: String.fromCharCode(charCode),
    distance: steps,
    startX: 0,
    startY: y,
  };
}

function start() {
  setSpeed();
  setDimensions();
  setScene();
  return d3.interval(loop, 1000);
}

function reset() {
  control = undefined;
  d3.select(".title").classed("hidden", false);
  d3.select(".target").classed("hidden", true);
  d3.select("footer").classed("hidden", true);
  attackers = [];
  render();
}

function handleKey(e) {
  // Using keyCode to support older computers
  // console.log(e.keyCode);

  // SPACE
  if (e.keyCode === 32 && !control) {
    control = start();
    return;
  }

  // PLUS
  if (e.keyCode === 187) {
    onChangeSpeed(1);
    return;
  }

  // MINUS
  if (e.keyCode === 189) {
    onChangeSpeed(-1);
    return;
  }

  attackers.forEach(function (attacker) {
    if (attacker.charCode === e.keyCode) {
      attacker.erased = true;
      render();
      setTimeout(removeErased, 1000);
    }
  });
}

function removeErased() {
  attackers = attackers.filter(function (a) {
    return !a.erased;
  });
}

function onResize() {
  setDimensions();
  setScene();
}

function onChangeSpeed(change) {
  setSpeed(change);
  setDimensions();
  setScene();
}

document.addEventListener("keydown", handleKey);
window.addEventListener("resize", onResize);
