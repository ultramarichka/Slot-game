const SIZE ="230px";
const VISIBLE_SLOTS = 3;
const TOTAL_HEIGHT = SIZE*(VISIBLE_SLOTS+2);
//creates array of symbols filenames
const FILENAMES = [1,2,3,4,5,6,7,8].map((x)=>"assets/"+ x +".png");

//array of src-s of symbols(images)
let slotSymbols = FILENAMES.slice();
//creates array of reels id-s
let parents = [1,2,3,4].map((x)=>"reel-"+x);

let slotsDisplay = document.getElementById("slots-display");

//with argument filename returns element
function createSlotSymbol(filename, parentId) {
  let img = document.createElement("img");
  img.src = filename;
  img.className = "symbol";
  let parent = document.getElementById(parentId);
  parent.appendChild(img);
  return img;
}

let slotSymbolImageArray = [];
for (let i = 0; i<parents.length; i++){
  slotSymbolImageArray[i] = slotSymbols.map((x)=>createSlotSymbol(x, parents[i]));

  //parents[i].
}

slotsDisplay.style.height = 'calc(5*' + SIZE +')';
/*
function setInitialSlotSymbolCoords(slotArray){ 
}*/

let firstSlotSymbol = slotSymbolImageArray[1][1];
let times= 0;
let prev = performance.now();

requestAnimationFrame(function moveSymbol(time){

  // assign coordinates
  let coords = firstSlotSymbol.getBoundingClientRect();
  firstSlotSymbol.style.top = coords.top + "1px";
  if (times++ < 50) {requestAnimationFrame(moveSymbol)};
});


