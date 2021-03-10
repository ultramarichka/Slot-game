const SIZE =230;
const VISIBLE_SLOTS = 3;
const TOTAL_HEIGHT = SIZE*(VISIBLE_SLOTS+2);
const HIDDEN_Y = SIZE*(VISIBLE_SLOTS+1);
//creates array of symbols filenames
const FILENAMES = [1,2,3,4,5,6,7,8].map((x)=>"assets/"+ x +".png");


//array of strings: src-s of symbols(images)
let slotSymbols = FILENAMES.slice();
//creates array of strings: reels id-s
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

// let slotSymbolImageArray = [];
// for (let i = 0; i<parents.length; i++){
//   slotSymbolImageArray[i] = slotSymbols.map((x)=>createSlotSymbol(x, parents[i]));
//   //parents[i].
// }

slotsDisplay.style.height = 'calc(5*' + SIZE +'px)';


function SlotSymbol(url){
// Declare symbol class
  this.url = url;
  this.img = document.createElement("img");
  this.img.src = this.url;
  this.img.className = "symbol";
  this.y = 0;
  return this;
}

SlotSymbol.prototype.attach = function(parentId){
  this.parentId = parentId;
  this.parent = document.getElementById(parentId);
  this.parent.appendChild(this.img);
}

SlotSymbol.prototype.setY = function(y){
  // y is a number
  this.y = y;
  this.img.style.top = ""+y+"px";
}

SlotSymbol.prototype.getY = function(){
  // y is a number
  return this.y;
}

SlotSymbol.prototype.spin = function(){
  window.stopped = false;
  let symb = this;
  let startTime = performance.now();
  requestAnimationFrame(
    function spinOneSymbol(time, speed=240.0/1000.0*1.0){
      if (window.stopped) { return };
      let y0 =symb.getY();
      if(y0 < HIDDEN_Y ){
        let newY = y0 + speed*(time- startTime);
        symb.setY(newY);
        requestAnimationFrame(spinOneSymbol);
      }else{
        symb.setY(0);
      }
    }
  );
}



reel = [1,2,3,4]
reel = reel.map(function (x){
  let symb = new SlotSymbol(FILENAMES[x-1]);
  symb.setY(x*SIZE);
  symb.attach('reel-1');
  return symb;
});

function spin(){
  window.stopped = false;
  reel[0].spin();
  reel[1].spin();
  reel[2].spin();
  reel[3].spin();

  // let elem = slotSymbolImageArray[0][0];
  // let startTime = performance.now();
  // requestAnimationFrame(
  //   function spinOneSymbol(time, duration=2000){
  //     if (window.stopped) { return };
  //     let progress = (time-startTime)/duration;
  //     if(progress < 1){
  //       let newY = String(Math.floor(progress*(TOTAL_HEIGHT-SIZE)))+"px";
  //       elem.style.top = newY;
  //       requestAnimationFrame(spinOneSymbol);
  //     }else{
  //       elem.style.top = 0;
  //     }
  //   }
  // );
}

function stop(){
  console.log('Stopping');
  window.stopped = true;
}