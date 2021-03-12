const SIZE = 230;
const VISIBLE_SLOTS = 3;
//creates array of symbols filenames
const FILENAMES = [1, 2, 3, 4, 5, 6, 7, 8].map((x) => "assets/" + x + ".png");
document.documentElement.style.setProperty('--size',SIZE+'px')
/** SlotSymbol class constructor
 * 
 * @param {*} url 
 */
function SlotSymbol(src, parentId) {
  // Declare symbol class
  this.src = src;
  this.img = document.createElement("img");
  this.img.src = this.src;
  this.img.className = "slotSymbol";
  this.y = 0;
  this.launched = false;
  // attcach to the parent container
  this.parentId = parentId;
  this.parent = document.getElementById(parentId);
  this.parent.appendChild(this.img);
  return this;
}

SlotSymbol.prototype.setY = function (y) {
  // y is a number
  this.y = y;
  this.img.style.top = "" + y + "px";
}

SlotSymbol.prototype.getY = function () {
  // y is a number
  return this.y;
}

/** Symbol pool helper class 
 * It's aware of the SlotSymbol class
 * which must have launched property
 * 
 * MAYBE: reimplement this as parralel arrays, so that SlotSymbol
 * doesn't have to know if it's launched or not
*/
function SymbolPool(url, parentId, count) {
  this._pool = [];
  for (let i = 0; i < count; i++) {
    this._pool.push(new SlotSymbol(url, parentId));
  }
}

SymbolPool.prototype.lease = function () {
  let index = this._pool.findIndex(
    //return unused symbol from this.symbolPool[symbolType]
    function (symb) {
      return !symb.launched;
    }
  );
  if (index == -1) {
    alert("Symbol pool exhausted -- IMPOSSIBLE! Check the logic")
  };
  this._pool[index].launched = true;
  return this._pool[index];
}

/** Reel class */
function Reel(id, rate, symbolSize) {
  this.rate = rate;
  this.id = id;
  this.symbolSize = symbolSize ? symbolSize : SIZE;
  this.visibleSymbolIncrements = [];
  for (let i = 0; i < VISIBLE_SLOTS + 1; i++) {
    this.visibleSymbolIncrements.push(i);
  }
  // create a preloaded symbolPool for each symbolType
  this.symbolTypePool = FILENAMES.map(
    function (src) {
      return new SymbolPool(src, id, VISIBLE_SLOTS + 2);
    }
  )
  this.generatedSymbolTypes = [];
  this.visibleSymbols = [];
  this.update(0);
}

Reel.prototype.calculateCoordinate = function (totalSpinTime, index) {
  return this.symbolSize * (totalSpinTime * this.rate - index + VISIBLE_SLOTS);
}

Reel.prototype.releaseVisibleSymbols = function () {
  this.visibleSymbols.forEach(
    function (symb) {
      if (!symb.launched) {
        throw Error("Asserion failure, all symbols in visibleSymbols must be launched")
      }
      symb.setY(0);
      symb.launched = false;
    }
  )
  this.visibleSymbols = [];
}

function NOP(x) {
  return "This function is just a NO-OP to prevent optimizing out the variables. Debugging only"
}

Reel.prototype.update = function (totalSpinTime) {
  NOP(this); // DEBUG ONLY, prevent optimization
  // Release the old visible symbols
  this.releaseVisibleSymbols();
  // calculate new visible symbols
  let bottomVisibleSymbolIndex = Math.floor(totalSpinTime * this.rate);
  this.visibleSymbolIndices = this.visibleSymbolIncrements.map(
    function (x) {
      return x + bottomVisibleSymbolIndex;
    }
  );

  for (let i = 0; i < this.visibleSymbolIndices.length; i++) {
    let symbolIndex = this.visibleSymbolIndices[i];
    // check if we generated the symbols, if not; do so
    if (typeof (this.generatedSymbolTypes[symbolIndex]) === "undefined") {
      this.generatedSymbolTypes[symbolIndex] = Math.floor(Math.random() * FILENAMES.length);
    }
    // update symbol coordinates
    let symb = this.symbolTypePool[this.generatedSymbolTypes[symbolIndex]].lease();
    symb.setY(this.calculateCoordinate(totalSpinTime, symbolIndex));
    this.visibleSymbols.push(symb);
  }
}

Reel.prototype.getMiddleSymbol = function () {
  let min = SIZE * (2 - 0.5);
  let max = SIZE * (2 + 0.5);
  //return middle symbol
  return this.visibleSymbols.find(
    function (symb) {
      return (min < symb.getY()) && (symb.getY() < max);
    }
  )
}


/** GameDisplay class */
GameDisplay = function () {
  let reelRates = [0.003, 0.004, 0.005, 0.002];
  let reelIds = [0, 1, 2, 3].map(
    function (x) {
      return "reel-" + x;
    }
  )

  this.reels = reelIds.map(
    function (x, i) {
      return new Reel(x, reelRates[i]);
    }
  )
  reelIds.map(
    function (id, i) {
      document.getElementById(id).style.left = SIZE * i + 'px';
    }
  )

  this.totalSpinTime = 0;
  this.totalSpinTimeOld = 0;
  this.latestSpinStartTime = null;
  this.winningSymbols = [];
  this.stopped = true;
  return this;
}

GameDisplay.prototype.reset = function(){
  this.totalSpinTimeOld = 0;
  this.update(this.latestSpinStartTime); // see how GameDisplay update works to understand
}

GameDisplay.prototype.update = function (time) {
  this.totalSpinTime = this.totalSpinTimeOld + time - this.latestSpinStartTime;
  for (let i = 0; i < this.reels.length; i++) {
    this.reels[i].update(this.totalSpinTime);
  }
}

GameDisplay.prototype.spin = function () {
  this.removeHighlight();
  this.latestSpinStartTime = performance.now();
  let gameDisplay = this; //ensure we have access to the instance within the callbacks
  requestAnimationFrame(
    function GameDisplayTick(time) {
      if (gameDisplay.stopped) { return };
      gameDisplay.update(time);
      requestAnimationFrame(GameDisplayTick);
    }
  )
}

GameDisplay.prototype.stop = function () {
  //TODO: MAYBE remove the global stop flag and put it inside GameDisplay
  this.stopped = true;
  this.totalSpinTimeOld = this.totalSpinTime;
  this.win();
}

GameDisplay.prototype.getSymbolsOnTheWinningLine = function () {
  // from each reel get a symbol on the winning line and return
  return this.reels.map(
    function (reel) {
      return reel.getMiddleSymbol();
    }
  )
}

GameDisplay.prototype.highlightWinningSymbols = function () {
  this.winningSymbols.forEach(function (symb) {
    symb.img.style.border = "10px solid red";
  });
}
GameDisplay.prototype.removeHighlight = function () {
  this.winningSymbols.forEach(function (symb) {
    symb.img.style.border = "none";
  });
}

GameDisplay.prototype.win = function () {
  // get 4 symbols on the winning line
  let symbolsOnTheWinningLine = this.getSymbolsOnTheWinningLine();
  // check how many are of the same type
  function countSameType(symbolArray, types) {
    let outputArray = [];
    for (let i = 0; i < types.length; i++) {
      outputArray[i] = symbolArray.filter(
        function (symb) {
          return symb.src === types[i];
        }
      );
    }
    return outputArray;
  }
  let symbolCount = countSameType(symbolsOnTheWinningLine, FILENAMES);
  let scores = symbolCount.map(
    function (arr) {
      return arr.length;
    }
  )
  // if 3 are the same -- highlight
  let winningType = scores.findIndex(
    function (count) {
      return count >= 3;
    }
  )
  if (winningType < 0) {
    return;
  }

  this.winningSymbols = symbolCount[winningType];
  this.highlightWinningSymbols();

}

const gameDisplay = new GameDisplay();

function spin() {
  if (gameDisplay.stopped) { //"debounce"
    gameDisplay.stopped = false;
    gameDisplay.spin();
  }
}

function stop() {
  gameDisplay.stop()
}

function refresh() {
  if(!gameDisplay.stopped){return};
  gameDisplay.reset();
}