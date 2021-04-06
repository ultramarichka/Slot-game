const SIZE = 230;
const VISIBLE_SLOTS = 3;
//creates array of symbols filenames
const FILENAMES = [1, 2, 3, 4, 5, 6, 7, 8].map((x) => "assets/" + x + ".png");
document.documentElement.style.setProperty('--size',SIZE+'px')

class SlotSymbol {
  constructor(src, parentId){
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
  }
  setY(y) {
    // y is a number
    this.y = y;
    this.img.style.top = `${y}px`;
  }
  getY(){
    return this.y;
  }
}


/** Symbol pool helper class 
 * It's aware of the SlotSymbol class
 * which must have launched property
 * 
*/
class SymbolPool{
  constructor(url, parentId, count) {
    this._pool = [];
    for (let i = 0; i < count; i++) {
      this._pool.push(new SlotSymbol(url, parentId));
    }
  }
  lease() {
    //return unused symbol from this.symbolPool[symbolType]
    let index = this._pool.findIndex(symb => !symb.launched);
    if (index == -1) { alert("Symbol pool exhausted -- IMPOSSIBLE! Check the logic");}
    this._pool[index].launched = true;
    return this._pool[index];
  }
}

/** Reel class */
class Reel{
  constructor(id, rate, symbolSize) {
    this.rate = rate;
    this.id = id;
    this.symbolSize = symbolSize ? symbolSize : SIZE;
    this.visibleSymbolIncrements = [];
    for (let i = 0; i < VISIBLE_SLOTS + 1; i++) {
      this.visibleSymbolIncrements.push(i);
    }
    // create a preloaded symbolPool for each symbolType
    this.symbolTypePool = FILENAMES.map(src => new SymbolPool(src, id, VISIBLE_SLOTS + 2))
    this.generatedSymbolTypes = [];
    this.visibleSymbols = [];
    this.update(0);
  }
  calculateCoordinate(totalSpinTime, index) {
    return this.symbolSize * (totalSpinTime * this.rate - index + VISIBLE_SLOTS);
  }
  releaseVisibleSymbols() {
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
  update(totalSpinTime) {
    NOP(this); // DEBUG ONLY, prevent optimization
    // Release the old visible symbols
    this.releaseVisibleSymbols();
    // calculate new visible symbols
    let bottomVisibleSymbolIndex = Math.floor(totalSpinTime * this.rate);
    this.visibleSymbolIndices = this.visibleSymbolIncrements.map(x => x + bottomVisibleSymbolIndex);

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
  getMiddleSymbol() {
    let min = SIZE * (2 - 0.5);
    let max = SIZE * (2 + 0.5);
    //return middle symbol
    return this.visibleSymbols.find((symb) => (min < symb.getY()) && (symb.getY() < max));
  }
  setReelInTheMiddle() {  
    if( (this.visibleSymbols[0].getY()) > 0 ){
      this.visibleSymbols.forEach((symb, i) => symb.setY( SIZE * (i+1))); 
    }
  }
}

function NOP(x) {
  return "This function is just a NO-OP to prevent optimizing out the variables. Debugging only"
}


/** GameDisplay class */
class GameDisplay{
  constructor() {
    let reelRates = [0.002, 0.002, 0.002, 0.002];
    let reelIds = [0, 1, 2, 3].map(x => "reel-" + x);

    this.reels = reelIds.map((x, i) => new Reel(x, reelRates[i]));
    reelIds.map((id, i) => document.getElementById(id).style.left = SIZE * i + 'px');

    this.totalSpinTime = 0;
    this.totalSpinTimeOld = 0;
    this.latestSpinStartTime = null;
    this.winningSymbols = [];
    this.stopped = true;
    return this;
  }

  reset(){
    this.totalSpinTimeOld = 0;
    this.update(this.latestSpinStartTime); 
  }
  update(time) {
    this.totalSpinTime = this.totalSpinTimeOld + time - this.latestSpinStartTime;
    for (let i = 0; i < this.reels.length; i++) {
      this.reels[i].update(this.totalSpinTime);
    }
  }
  spin() {
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
  stop() {
  //TODO: MAYBE remove the global stop flag and put it inside GameDisplay
  this.stopped = true;
  this.totalSpinTimeOld = this.totalSpinTime;
  this.setSymbolsOnTheWinningLine();
  this.win();
  }
  getSymbolsOnTheWinningLine() {
    // from each reel get a symbol on the winning line and return
    return this.reels.map(reel => reel.getMiddleSymbol());
  }

  setSymbolsOnTheWinningLine() {
    return this.reels.map(reel => reel.setReelInTheMiddle());
  }
  highlightWinningSymbols() {
    alert("YOU WIN!");
    this.winningSymbols.forEach(symb => symb.img.classList.add("winningSymbol"));
  }
  removeHighlight() {
    this.winningSymbols.forEach(symb => symb.img.classList.remove("winningSymbol"));
  }

  win() {
  // get 4 symbols on the winning line
  let symbolsOnTheWinningLine = this.getSymbolsOnTheWinningLine();
  // check how many are of the same type
  function countSameType(symbolArray, types) {
    let outputArray = [];
    for (let i = 0; i < types.length; i++) {
      outputArray[i] = symbolArray.filter(symb => symb.src === types[i]);
    }
    return outputArray;
  }
  let symbolCount = countSameType(symbolsOnTheWinningLine, FILENAMES);
  let scores = symbolCount.map(arr => arr.length);
  // if 3 are the same -- highlight
  let winningType = scores.findIndex(count => count >= 3);
  if (winningType < 0) {
    return;
  }
  this.winningSymbols = symbolCount[winningType];
  this.highlightWinningSymbols();
  }
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