/**
 * TODOS
 * - more attackers
 * - more targets
 */

var MAX_STEPS = 50;
var DEFAULT_SPEED = 3;
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
var attackerSize = 1;
var attackerCount = 0;
var attackersPerLevel = 10;
var attackerTypes = [
  { type: 1, size: 3 }, // Trex
  { type: 2, size: 2 }, // Velo
  { type: 3, size: 1 }, // Pter
];

function setSpeed(change) {
  if (change) {
    speed += change;
    speed = Math.max(speed, MIN_SPEED);
    speed = Math.min(speed, MAX_SPEED);
  }
  steps = Math.floor(MAX_STEPS / speed);
  d3.select("#tempo").text(speed);
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
    .range([-attackerRadius, targetCenterX - 2 * attackerRadius]);

  distanceY = d3.scaleLinear().domain([steps, 0]);
}

function getNextCharCode() {
  return d3
    .shuffle("ABCDEFGHIJKLMNOPQRSTUVXYZ1234567890".split(""))[0]
    .charCodeAt(0);
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

function renderLetters(attacker) {
  d3.select(this)
    .selectAll("span")
    .data(attacker.letters)
    .join("span")
    .classed("letter", true)
    .classed("typed", function (d) {
      return d.typed;
    })
    .text(function (d) {
      return d.letter;
    });
}

function render() {
  d3.select(".attackers")
    .selectAll(".attacker")
    .data(attackers, function (d) {
      return d.id;
    })
    .join(
      function (enter) {
        return enter
          .append("div")
          .classed("attacker", true)
          .style("width", attackerRadius * 2)
          .style("height", attackerRadius * 2)
          .style("background-image", function (d) {
            return ['url("images/attacker', d.type, '.png")'].join("");
          })
          .style("transform", function (d) {
            return [
              "translate(",
              -2 * attackerRadius,
              "px,",
              d.startY,
              "px)",
            ].join("");
          })
          .each(renderLetters);
      },
      function (update) {
        return update
          .classed("erased", function (d) {
            return d.erased;
          })
          .style("transform", function (d) {
            const x = d.erased ? -2 * attackerRadius : distanceX(d.distance);
            const y = d.erased
              ? d.startY
              : distanceY.range([d.startY, targetCenterY - attackerRadius])(
                  d.distance
                );
            return ["translate(", x, "px,", y, "px)"].join("");
          })
          .each(renderLetters);
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
    attackerCount++;
    attackerSize = Math.ceil(attackerCount / attackersPerLevel);
    attackers.push(createAttacker(attackerSize));
  }

  // render state
  render();
}

function createAttacker(size) {
  var y = Math.random() * (sceneHeight - 2 * attackerRadius);
  var typeIndex = Math.floor(Math.random() * attackerTypes.length);
  var type = attackerTypes[typeIndex];
  var letters = [];
  for (var i = 0; i < size; i++) {
    var charCode = getNextCharCode();
    letters.push({
      charCode: charCode,
      letter: String.fromCharCode(charCode),
    });
  }
  return {
    id: +new Date(),
    letters: letters,
    letterIndex: 0,
    distance: steps,
    startX: 0,
    startY: y,
    type: type.type,
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
  attackers = [];
  attackerSize = 1;
  attackerCount = 0;
  render();
}

function handleKey(e) {
  // Using keyCode to support older computers
  console.log(e.keyCode);

  // SPACE
  if (e.keyCode === 32 && !control) {
    control = start();
    return;
  }

  // PLUS
  if (e.keyCode === 187 || (!control && e.keyCode === 70)) {
    onChangeSpeed(1);
    return;
  }

  // MINUS
  if (e.keyCode === 189 || (!control && e.keyCode === 83)) {
    onChangeSpeed(-1);
    return;
  }

  attackers.forEach(function (attacker) {
    if (attacker.letters[attacker.letterIndex].charCode === e.keyCode) {
      attacker.letters[attacker.letterIndex].typed = true;
      attacker.letterIndex++;
      attacker.erased = attacker.letterIndex === attacker.letters.length;
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
  if (control) {
    setDimensions();
    setScene();
  }
}

onChangeSpeed();
document.addEventListener("keydown", handleKey);
window.addEventListener("resize", onResize);
