/* Leon Room Engine v4 — pixel art room decorator, Canvas 2D, no external deps */
(function () {
  'use strict';

  var ROOM_ID   = 'leon-room-overlay';
  var SAVE_BASE = 'leonRoom4_';
  var COLS      = 9;
  var WALL_OFFSET = 28;

  var T    = 44;   // recomputed
  var DPR  = 1;    // recomputed
  var ROWS = 7;    // recomputed

  var currentRoom = 'bedroom';
  var state       = { placed: [], floor: 'wood' };
  var selectedId  = null;
  var eraseMode   = false;
  var roomCanvas  = null;
  var roomCtx     = null;

  /* ─────────────────────────────────────────
     ROOM DEFINITIONS
  ───────────────────────────────────────── */
  var ROOM_DEFS = [
    { id:'bedroom', name:'卧室',  icon:'🛏',
      wall:'#ede5d8', wallStroke:'rgba(0,0,0,0.06)', base:'#c4a880', baseHi:'#d8bc98',
      floors:['wood','dark','pink','stone'], defaultFloor:'wood',
      items:['bed','dresser','shelf','bookcase','lamp','clock','window','rug','cat','toy',
             'bathtub','plant','photoframe','aircond','sofa','chair','desk','tv','tvstand','fridge','vase'] },
    { id:'living',  name:'客厅',  icon:'🛋',
      wall:'#e8e4f0', wallStroke:'rgba(90,60,140,0.06)', base:'#b8b0d0', baseHi:'#ccc4e8',
      floors:['wood','pink','stone'], defaultFloor:'wood',
      items:['sofa','coffeetable','tv','tvstand','bookcase','shelf','chair','lamp','clock',
             'window','rug','cat','plant','vase','photoframe','aircond','table','toy','piano'] },
    { id:'dining',  name:'餐厅',  icon:'🍽️',
      wall:'#f0eadc', wallStroke:'rgba(0,0,0,0.05)', base:'#ccb880', baseHi:'#ddd098',
      floors:['wood','stone'], defaultFloor:'wood',
      items:['diningtbl','chair','sideboard','winecabinet','teaset','lamp','clock','window',
             'rug','vase','plant','photoframe','shelf','table'] },
    { id:'kitchen', name:'厨房',  icon:'🍳',
      wall:'#e4ede6', wallStroke:'rgba(0,80,0,0.05)', base:'#98b898', baseHi:'#aacaaa',
      floors:['stone','wood'], defaultFloor:'stone',
      items:['stove','sink','fridge','counter','microwave','cabinet','coffeemaker',
             'table','chair','lamp','clock','window','plant','shelf'] },
    { id:'garden',  name:'花园',  icon:'🌸',
      wall:null, floors:['grass','stone'], defaultFloor:'grass',
      items:['plant','bigtree','bench','fountain','flowerbed','pond','swing','birdbath',
             'cat','vase','table','chair','lamp','clock'] },
  ];

  /* ─────────────────────────────────────────
     ITEMS (40 total)
  ───────────────────────────────────────── */
  var ITEMS = [
    // ── universal / bedroom ──
    { id:'bed',         name:'床',    w:2, h:3 },
    { id:'dresser',     name:'梳妆台',w:2, h:2 },
    { id:'shelf',       name:'书架',  w:1, h:3 },
    { id:'bookcase',    name:'书柜',  w:2, h:3 },
    { id:'lamp',        name:'台灯',  w:1, h:1 },
    { id:'clock',       name:'时钟',  w:1, h:1 },
    { id:'window',      name:'窗户',  w:2, h:2 },
    { id:'rug',         name:'地毯',  w:3, h:2 },
    { id:'cat',         name:'猫咪',  w:1, h:1 },
    { id:'toy',         name:'玩偶',  w:1, h:1 },
    { id:'bathtub',     name:'浴缸',  w:2, h:2 },
    { id:'plant',       name:'植物',  w:1, h:1 },
    { id:'vase',        name:'花瓶',  w:1, h:1 },
    { id:'photoframe',  name:'相框',  w:1, h:1 },
    { id:'aircond',     name:'空调',  w:2, h:1 },
    // ── living room ──
    { id:'sofa',        name:'沙发',  w:3, h:2 },
    { id:'coffeetable', name:'茶几',  w:2, h:1 },
    { id:'tv',          name:'电视',  w:2, h:2 },
    { id:'tvstand',     name:'电视柜',w:3, h:1 },
    { id:'chair',       name:'椅子',  w:1, h:1 },
    { id:'piano',       name:'钢琴',  w:3, h:2 },
    // ── bedroom / living ──
    { id:'desk',        name:'书桌',  w:2, h:2 },
    { id:'fridge',      name:'冰箱',  w:1, h:2 },
    { id:'table',       name:'圆桌',  w:2, h:2 },
    // ── dining room ──
    { id:'diningtbl',   name:'餐桌',  w:3, h:2 },
    { id:'sideboard',   name:'餐边柜',w:3, h:1 },
    { id:'winecabinet', name:'酒柜',  w:1, h:3 },
    { id:'teaset',      name:'茶具',  w:1, h:1 },
    // ── kitchen ──
    { id:'stove',       name:'灶台',  w:2, h:2 },
    { id:'sink',        name:'水槽',  w:1, h:2 },
    { id:'counter',     name:'料理台',w:3, h:1 },
    { id:'microwave',   name:'微波炉',w:1, h:1 },
    { id:'cabinet',     name:'橱柜',  w:2, h:2 },
    { id:'coffeemaker', name:'咖啡机',w:1, h:1 },
    // ── garden ──
    { id:'bench',       name:'长椅',  w:2, h:1 },
    { id:'fountain',    name:'喷泉',  w:2, h:2 },
    { id:'flowerbed',   name:'花圃',  w:2, h:1 },
    { id:'pond',        name:'水池',  w:2, h:2 },
    { id:'swing',       name:'秋千',  w:2, h:2 },
    { id:'bigtree',     name:'大树',  w:2, h:3 },
    { id:'birdbath',    name:'鸟浴盆',w:1, h:1 },
  ];

  /* ─────────────────────────────────────────
     FLOORS
  ───────────────────────────────────────── */
  var FLOORS = [
    { id:'wood',  name:'木地板', c:['#d4a76a','#c49458'] },
    { id:'dark',  name:'深木',   c:['#8a5c34','#7a4c28'] },
    { id:'stone', name:'石板',   c:['#c8c0b0','#b8b0a0'] },
    { id:'pink',  name:'粉毯',   c:['#f4d0e0','#e4c0d0'] },
    { id:'grass', name:'草地',   c:['#72c860','#62b050'] },
  ];

  /* ─────────────────────────────────────────
     DRAW HELPERS
  ───────────────────────────────────────── */
  function px(c,x,y,w,h,col){ c.fillStyle=col; c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h)); }
  function shadow(c,x,y,w,h){
    c.save();c.globalAlpha=0.20;c.fillStyle='#000';
    c.fillRect(Math.round(x+4),Math.round(y+5),Math.round(w),Math.round(h-4));c.restore();
  }
  function depthTint(c,x,y,w,h){
    var fh=Math.max(5,Math.round(h*.11));
    c.save();c.globalAlpha=0.27;c.fillStyle='#000';c.fillRect(Math.round(x),Math.round(y+h-fh),Math.round(w),fh);c.restore();
    c.save();c.globalAlpha=0.12;c.fillStyle='#fff';c.fillRect(Math.round(x),Math.round(y),Math.round(w),3);c.restore();
  }
  function ellipse(c,cx,cy,rx,ry,col,alpha){
    c.save();if(alpha!==undefined)c.globalAlpha=alpha;c.fillStyle=col;
    c.beginPath();c.ellipse(Math.round(cx),Math.round(cy),Math.round(rx),Math.round(ry),0,0,Math.PI*2);c.fill();c.restore();
  }

  /* ─────────────────────────────────────────
     DRAWERS
  ───────────────────────────────────────── */
  function drawBed(c,x,y,w,h){
    var hb=Math.round(h*.13),fb=Math.round(h*.10),mat=h-hb-fb;
    px(c,x,y,w,hb,'#6b4c28');px(c,x+3,y+2,w-6,hb-4,'#9a7444');
    var pw=Math.round((w-14)/2);
    px(c,x+4,y+hb+3,pw,Math.round(mat*.18),'#fff8f0');px(c,x+4,y+hb+3,pw,3,'#e8ddd0');
    px(c,x+8+pw,y+hb+3,pw,Math.round(mat*.18),'#fff8f0');px(c,x+8+pw,y+hb+3,pw,3,'#e8ddd0');
    var bly=y+hb+Math.round(mat*.20);
    px(c,x+2,bly,w-4,mat-Math.round(mat*.20),'#6888c0');
    px(c,x+2,bly,w-4,Math.round(mat*.16),'#5070a8');
    for(var i=x+14;i<x+w-4;i+=13)px(c,i,bly+4,2,mat-Math.round(mat*.22)-2,'#7898d0');
    px(c,x,y+h-fb,w,fb,'#6b4c28');px(c,x+3,y+h-fb+2,w-6,fb-4,'#9a7444');
    depthTint(c,x,y,w,h);
  }
  function drawDresser(c,x,y,w,h){
    var mh=Math.round(h*.42),bh=h-mh;
    px(c,x+4,y,w-8,mh,'#9a7038');px(c,x+6,y+2,w-12,mh-4,'#a8d8f0');px(c,x+8,y+4,w-16,mh-8,'#c8eeff');
    c.save();c.globalAlpha=0.35;px(c,x+8,y+4,8,mh-10,'#fff');c.restore();
    px(c,x,y+mh,w,bh,'#c89058');
    var dh=Math.round((bh-8)/2);
    for(var di=0;di<2;di++){var dy2=y+mh+4+di*(dh+2);px(c,x+4,dy2,w-8,dh,'#b88040');px(c,x+4,dy2,w-8,3,'#a07030');px(c,x+w/2-5,dy2+dh/2-3,10,6,'#d4b070');}
    depthTint(c,x,y+mh,w,bh);
  }
  function drawShelf(c,x,y,w,h){
    px(c,x,y,w,h,'#b87838');
    var s1=y+Math.round(h/3),s2=y+Math.round(2*h/3);
    px(c,x,s1,w,5,'#8a5c28');px(c,x,s2,w,5,'#8a5c28');
    var sH=Math.round(h/3),secY=[y,s1,s2];
    [{bx:2,col:'#e05050',sec:0},{bx:8,col:'#f08020',sec:0},{bx:14,col:'#40a040',sec:0},
     {bx:2,col:'#2070d0',sec:1},{bx:8,col:'#9040c0',sec:1},{bx:14,col:'#e0a020',sec:1},
     {bx:2,col:'#d05080',sec:2},{bx:8,col:'#40a0a0',sec:2}].forEach(function(b){
      var by=secY[b.sec]+6;px(c,x+b.bx,by,5,sH-12,b.col);px(c,x+b.bx,by,5,2,'rgba(255,255,255,0.25)');
    });
    px(c,x,y,3,h,'#8a5c28');px(c,x+w-3,y,3,h,'#8a5c28');
    depthTint(c,x,y,w,h);
  }
  function drawBookcase(c,x,y,w,h){
    // Wide 2-column bookcase
    px(c,x,y,w,h,'#a87030');
    px(c,x+3,y+3,w-6,h-6,'#c89048');
    // 3 horizontal shelves
    var sh=Math.round(h/3);
    for(var si=0;si<3;si++){
      px(c,x,y+si*sh,w,4,'#8a5820');
      // books on each shelf — left column and right column
      var by2=y+si*sh+5;
      var colors=[['#e05050','#3080d0','#40a040','#c06020'],['#9040c0','#e0a020','#d05080','#40a0c0']];
      var colW=Math.round(w/2)-4;
      for(var col=0;col<2;col++){
        var bx2=x+3+col*(colW+2);
        colors[col].forEach(function(bcolor,bi){
          if(bx2+bi*6+5<x+3+colW+col*(colW+2)) px(c,bx2+bi*6,by2,5,sh-9,bcolor);
        });
      }
    }
    // divider between columns
    px(c,x+w/2-1,y,3,h,'#8a5820');
    // sides
    px(c,x,y,3,h,'#8a5820');px(c,x+w-3,y,3,h,'#8a5820');
    // crown top
    px(c,x,y,w,5,'#7a4e18');px(c,x-2,y,w+4,3,'#7a4e18');
    depthTint(c,x,y,w,h);
  }
  function drawLamp(c,x,y,w,h){
    var cx=x+w/2;
    c.save();c.globalAlpha=0.15;c.fillStyle='#ffe080';
    c.beginPath();c.ellipse(Math.round(cx),Math.round(y+h*.28),Math.round(w*.65),Math.round(h*.16),0,0,Math.PI*2);c.fill();c.restore();
    px(c,cx-12,y,24,4,'#b88838');px(c,cx-10,y+4,20,5,'#d8a050');px(c,cx-8,y+9,16,5,'#f0c060');px(c,cx-6,y+14,12,3,'#ffe090');
    c.save();c.globalAlpha=0.4;px(c,cx-7,y+5,14,10,'#fff8d0');c.restore();
    px(c,cx-1,y+17,3,Math.round(h*.52),'#a07838');
    px(c,cx-10,y+Math.round(h*.73),20,Math.round(h*.24),'#b08838');px(c,cx-8,y+Math.round(h*.73),16,3,'#d0a050');
  }
  function drawClock(c,x,y,w,h){
    var cx=x+w/2,cy=y+h/2,r=Math.round(Math.min(w,h)/2)-3;
    ellipse(c,cx+2,cy+2,r,r,'#000',0.18);
    c.fillStyle='#c8904a';c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);c.fill();
    c.fillStyle='#f5f0e0';c.beginPath();c.arc(cx,cy,r-4,0,Math.PI*2);c.fill();
    [[0,-1],[0,1],[-1,0],[1,0]].forEach(function(d){px(c,cx+d[0]*(r-9)-1,cy+d[1]*(r-9)-1,3,3,'#555');});
    c.save();c.translate(cx,cy);c.rotate(-Math.PI/6);px(c,-1,-Math.round(r*.55),2,Math.round(r*.55),'#333');c.restore();
    c.save();c.translate(cx,cy);c.rotate(Math.PI/3);px(c,-1,-Math.round(r*.68),2,Math.round(r*.68),'#d03030');c.restore();
    px(c,cx-2,cy-2,4,4,'#333');
  }
  function drawWindow(c,x,y,w,h){
    px(c,x,y,w,5,'#b8a080');px(c,x+6,y+5,w-12,h-10,'#a8d8f0');px(c,x+8,y+7,w-16,h-14,'#c8eeff');
    px(c,x+10,y+10,15,5,'#fff');px(c,x+14,y+8,10,5,'#fff');px(c,x+w-24,y+12,16,5,'#fff');
    c.strokeStyle='#d0c0a0';c.lineWidth=3;c.strokeRect(x+5,y+4,w-10,h-8);
    px(c,x+w/2-1,y+4,3,h-8,'#d0c0a0');px(c,x+5,y+h/2-1,w-10,3,'#d0c0a0');
    px(c,x,y,7,h,'#f0c8d8');px(c,x+4,y,4,h,'#e0b0c8');px(c,x+w-7,y,7,h,'#f0c8d8');px(c,x+w-9,y,4,h,'#e0b0c8');
  }
  function drawRug(c,x,y,w,h){
    px(c,x,y,w,h,'#7a50a0');px(c,x+5,y+4,w-10,h-8,'#9060c0');px(c,x+10,y+8,w-20,h-16,'#c090e0');
    px(c,x+14,y+12,w-28,h-24,'#b080d0');
    var dcx=x+w/2,dcy=y+h/2;px(c,dcx-10,dcy-10,20,20,'#d8a8f0');px(c,dcx-7,dcy-7,14,14,'#c090e0');px(c,dcx-3,dcy-3,6,6,'#e8c0ff');
    [[18,18],[w-18,18],[18,h-18],[w-18,h-18]].forEach(function(d){px(c,x+d[0]-4,y+d[1]-4,8,8,'#e0b0f8');px(c,x+d[0]-2,y+d[1]-2,4,4,'#fff0ff');});
  }
  function drawCat(c,x,y,w,h){
    var cx=x+w/2;
    ellipse(c,cx,y+h-1,w/2-2,4,'#000',0.13);
    px(c,x+1,y+Math.round(h*.38),5,Math.round(h*.35),'#f0c060');px(c,x,y+Math.round(h*.20),4,Math.round(h*.22),'#f0c060');
    px(c,x+5,y+Math.round(h*.44),w-9,Math.round(h*.40),'#f0c060');px(c,x+6,y+Math.round(h*.46),w-12,Math.round(h*.30),'#e8b850');
    px(c,x+w-19,y+Math.round(h*.22),17,17,'#f0c060');
    px(c,x+w-18,y+Math.round(h*.10),6,9,'#f0c060');px(c,x+w-11,y+Math.round(h*.10),6,9,'#f0c060');
    px(c,x+w-17,y+Math.round(h*.12),4,6,'#f5a8bc');px(c,x+w-10,y+Math.round(h*.12),4,6,'#f5a8bc');
    px(c,x+w-13,y+Math.round(h*.28),4,3,'#2a2040');px(c,x+w-11,y+Math.round(h*.34),3,2,'#f5a0bc');
  }
  function drawToy(c,x,y,w,h){
    var cx=x+w/2;
    ellipse(c,cx,y+h-1,w/2-2,4,'#000',0.13);
    px(c,cx-9,y+Math.round(h*.45),18,Math.round(h*.42),'#f4c08a');
    px(c,cx-9,y+Math.round(h*.08),18,18,'#f4c08a');
    px(c,cx-11,y+Math.round(h*.02),8,9,'#f4c08a');px(c,cx+3,y+Math.round(h*.02),8,9,'#f4c08a');
    px(c,cx-10,y+Math.round(h*.04),6,6,'#f5a0b0');px(c,cx+4,y+Math.round(h*.04),6,6,'#f5a0b0');
    px(c,cx-6,y+Math.round(h*.14),3,3,'#2a2040');px(c,cx+3,y+Math.round(h*.14),3,3,'#2a2040');
    px(c,cx-2,y+Math.round(h*.20),4,3,'#f090a0');
    px(c,cx-7,y+Math.round(h*.42),14,5,'#f060a0');px(c,cx-2,y+Math.round(h*.40),4,7,'#d04080');
  }
  function drawBathtub(c,x,y,w,h){
    px(c,x+2,y+Math.round(h*.18),w-4,Math.round(h*.75),'#dcdcd4');px(c,x+4,y+Math.round(h*.22),w-8,Math.round(h*.68),'#eeeee6');
    px(c,x+5,y+Math.round(h*.26),w-10,Math.round(h*.55),'#80c8e8');px(c,x+5,y+Math.round(h*.26),w-10,8,'#a8ddf4');
    [[.22,.30],[.50,.28],[.75,.33],[.38,.42],[.62,.40]].forEach(function(b){ellipse(c,x+b[0]*w,y+b[1]*h,3,3,'#fff',0.65);});
    px(c,x,y+Math.round(h*.16),w,6,'#d0d0c8');px(c,x,y+Math.round(h*.16),w,2,'#eeeee6');
    px(c,x+w-13,y+Math.round(h*.07),7,Math.round(h*.12),'#b8b8b0');
    px(c,x+5,y+Math.round(h*.88),6,Math.round(h*.12),'#c0b8a8');px(c,x+w-11,y+Math.round(h*.88),6,Math.round(h*.12),'#c0b8a8');
    depthTint(c,x,y,w,h);
  }
  function drawPlant(c,x,y,w,h){
    var cx=x+w/2;
    ellipse(c,cx,y+h-1,w/2-1,4,'#000',0.14);
    px(c,cx-10,y+Math.round(h*.60),20,3,'#a06030');px(c,cx-9,y+Math.round(h*.63),18,Math.round(h*.34),'#c87840');
    px(c,cx-1,y+Math.round(h*.38),3,Math.round(h*.24),'#2a7020');
    px(c,cx-12,y+Math.round(h*.08),24,8,'#3a9030');px(c,cx-14,y+Math.round(h*.18),28,8,'#4aaa40');
    px(c,cx-12,y+Math.round(h*.28),24,8,'#3a9030');px(c,cx-8,y+Math.round(h*.38),16,6,'#4aa040');
  }
  function drawVase(c,x,y,w,h){
    var cx=x+w/2;ellipse(c,cx,y+h-1,w/2-2,4,'#000',0.12);
    px(c,cx-5,y+Math.round(h*.4),10,Math.round(h*.55),'#e87070');px(c,cx-7,y+Math.round(h*.5),14,Math.round(h*.38),'#d05858');
    px(c,cx-6,y+Math.round(h*.4),12,Math.round(h*.12),'#f09090');px(c,cx-4,y+Math.round(h*.36),8,5,'#d05858');
    [[-6,.08],[-1,.02],[5,.12]].forEach(function(fp,fi){
      var fc=['#f06080','#f0c030','#e050e0'][fi%3],fx=cx+fp[0],fy=y+fp[1]*h;
      px(c,fx-1,fy,3,Math.round(h*.28),'#3a9030');
      ellipse(c,fx,fy,5,5,fc);px(c,fx-2,fy-2,4,4,'rgba(255,255,255,0.3)');
    });
  }
  function drawPhotoFrame(c,x,y,w,h){
    // Wooden frame with photo inside
    px(c,x,y,w,h,'#9a7038');
    px(c,x+4,y+4,w-8,h-8,'#8a6028');
    // photo content — simple sunset/landscape
    px(c,x+5,y+5,w-10,h-10,'#88b8e0'); // sky
    px(c,x+5,y+Math.round(h*.55),w-10,Math.round(h*.4),'#68a850'); // grass
    // sun
    ellipse(c,x+w*.65,y+h*.25,6,6,'#f8c030');
    // silhouette tree
    px(c,x+Math.round(w*.25),y+Math.round(h*.35),3,Math.round(h*.2),'#3a5820');
    ellipse(c,x+w*.27,y+h*.3,7,6,'#3a7020');
    // inner frame shadow
    c.save();c.globalAlpha=0.25;c.strokeStyle='#000';c.lineWidth=2;
    c.strokeRect(x+5,y+5,w-10,h-10);c.restore();
  }
  function drawAirCond(c,x,y,w,h){
    // Wall-mount air conditioner
    px(c,x,y,w,h,'#e8e8e0');px(c,x+2,y+1,w-4,h-2,'#f0f0e8');
    // vents
    for(var v=0;v<4;v++) px(c,x+6,y+4+v*Math.round((h-10)/4),w-12,2,'#c8c8c0');
    // control panel
    px(c,x+w-22,y+3,18,h-6,'#e0e0d8');
    px(c,x+w-20,y+5,6,6,'#60e070'); // power light
    px(c,x+w-12,y+5,8,Math.round((h-8)/2),'#d0d0c8'); // display
    px(c,x+w-11,y+6,6,Math.round((h-10)/2),'#2040c0');
    // brand stripe
    px(c,x+4,y+2,w-30,3,'#3060c0');
    depthTint(c,x,y,w,h);
  }
  function drawSofa(c,x,y,w,h){
    var bk=Math.round(h*.42);
    px(c,x,y,8,h,'#5a4030');px(c,x+w-8,y,8,h,'#5a4030');
    px(c,x+8,y,w-16,bk,'#7a6050');px(c,x+10,y+3,w-20,bk-6,'#8a7060');
    px(c,x+w/2-12,y+5,24,bk-10,'#e0d0b8');px(c,x+w/2-10,y+7,20,bk-14,'#f0e0c8');
    px(c,x+8,y+bk,w-16,h-bk,'#6a5040');
    var cw2=Math.round((w-20)/3);
    for(var i=0;i<3;i++)px(c,x+10+i*(cw2+1),y+bk+3,cw2-1,h-bk-8,'#9a8070');
    px(c,x+4,y+h-7,5,7,'#7b5c32');px(c,x+w-9,y+h-7,5,7,'#7b5c32');
    depthTint(c,x,y,w,h);
  }
  function drawCoffeeTable(c,x,y,w,h){
    // Low 2×1 coffee table
    px(c,x+3,y+Math.round(h*.5),4,Math.round(h*.5),'#9a7038');
    px(c,x+w-7,y+Math.round(h*.5),4,Math.round(h*.5),'#9a7038');
    px(c,x,y+Math.round(h*.1),w,Math.round(h*.45),'#c8904a');
    px(c,x,y+Math.round(h*.1),w,4,'#a07030');px(c,x+2,y,w-4,Math.round(h*.15),'#c8904a');
    // decorations on top: remote + cup
    px(c,x+6,y+Math.round(h*.14),14,Math.round(h*.3),'#555');px(c,x+7,y+Math.round(h*.16),12,Math.round(h*.2),'#777');
    px(c,x+w-22,y+Math.round(h*.14),12,Math.round(h*.3),'#d05050');// cup
    px(c,x+w-21,y+Math.round(h*.16),10,Math.round(h*.2),'#c04040');
    depthTint(c,x,y,w,h);
  }
  function drawTV(c,x,y,w,h){
    var sh=Math.round(h*.72);
    px(c,x+w/2-8,y+sh,16,5,'#4a4a4a');px(c,x+w/2-14,y+sh+5,28,5,'#3a3a3a');
    px(c,x+2,y+2,w-4,sh-4,'#1a1a28');px(c,x+5,y+5,w-10,sh-10,'#182060');
    px(c,x+6,y+6,w-12,sh-12,'#2850c0');px(c,x+7,y+7,w-14,sh-14,'#3060d0');
    px(c,x+8,y+8,9,5,'rgba(255,255,255,0.22)');px(c,x+w-10,y+sh-8,4,4,'#40e060');
    depthTint(c,x,y,w,h);
  }
  function drawTVStand(c,x,y,w,h){
    // Wide low TV cabinet (3×1)
    px(c,x+4,y+Math.round(h*.7),5,Math.round(h*.3),'#8a6030');px(c,x+w-9,y+Math.round(h*.7),5,Math.round(h*.3),'#8a6030');
    px(c,x,y+3,w,Math.round(h*.68),'#c89050');px(c,x,y+3,w,4,'#a87030');px(c,x+2,y,w-4,6,'#c89050');
    // 3 cabinet sections
    var sw=Math.round(w/3);
    for(var si=0;si<3;si++){
      px(c,x+si*sw+2,y+7,sw-4,Math.round(h*.54),'#b88040');
      px(c,x+si*sw+2,y+7,sw-4,2,'#a07030');// door top shadow
      // knob
      px(c,x+si*sw+sw/2-3,y+Math.round(h*.32),6,4,'#d4b070');
    }
    // dividers
    for(var di=1;di<3;di++) px(c,x+di*sw-1,y+5,2,Math.round(h*.60),'#9a7030');
    depthTint(c,x,y,w,h);
  }
  function drawChair(c,x,y,w,h){
    px(c,x+2,y+Math.round(h*.58),4,Math.round(h*.42),'#7b5c32');px(c,x+w-6,y+Math.round(h*.58),4,Math.round(h*.42),'#7b5c32');
    px(c,x+2,y+Math.round(h*.48),w-4,Math.round(h*.30),'#6a8850');px(c,x+3,y+Math.round(h*.50),w-6,Math.round(h*.22),'#7a9860');
    px(c,x+3,y,w-6,Math.round(h*.50),'#4a6830');px(c,x+4,y+2,w-8,Math.round(h*.42),'#5a7840');px(c,x+2,y,w-4,6,'#7b5c32');
    depthTint(c,x,y,w,h);
  }
  function drawPiano(c,x,y,w,h){
    px(c,x,y,w,Math.round(h*.75),'#111118');px(c,x+2,y+2,w-4,Math.round(h*.68),'#1e1e28');
    var ky=y+Math.round(h*.40);px(c,x+3,ky,w-6,Math.round(h*.35),'#f0f0e8');
    var bkW=Math.round((w-14)/7);[0,1,3,4,5].forEach(function(pos){px(c,x+5+pos*(bkW+1),ky,bkW,Math.round(h*.2),'#111');});
    px(c,x,y,w,5,'#0a0a10');px(c,x+4,y+Math.round(h*.74),5,Math.round(h*.26),'#111');px(c,x+w-9,y+Math.round(h*.74),5,Math.round(h*.26),'#111');
    depthTint(c,x,y,w,h);
  }
  function drawDesk(c,x,y,w,h){
    px(c,x+2,y+Math.round(h*.62),5,Math.round(h*.38),'#8a6030');px(c,x+w-7,y+Math.round(h*.62),5,Math.round(h*.38),'#8a6030');
    px(c,x,y+4,w,Math.round(h*.58),'#c8904a');px(c,x,y+4,w,5,'#a87038');px(c,x,y,w,7,'#d4a05a');
    px(c,x+5,y+9,20,15,'#1a2a50');px(c,x+6,y+10,18,12,'#3870d8');px(c,x+7,y+11,6,4,'rgba(255,255,255,0.18)');
    px(c,x+13,y+23,9,4,'#9a7038');
    px(c,x+w-28,y+Math.round(h*.48),24,10,'#d8c8a0');
    depthTint(c,x,y,w,h);
  }
  function drawFridge(c,x,y,w,h){
    px(c,x,y,w,h,'#e8e8e0');px(c,x+2,y+2,w-4,h-4,'#f0f0e8');
    px(c,x,y+Math.round(h*.38),w,3,'#c8c8be');
    px(c,x+w-5,y+8,3,Math.round(h*.25),'#a0a098');px(c,x+w-5,y+Math.round(h*.38)+6,3,Math.round(h*.20),'#a0a098');
    px(c,x+4,y+5,4,4,'#60e880');
    depthTint(c,x,y,w,h);
  }
  function drawTable(c,x,y,w,h){
    px(c,x+3,y+Math.round(h*.58),4,Math.round(h*.42),'#9a7038');px(c,x+w-7,y+Math.round(h*.58),4,Math.round(h*.42),'#9a7038');
    px(c,x,y+5,w,Math.round(h*.52),'#c8904a');px(c,x,y+5,w,5,'#a07030');px(c,x+2,y,w-4,8,'#d4a060');
    var mx=Math.round(x+w/2-6);px(c,mx,y+9,12,13,'#d05050');px(c,mx+1,y+10,10,9,'#b84040');px(c,mx+10,y+12,4,6,'#b84040');
    depthTint(c,x,y,w,h);
  }
  // ── DINING ──
  function drawDiningTbl(c,x,y,w,h){
    px(c,x+4,y+Math.round(h*.65),5,Math.round(h*.35),'#9a7038');px(c,x+w-9,y+Math.round(h*.65),5,Math.round(h*.35),'#9a7038');
    px(c,x,y+4,w,Math.round(h*.60),'#d4a060');px(c,x,y+4,w,5,'#b08040');px(c,x+2,y,w-4,7,'#d4a060');
    // place settings
    [[x+w*.22,y+9],[x+w*.55,y+9],[x+w*.78,y+9]].forEach(function(p){
      px(c,p[0]-9,p[1],18,13,'#f0ece0');px(c,p[0]-7,p[1]+2,14,9,'#ddd8cc');
      px(c,p[0]-14,p[1]+3,3,8,'#c0b090');px(c,p[0]+10,p[1]+3,3,8,'#c0b090');
    });
    var ccx=Math.round(x+w/2);px(c,ccx-3,y+8,6,14,'#f5f0d0');px(c,ccx-2,y+4,4,5,'#ffe060');
    depthTint(c,x,y,w,h);
  }
  function drawSideboard(c,x,y,w,h){
    // Long low buffet cabinet (3×1)
    px(c,x+4,y+Math.round(h*.65),4,Math.round(h*.35),'#8a6030');px(c,x+w-8,y+Math.round(h*.65),4,Math.round(h*.35),'#8a6030');
    px(c,x,y+3,w,Math.round(h*.65),'#c0884a');px(c,x,y+3,w,4,'#a06828');px(c,x+2,y,w-4,6,'#c0884a');
    // 2 doors with decorative handles
    px(c,x+3,y+7,Math.round(w/2)-5,Math.round(h*.52),'#b07838');px(c,x+3,y+7,Math.round(w/2)-5,3,'#906022');
    px(c,x+Math.round(w/2)+2,y+7,Math.round(w/2)-5,Math.round(h*.52),'#b07838');px(c,x+Math.round(w/2)+2,y+7,Math.round(w/2)-5,3,'#906022');
    px(c,x+Math.round(w/4)-4,y+Math.round(h*.30),8,5,'#d4a060');px(c,x+Math.round(3*w/4)-4,y+Math.round(h*.30),8,5,'#d4a060');
    px(c,x+w/2-1,y+5,2,Math.round(h*.55),'#906022');// center divider
    // items on top
    px(c,x+12,y,14,5,'#e87070');// small vase
    px(c,x+w-26,y-2,12,5,'#fff8d0');// candle
    depthTint(c,x,y,w,h);
  }
  function drawWineCabinet(c,x,y,w,h){
    // Tall wine rack/cabinet (1×3)
    px(c,x,y,w,h,'#6a4020');px(c,x+2,y+2,w-4,h-4,'#7a5030');
    // rack grid for bottles
    var rows=3,rh=Math.round(h/rows);
    for(var ri=0;ri<rows;ri++){
      px(c,x,y+ri*rh,w,3,'#5a3010');
      // bottles (lying on their sides)
      var by3=y+ri*rh+6;
      // bottle 1
      px(c,x+3,by3,Math.round(w*.55),rh-10,'#3a7030');// body
      px(c,x+3+Math.round(w*.55),by3+Math.round((rh-10)*.3),Math.round(w*.25),Math.round((rh-10)*.4),'#2a5020');// neck
      px(c,x+4,by3+2,Math.round(w*.4),4,'rgba(255,255,255,0.2)');// glint
    }
    // glass door overlay
    c.save();c.globalAlpha=0.12;px(c,x+1,y+1,w-2,h-2,'#a0d0ff');c.restore();
    px(c,x,y,2,h,'#5a3010');px(c,x+w-2,y,2,h,'#5a3010');
    depthTint(c,x,y,w,h);
  }
  function drawTeaSet(c,x,y,w,h){
    var cx=x+w/2;
    ellipse(c,cx,y+h-1,w/2-1,4,'#000',0.12);
    // tray
    px(c,x+2,y+Math.round(h*.65),w-4,Math.round(h*.3),'#c8a060');px(c,x+4,y+Math.round(h*.68),w-8,Math.round(h*.22),'#d8b070');
    // teapot
    px(c,cx-8,y+Math.round(h*.3),16,Math.round(h*.38),'#e8604a');
    px(c,cx-6,y+Math.round(h*.3),12,Math.round(h*.1),'#f07060');// highlight
    px(c,cx-4,y+Math.round(h*.18),8,Math.round(h*.16),'#d85040');// spout
    px(c,cx+8,y+Math.round(h*.32),6,Math.round(h*.14),'#d85040');// handle
    px(c,cx-3,y+Math.round(h*.14),6,5,'#c04030');// lid
    // two cups
    px(c,x+3,y+Math.round(h*.68),10,Math.round(h*.2),'#e8604a');px(c,x+3,y+Math.round(h*.68),10,3,'#f07060');
    px(c,x+w-13,y+Math.round(h*.68),10,Math.round(h*.2),'#e8604a');
  }
  // ── KITCHEN ──
  function drawStove(c,x,y,w,h){
    px(c,x,y,w,h,'#c0c0b8');px(c,x+2,y+2,w-4,h-4,'#d0d0c8');
    var bPos=[[.25,.28],[.75,.28],[.25,.68],[.75,.68]];
    bPos.forEach(function(b){
      var bx2=x+b[0]*w,by2=y+b[1]*h,br=Math.round(Math.min(w,h)*.12);
      ellipse(c,bx2,by2,br+2,br+2,'#808080');ellipse(c,bx2,by2,br,br,'#505050');ellipse(c,bx2,by2,br-3,br-3,'#404040');
    });
    for(var k=0;k<4;k++) px(c,x+6+k*Math.round((w-12)/4),y+3,Math.round((w-12)/4)-2,4,'#888');
    // pot on back left burner
    px(c,x+Math.round(w*.25)-8,y+Math.round(h*.28)-6,16,12,'#c06030');px(c,x+Math.round(w*.25)-7,y+Math.round(h*.28)-5,14,8,'#d07040');
    depthTint(c,x,y,w,h);
  }
  function drawSink(c,x,y,w,h){
    px(c,x,y,w,h,'#e0e0d8');px(c,x+2,y+2,w-4,h-4,'#eeeee6');
    var bx2=x+4,by2=y+Math.round(h*.30),bw=w-8,bh2=Math.round(h*.45);
    px(c,bx2,by2,bw,bh2,'#c8ccd0');px(c,bx2+2,by2+2,bw-4,bh2-4,'#b0b8c0');
    px(c,bx2+2,by2+2,bw-4,4,'rgba(160,200,255,0.5)');
    px(c,x+w/2-2,y+8,4,Math.round(h*.22),'#c0c0b8');px(c,x+w/2-6,y+8,12,5,'#d0d0c8');
    px(c,x+w/2-3,by2+bh2-6,6,6,'#8090a0');
    px(c,x+4,y+Math.round(h*.78),w-8,Math.round(h*.18),'#d8d8d0');
    depthTint(c,x,y,w,h);
  }
  function drawCounter(c,x,y,w,h){
    // Kitchen counter/worktop (3×1)
    px(c,x,y,w,h,'#e8e4d8');px(c,x,y,w,Math.round(h*.35),'#c8c4b0');// countertop
    px(c,x,y,w,4,'#a8a490');// edge strip
    // cabinet doors below
    var sw=Math.round(w/3);
    for(var si=0;si<3;si++){
      px(c,x+si*sw+2,y+Math.round(h*.36),sw-4,Math.round(h*.62),'#dedad0');
      px(c,x+si*sw+2,y+Math.round(h*.36),sw-4,2,'#c0bcb0');// top shadow
      px(c,x+si*sw+sw/2-4,y+Math.round(h*.62),8,4,'#b0ac9c');// handle
    }
    // items on counter
    px(c,x+6,y+5,8,Math.round(h*.28),'#e06050');// spice jar
    px(c,x+18,y+6,8,Math.round(h*.24),'#50c050');// herb pot
    px(c,x+w-16,y+6,10,Math.round(h*.26),'#d8c8a0');// cutting board
    depthTint(c,x,y,w,h);
  }
  function drawMicrowave(c,x,y,w,h){
    px(c,x,y,w,h,'#c0c0b8');px(c,x+2,y+2,w-4,h-4,'#d0d0c8');
    // door with window
    px(c,x+2,y+3,Math.round(w*.62),h-5,'#a0a098');
    px(c,x+5,y+6,Math.round(w*.55)-4,h-12,'#1a1a20');// window
    px(c,x+7,y+8,Math.round(w*.45)-2,h-16,'#203050');// screen
    px(c,x+8,y+9,8,4,'rgba(255,255,255,0.15)');// glint
    // door handle
    px(c,x+Math.round(w*.62),y+h/2-6,4,12,'#888880');
    // control panel
    px(c,x+Math.round(w*.66),y+4,w-Math.round(w*.66)-4,h-8,'#b8b8b0');
    px(c,x+Math.round(w*.68),y+6,Math.round(w*.12),Math.round((h-12)/3),'#2a4080');// buttons
    px(c,x+Math.round(w*.68),y+8+Math.round((h-12)/3),Math.round(w*.12),Math.round((h-12)/3),'#2a4080');
    px(c,x+Math.round(w*.82),y+5,Math.round(w*.12),h-10,'#3060a0');// turn dial
    depthTint(c,x,y,w,h);
  }
  function drawCabinet(c,x,y,w,h){
    // Kitchen overhead + base cabinet (2×2)
    var topH=Math.round(h*.42),botH=h-topH;
    // upper cabinet
    px(c,x,y,w,topH,'#dedad0');px(c,x,y,w,3,'#b0ac98');
    px(c,x+3,y+3,Math.round(w/2)-5,topH-5,'#ccc8bc');px(c,x+Math.round(w/2)+2,y+3,Math.round(w/2)-5,topH-5,'#ccc8bc');
    px(c,x+Math.round(w/4)-4,y+topH*.55,8,4,'#a8a498');px(c,x+Math.round(3*w/4)-4,y+topH*.55,8,4,'#a8a498');
    // gap between
    px(c,x,y+topH,w,Math.round(h*.06),'#888');
    // lower cabinet (with drawers)
    var by3=y+topH+Math.round(h*.06);
    px(c,x,by3,w,botH-Math.round(h*.06),'#dedad0');px(c,x,by3,w,3,'#b0ac98');
    var dh2=Math.round((botH-Math.round(h*.06)-6)/2);
    for(var di=0;di<2;di++){var dy3=by3+3+di*(dh2+1);px(c,x+3,dy3,w-6,dh2,'#ccc8bc');px(c,x+w/2-5,dy3+dh2/2-3,10,6,'#b0ac98');}
    depthTint(c,x,y,w,h);
  }
  function drawCoffeeMaker(c,x,y,w,h){
    var cx=x+w/2;
    ellipse(c,cx,y+h-1,w/2-2,4,'#000',0.12);
    // machine body
    px(c,x+2,y,w-4,Math.round(h*.7),'#282828');px(c,x+4,y+2,w-8,Math.round(h*.65),'#383838');
    // water tank (back top)
    px(c,x+Math.round(w*.55),y+2,Math.round(w*.36),Math.round(h*.40),'#a8d0e8');
    px(c,x+Math.round(w*.56),y+3,Math.round(w*.34),8,'rgba(255,255,255,0.3)');
    // display
    px(c,x+4,y+6,Math.round(w*.44),Math.round(h*.2),'#2040a0');px(c,x+5,y+7,Math.round(w*.3),4,'rgba(255,255,255,0.2)');
    // carafe
    px(c,x+4,y+Math.round(h*.72),w-8,Math.round(h*.22),'#c8c8c0');
    px(c,x+6,y+Math.round(h*.73),w-12,8,'rgba(80,50,10,0.5)');// coffee in carafe
    px(c,x+4,y+Math.round(h*.72),w-8,3,'#d0d0c8');// rim
    // button
    ellipse(c,x+8,y+Math.round(h*.55),5,5,'#e04040');
  }
  // ── GARDEN ──
  function drawBench(c,x,y,w,h){
    px(c,x+4,y+Math.round(h*.55),5,Math.round(h*.45),'#8a6040');px(c,x+w-9,y+Math.round(h*.55),5,Math.round(h*.45),'#8a6040');
    px(c,x,y+Math.round(h*.3),w,Math.round(h*.28),'#b88848');px(c,x,y+Math.round(h*.3),w,3,'#9a6e30');px(c,x,y+Math.round(h*.49),w,3,'#9a6e30');
    px(c,x,y,w,Math.round(h*.28),'#a87840');px(c,x,y,w,3,'#9a6e30');
    px(c,x,y,5,Math.round(h*.55),'#8a6040');px(c,x+w-5,y,5,Math.round(h*.55),'#8a6040');
    depthTint(c,x,y,w,h);
  }
  function drawFountain(c,x,y,w,h){
    var cx=x+w/2,cy=y+h/2;
    ellipse(c,cx,cy+h*.15,w*.42,h*.18,'#a0b8c8');ellipse(c,cx,cy+h*.15,w*.35,h*.12,'#80a8bc');
    ellipse(c,cx,cy+h*.15,w*.32,h*.10,'#60b0d8');ellipse(c,cx,cy+h*.14,w*.28,h*.07,'rgba(160,220,255,0.5)');
    px(c,cx-5,y+Math.round(h*.1),10,Math.round(h*.55),'#b0c0d0');px(c,cx-7,y+Math.round(h*.08),14,8,'#a0b0c0');
    px(c,cx-1,y+4,3,Math.round(h*.08),'#70b0d0');
    [[-.25,-.1],[.25,-.1],[-.15,.1],[.15,.1]].forEach(function(d){ellipse(c,cx+d[0]*w*.5,y+h*.2+d[1]*h*.5,3,3,'rgba(120,190,230,0.7)');});
  }
  function drawFlowerBed(c,x,y,w,h){
    // Soil bed with flowers (2×1)
    px(c,x+2,y+Math.round(h*.4),w-4,Math.round(h*.55),'#6a4020');// soil
    px(c,x+4,y+Math.round(h*.4),w-8,Math.round(h*.2),'#7a5030');// soil highlight
    // border bricks
    px(c,x,y+Math.round(h*.38),w,4,'#c09060');
    for(var bi=0;bi<5;bi++) px(c,x+bi*Math.round(w/5),y+Math.round(h*.38),Math.round(w/5)-1,4,'#b08050');
    // flowers
    var fColors=['#ff6080','#ffe030','#ff50c0','#50d0ff','#ff8020'];
    for(var fi=0;fi<5;fi++){
      var fx2=x+8+fi*Math.round((w-16)/4);
      px(c,fx2,y+Math.round(h*.12),2,Math.round(h*.30),'#3a8020');// stem
      ellipse(c,fx2+1,y+Math.round(h*.10),6,5,fColors[fi%5]);
      px(c,fx2-1,y+Math.round(h*.05),4,4,'rgba(255,255,255,0.25)');
    }
  }
  function drawPond(c,x,y,w,h){
    // Garden pond with lily pads and fish
    ellipse(c,x+w*.5,y+h*.55,w*.45,h*.38,'#3090c0');
    ellipse(c,x+w*.5,y+h*.53,w*.42,h*.34,'#40a8d8');
    ellipse(c,x+w*.5,y+h*.51,w*.38,h*.28,'#58bce8');
    // water shimmer
    c.save();c.globalAlpha=0.35;c.fillStyle='#a0e0ff';
    c.beginPath();c.ellipse(Math.round(x+w*.38),Math.round(y+h*.42),Math.round(w*.14),Math.round(h*.07),0,0,Math.PI*2);c.fill();c.restore();
    // lily pads
    ellipse(c,x+w*.28,y+h*.52,w*.12,h*.08,'#3a9030');ellipse(c,x+w*.68,y+h*.60,w*.10,h*.07,'#4aa040');
    // fish
    px(c,x+Math.round(w*.45),y+Math.round(h*.55),8,4,'#f08020');px(c,x+Math.round(w*.43),y+Math.round(h*.55),3,4,'#d06010');
    // pond rim / stones
    for(var pi=0;pi<8;pi++){
      var ang=pi/8*Math.PI*2,rr=w*.46,pr=h*.40;
      var px2=x+w*.5+Math.cos(ang)*rr,py2=y+h*.55+Math.sin(ang)*pr;
      ellipse(c,px2,py2,7,5,'#b0a890');
    }
  }
  function drawSwing(c,x,y,w,h){
    // A-frame swing
    var cx=x+w/2;
    // A-frame legs
    c.save();c.strokeStyle='#9a7038';c.lineWidth=4;
    c.beginPath();c.moveTo(x+4,y+h);c.lineTo(cx,y+6);c.stroke();
    c.beginPath();c.moveTo(x+w-4,y+h);c.lineTo(cx,y+6);c.stroke();
    // cross bar
    c.beginPath();c.moveTo(x+12,y+Math.round(h*.55));c.lineTo(x+w-12,y+Math.round(h*.55));c.stroke();
    c.restore();
    // ropes
    c.save();c.strokeStyle='#c8a060';c.lineWidth=2;
    c.beginPath();c.moveTo(cx-12,y+6);c.lineTo(cx-10,y+Math.round(h*.7));c.stroke();
    c.beginPath();c.moveTo(cx+12,y+6);c.lineTo(cx+10,y+Math.round(h*.7));c.stroke();
    c.restore();
    // seat
    px(c,cx-12,y+Math.round(h*.7),24,6,'#a07838');px(c,cx-11,y+Math.round(h*.72),22,3,'#c09050');
    // top cap
    px(c,cx-4,y+3,8,6,'#9a7038');
  }
  function drawBigTree(c,x,y,w,h){
    var cx=x+w/2;
    // shadow under canopy
    ellipse(c,cx,y+h*.85,w*.42,h*.08,'#000',0.14);
    // trunk
    px(c,cx-7,y+Math.round(h*.45),14,Math.round(h*.52),'#8a5c30');
    px(c,cx-5,y+Math.round(h*.45),4,Math.round(h*.52),'#a07040');// trunk highlight
    // roots
    px(c,cx-14,y+Math.round(h*.88),8,Math.round(h*.1),'#8a5c30');px(c,cx+6,y+Math.round(h*.88),8,Math.round(h*.1),'#8a5c30');
    // canopy layers (bottom up, each slightly narrower)
    px(c,cx-Math.round(w*.44),y+Math.round(h*.42),Math.round(w*.88),Math.round(h*.2),'#3a9028');
    px(c,cx-Math.round(w*.40),y+Math.round(h*.28),Math.round(w*.80),Math.round(h*.2),'#4aaa38');
    px(c,cx-Math.round(w*.34),y+Math.round(h*.15),Math.round(w*.68),Math.round(h*.18),'#3a9828');
    px(c,cx-Math.round(w*.26),y+Math.round(h*.04),Math.round(w*.52),Math.round(h*.15),'#4ab040');
    // leaf highlights
    c.save();c.globalAlpha=0.18;c.fillStyle='#c0ff80';
    px(c,cx-Math.round(w*.28),y+Math.round(h*.07),Math.round(w*.2),Math.round(h*.06),'#c0ff80');c.restore();
    // fruit / blossoms
    ['#f04040','#f8a020','#f04040'].forEach(function(fc,fi){
      ellipse(c,cx+(fi-1)*Math.round(w*.22),y+Math.round(h*.32),5,5,fc);
    });
  }
  function drawBirdbath(c,x,y,w,h){
    var cx=x+w/2;
    ellipse(c,cx,y+h-1,w/2-1,4,'#000',0.13);
    // pedestal
    px(c,cx-3,y+Math.round(h*.45),6,Math.round(h*.52),'#b0a898');px(c,cx-5,y+Math.round(h*.9),10,Math.round(h*.08),'#a09888');
    // bowl
    ellipse(c,cx,y+Math.round(h*.38),w*.38,h*.14,'#c0b8a8');
    ellipse(c,cx,y+Math.round(h*.36),w*.33,h*.10,'#d0c8b8');
    // water in bowl
    ellipse(c,cx,y+Math.round(h*.36),w*.28,h*.07,'#80b8d8');
    ellipse(c,cx-w*.05,y+Math.round(h*.34),w*.12,h*.03,'rgba(180,230,255,0.6)');
    // bird sitting on rim
    px(c,cx+Math.round(w*.2),y+Math.round(h*.28),6,5,'#4070c0');// body
    px(c,cx+Math.round(w*.22),y+Math.round(h*.22),4,4,'#4878d0');// head
    px(c,cx+Math.round(w*.26),y+Math.round(h*.24),4,2,'#e8a020');// beak
    px(c,cx+Math.round(w*.23),y+Math.round(h*.23),2,2,'#111');// eye
  }

  var DRAWERS = {
    bed:drawBed, dresser:drawDresser, shelf:drawShelf, bookcase:drawBookcase,
    lamp:drawLamp, clock:drawClock, window:drawWindow, rug:drawRug,
    cat:drawCat, toy:drawToy, bathtub:drawBathtub, plant:drawPlant,
    vase:drawVase, photoframe:drawPhotoFrame, aircond:drawAirCond,
    sofa:drawSofa, coffeetable:drawCoffeeTable, tv:drawTV, tvstand:drawTVStand,
    chair:drawChair, piano:drawPiano, desk:drawDesk, fridge:drawFridge, table:drawTable,
    diningtbl:drawDiningTbl, sideboard:drawSideboard, winecabinet:drawWineCabinet, teaset:drawTeaSet,
    stove:drawStove, sink:drawSink, counter:drawCounter, microwave:drawMicrowave,
    cabinet:drawCabinet, coffeemaker:drawCoffeeMaker,
    bench:drawBench, fountain:drawFountain, flowerbed:drawFlowerBed,
    pond:drawPond, swing:drawSwing, bigtree:drawBigTree, birdbath:drawBirdbath,
  };

  /* ─────────────────────────────────────────
     BACKGROUND
  ───────────────────────────────────────── */
  function getRoomDef(){ return ROOM_DEFS.filter(function(r){return r.id===currentRoom;})[0]||ROOM_DEFS[0]; }

  function renderBackground(c,cw){
    var rd=getRoomDef();
    var f=FLOORS.filter(function(fl){return fl.id===state.floor;})[0]||FLOORS[0];
    if(rd.id==='garden'){
      var grad=c.createLinearGradient(0,0,0,WALL_OFFSET+ROWS*T);
      grad.addColorStop(0,'#78c8f8');grad.addColorStop(0.45,'#a8e0ff');grad.addColorStop(1,'#c0e8b0');
      c.fillStyle=grad;c.fillRect(0,0,cw,WALL_OFFSET+ROWS*T);
      // clouds
      [[cw*.12,10,28,11],[cw*.45,7,38,13],[cw*.78,13,26,10]].forEach(function(cl){
        c.fillStyle='rgba(255,255,255,0.82)';
        c.beginPath();c.ellipse(cl[0],cl[1],cl[2],cl[3],0,0,Math.PI*2);c.fill();
        c.beginPath();c.ellipse(cl[0]+15,cl[1]-4,cl[2]*.65,cl[3]*.75,0,0,Math.PI*2);c.fill();
      });
      // hedge/fence at wall offset
      px(c,0,WALL_OFFSET-8,cw,4,'#8db060');px(c,0,WALL_OFFSET-4,cw,4,'#6a9840');
      // grass tiles
      for(var r=0;r<ROWS;r++) for(var col=0;col<COLS;col++){
        c.fillStyle=(r+col)%2===0?f.c[0]:f.c[1];c.fillRect(col*T,WALL_OFFSET+r*T,T,T);
      }
      c.fillStyle='rgba(60,140,20,0.14)';
      for(var gr=0;gr<ROWS;gr++) for(var gc=0;gc<COLS;gc++){c.fillRect(gc*T+7,WALL_OFFSET+gr*T+7,4,4);c.fillRect(gc*T+22,WALL_OFFSET+gr*T+19,4,4);}
    } else {
      c.fillStyle=rd.wall||'#ede5d8';c.fillRect(0,0,cw,WALL_OFFSET);
      c.strokeStyle=rd.wallStroke||'rgba(0,0,0,0.06)';c.lineWidth=1;
      for(var wy=5;wy<WALL_OFFSET-4;wy+=7){c.beginPath();c.moveTo(0,wy);c.lineTo(cw,wy);c.stroke();}
      px(c,0,WALL_OFFSET-5,cw,5,rd.base||'#c4a880');px(c,0,WALL_OFFSET-3,cw,2,rd.baseHi||'#d8bc98');px(c,0,WALL_OFFSET-1,cw,1,'rgba(0,0,0,0.12)');
      for(var r2=0;r2<ROWS;r2++) for(var c2=0;c2<COLS;c2++){
        c.fillStyle=(r2+c2)%2===0?f.c[0]:f.c[1];c.fillRect(c2*T,WALL_OFFSET+r2*T,T,T);
      }
    }
    c.strokeStyle='rgba(0,0,0,0.06)';c.lineWidth=0.5;
    for(var rr=0;rr<=ROWS;rr++){c.beginPath();c.moveTo(0,WALL_OFFSET+rr*T);c.lineTo(cw,WALL_OFFSET+rr*T);c.stroke();}
    for(var cc=0;cc<=COLS;cc++){c.beginPath();c.moveTo(cc*T,WALL_OFFSET);c.lineTo(cc*T,WALL_OFFSET+ROWS*T);c.stroke();}
  }

  /* ─────────────────────────────────────────
     RENDER
  ───────────────────────────────────────── */
  function render(){
    if(!roomCtx) return;
    roomCtx.clearRect(0,0,COLS*T,WALL_OFFSET+ROWS*T);
    renderBackground(roomCtx,COLS*T);
    state.placed.filter(function(p){return p.id==='rug';}).forEach(function(p){
      var item=ITEMS.filter(function(i){return i.id===p.id;})[0];
      if(item&&DRAWERS[p.id]) DRAWERS[p.id](roomCtx,p.col*T,WALL_OFFSET+p.row*T,item.w*T,item.h*T);
    });
    state.placed.filter(function(p){return p.id!=='rug';})
      .sort(function(a,b){return a.row-b.row;})
      .forEach(function(p){
        var item=ITEMS.filter(function(i){return i.id===p.id;})[0];
        if(!item||!DRAWERS[p.id]) return;
        var ix=p.col*T,iy=WALL_OFFSET+p.row*T;
        shadow(roomCtx,ix,iy,item.w*T,item.h*T);
        DRAWERS[p.id](roomCtx,ix,iy,item.w*T,item.h*T);
      });
  }

  /* ─────────────────────────────────────────
     RESIZE
  ───────────────────────────────────────── */
  function resizeCanvas(){
    if(!roomCanvas) return;
    DPR=Math.min(window.devicePixelRatio||1,3);
    var wrap=document.getElementById(ROOM_ID).querySelector('#lrm-wrap');
    var wrapW=wrap.clientWidth||window.innerWidth;
    var wrapH=wrap.clientHeight||(window.innerHeight-100-130);
    T=Math.max(32,Math.min(Math.floor(wrapW/COLS),64));
    ROWS=Math.max(5,Math.min(Math.floor((wrapH-WALL_OFFSET)/T),12));
    var cw=COLS*T,ch=WALL_OFFSET+ROWS*T;
    roomCanvas.width=Math.round(cw*DPR);roomCanvas.height=Math.round(ch*DPR);
    roomCanvas.style.width=cw+'px';roomCanvas.style.height=ch+'px';
    roomCtx=roomCanvas.getContext('2d');roomCtx.scale(DPR,DPR);
  }

  /* ─────────────────────────────────────────
     COLLISION
  ───────────────────────────────────────── */
  function canPlace(id,col,row){
    var item=ITEMS.filter(function(i){return i.id===id;})[0];
    if(!item) return false;
    if(col<0||row<0||col+item.w>COLS||row+item.h>ROWS) return false;
    return !state.placed.some(function(p){
      var pi=ITEMS.filter(function(i){return i.id===p.id;})[0];if(!pi) return false;
      return col<p.col+pi.w&&col+item.w>p.col&&row<p.row+pi.h&&row+item.h>p.row;
    });
  }
  function removeAt(col,row){
    var idx=-1;
    state.placed.forEach(function(p,i){
      var item=ITEMS.filter(function(it){return it.id===p.id;})[0];if(!item) return;
      if(col>=p.col&&col<p.col+item.w&&row>=p.row&&row<p.row+item.h) idx=i;
    });
    if(idx>=0) state.placed.splice(idx,1);return idx>=0;
  }
  function findAt(col,row){
    var result=null;
    state.placed.forEach(function(p){
      var item=ITEMS.filter(function(i){return i.id===p.id;})[0];if(!item) return;
      if(col>=p.col&&col<p.col+item.w&&row>=p.row&&row<p.row+item.h) result=item;
    });
    return result;
  }

  /* ─────────────────────────────────────────
     SAVE / LOAD
  ───────────────────────────────────────── */
  function saveKey(){return SAVE_BASE+currentRoom;}
  function saveState(){try{localStorage.setItem(saveKey(),JSON.stringify(state));}catch(e){}}
  function loadState(){
    try{var d=JSON.parse(localStorage.getItem(saveKey())||'null');if(d&&Array.isArray(d.placed)){state=d;return;}}catch(e){}
    var rd=getRoomDef();state={placed:[],floor:rd.defaultFloor||rd.floors[0]||'wood'};
  }

  /* ─────────────────────────────────────────
     ROOM SWITCH
  ───────────────────────────────────────── */
  function switchRoom(roomId,overlay){
    if(roomId===currentRoom) return;
    saveState();currentRoom=roomId;loadState();
    updateRoomTabs(overlay);updateFloorRow(overlay);updatePalette(overlay);render();
  }
  function updateRoomTabs(overlay){
    overlay.querySelectorAll('[data-room-id]').forEach(function(b){
      var a=b.dataset.roomId===currentRoom;
      b.style.borderBottom=a?'2px solid #ff88aa':'2px solid transparent';
      b.style.color=a?'#ff88aa':'#ccbbdd';b.style.fontWeight=a?'700':'500';
    });
  }
  function updateFloorRow(overlay){
    var rd=getRoomDef();
    overlay.querySelectorAll('[data-floor]').forEach(function(b){
      b.style.display=rd.floors.indexOf(b.dataset.floor)>=0?'':'none';
      b.style.borderColor=b.dataset.floor===state.floor?'#ff88aa':'transparent';
    });
  }
  function updatePalette(overlay){
    var rd=getRoomDef();
    overlay.querySelectorAll('[data-item-id]').forEach(function(w){
      w.style.display=rd.items.indexOf(w.dataset.itemId)>=0?'':'none';
      w.style.borderColor=w.dataset.itemId===selectedId?'#ff88aa':'transparent';
      w.style.background=w.dataset.itemId===selectedId?'rgba(255,136,170,.15)':'';
    });
  }

  /* ─────────────────────────────────────────
     THUMBNAIL
  ───────────────────────────────────────── */
  function makePaletteThumb(item){
    var S=44,cv=document.createElement('canvas');
    cv.width=item.w*S;cv.height=item.h*S;
    var pctx=cv.getContext('2d');pctx.fillStyle='#e8e0d8';pctx.fillRect(0,0,cv.width,cv.height);
    if(DRAWERS[item.id]) DRAWERS[item.id](pctx,0,0,item.w*S,item.h*S);
    cv.style.cssText='display:block;image-rendering:pixelated;image-rendering:crisp-edges;width:'+(item.w*34)+'px;height:'+(item.h*34)+'px;';
    return cv;
  }

  /* ─────────────────────────────────────────
     HIT TEST
  ───────────────────────────────────────── */
  function getTile(e){
    var rect=roomCanvas.getBoundingClientRect(),src=e.touches?e.touches[0]:e;
    var lx=(src.clientX-rect.left)/rect.width*COLS*T;
    var ly=(src.clientY-rect.top)/rect.height*(WALL_OFFSET+ROWS*T)-WALL_OFFSET;
    return{col:Math.floor(lx/T),row:Math.floor(ly/T)};
  }

  /* ─────────────────────────────────────────
     BUILD OVERLAY
  ───────────────────────────────────────── */
  function buildOverlay(){
    var el=document.createElement('div');
    el.id=ROOM_ID;
    el.style.cssText='position:fixed;inset:0;z-index:3300;background:#120c1a;display:none;' +
      'flex-direction:column;font-family:"Trebuchet MS","Microsoft YaHei",sans-serif;color:#fff7fb;user-select:none;-webkit-user-select:none;';

    // header
    var hdr=document.createElement('div');
    hdr.style.cssText='display:flex;align-items:center;gap:8px;padding:max(14px,env(safe-area-inset-top,14px)) 14px 10px;background:#1e1228;flex-shrink:0;';
    hdr.innerHTML=
      '<button id="lrm-back" style="height:34px;min-width:34px;padding:0 10px;border:1px solid rgba(255,182,214,.35);border-radius:10px;background:rgba(255,255,255,.07);color:#fff7fb;font-size:13px;cursor:pointer;">&#8592; 返回</button>'+
      '<span style="font-size:15px;font-weight:700;letter-spacing:.06em;">&#127968; 我的小屋</span>'+
      '<div id="lrm-carry" style="display:none;flex:1;align-items:center;gap:5px;padding:0 8px;height:30px;background:rgba(255,200,80,.18);border:1px solid rgba(255,200,80,.4);border-radius:10px;">'+
        '<span id="lrm-carry-name" style="flex:1;font-size:11px;color:#ffe090;white-space:nowrap;overflow:hidden;"></span>'+
        '<button id="lrm-carry-cancel" style="height:22px;padding:0 7px;border:none;border-radius:6px;background:rgba(255,255,255,.15);color:#fff;font-size:11px;cursor:pointer;">放下</button>'+
      '</div>'+
      '<span id="lrm-carry-spacer" style="flex:1;"></span>'+
      '<button id="lrm-erase" style="height:34px;padding:0 10px;border:1px solid rgba(255,182,214,.35);border-radius:10px;background:rgba(255,255,255,.07);color:#ffddeb;font-size:12px;cursor:pointer;">&#9986; 删除</button>'+
      '<button id="lrm-save" style="height:34px;padding:0 14px;border:none;border-radius:10px;background:#ff88aa;color:#fff;font-size:13px;font-weight:700;cursor:pointer;">保存</button>';

    // room tabs
    var tabs=document.createElement('div');
    tabs.id='lrm-rooms';
    tabs.style.cssText='display:flex;background:#18102a;border-bottom:1px solid rgba(255,182,214,.2);overflow-x:auto;flex-shrink:0;scrollbar-width:none;-webkit-overflow-scrolling:touch;';
    ROOM_DEFS.forEach(function(rd){
      var btn=document.createElement('button');
      btn.style.cssText='flex:1;min-width:58px;height:36px;border:none;border-bottom:2px solid transparent;background:none;color:#ccbbdd;font-size:11px;font-weight:500;cursor:pointer;white-space:nowrap;padding:0 2px;';
      btn.textContent=rd.icon+' '+rd.name;btn.dataset.roomId=rd.id;tabs.appendChild(btn);
    });

    // canvas wrap
    var wrap=document.createElement('div');
    wrap.id='lrm-wrap';
    wrap.style.cssText='flex:1;min-height:0;overflow:hidden;display:flex;justify-content:center;align-items:flex-start;background:#120c1a;';
    var cv=document.createElement('canvas');
    cv.id='lrm-canvas';
    cv.style.cssText='image-rendering:pixelated;image-rendering:crisp-edges;border-left:2px solid rgba(255,182,214,.2);border-right:2px solid rgba(255,182,214,.2);touch-action:none;display:block;';
    wrap.appendChild(cv);

    // bottom panel
    var bot=document.createElement('div');
    bot.style.cssText='flex-shrink:0;background:#1e1228;border-top:1px solid rgba(255,182,214,.28);';
    var floorRow=document.createElement('div');
    floorRow.id='lrm-floor-row';
    floorRow.style.cssText='display:flex;gap:5px;padding:5px 12px;border-bottom:1px solid rgba(255,182,214,.14);overflow-x:auto;align-items:center;';
    floorRow.innerHTML='<span style="font-size:10px;color:#ffddeb;white-space:nowrap;flex-shrink:0;">地板</span>';
    FLOORS.forEach(function(f){
      var btn=document.createElement('button');
      btn.style.cssText='height:22px;padding:0 9px;border-radius:8px;border:2px solid transparent;background:'+f.c[0]+';color:#2a1830;font-size:10px;font-weight:700;cursor:pointer;flex-shrink:0;white-space:nowrap;';
      btn.textContent=f.name;btn.dataset.floor=f.id;floorRow.appendChild(btn);
    });
    var pal=document.createElement('div');
    pal.id='lrm-palette';
    pal.style.cssText='display:flex;gap:5px;padding:6px 12px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;';
    ITEMS.forEach(function(item){
      var w=document.createElement('div');
      w.style.cssText='flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;padding:3px;border-radius:8px;border:2px solid transparent;';
      w.dataset.itemId=item.id;w.appendChild(makePaletteThumb(item));
      var lbl=document.createElement('span');lbl.style.cssText='font-size:9px;color:#ffddeb;white-space:nowrap;';lbl.textContent=item.name;w.appendChild(lbl);
      pal.appendChild(w);
    });
    bot.appendChild(floorRow);bot.appendChild(pal);
    el.appendChild(hdr);el.appendChild(tabs);el.appendChild(wrap);el.appendChild(bot);
    document.body.appendChild(el);return el;
  }

  /* ─────────────────────────────────────────
     WIRE EVENTS
  ───────────────────────────────────────── */
  function wireEvents(overlay){
    overlay.querySelector('#lrm-back').addEventListener('click',function(){saveState();overlay.style.display='none';document.body.style.overflow='';});
    overlay.querySelector('#lrm-save').addEventListener('click',function(){
      saveState();var btn=this,orig=btn.textContent;btn.textContent='已保存 ✓';btn.disabled=true;
      setTimeout(function(){btn.textContent=orig;btn.disabled=false;},1400);
    });
    overlay.querySelector('#lrm-erase').addEventListener('click',function(){
      eraseMode=!eraseMode;this.style.background=eraseMode?'rgba(220,60,60,.35)':'rgba(255,255,255,.07)';
      this.textContent=eraseMode?'✂ 删除中':'✂ 删除';
      if(eraseMode){selectedId=null;updatePalette(overlay);updateCarryBadge(overlay);}
    });
    overlay.querySelector('#lrm-carry-cancel').addEventListener('click',function(){selectedId=null;updatePalette(overlay);updateCarryBadge(overlay);});
    overlay.querySelector('#lrm-rooms').addEventListener('click',function(e){var btn=e.target.closest('[data-room-id]');if(btn) switchRoom(btn.dataset.roomId,overlay);});
    overlay.querySelector('#lrm-floor-row').addEventListener('click',function(e){
      var btn=e.target.closest('[data-floor]');if(!btn) return;
      state.floor=btn.dataset.floor;
      overlay.querySelectorAll('[data-floor]').forEach(function(b){b.style.borderColor=b.dataset.floor===state.floor?'#ff88aa':'transparent';});
      render();
    });
    overlay.querySelector('#lrm-palette').addEventListener('click',function(e){
      var w=e.target.closest('[data-item-id]');if(!w) return;
      eraseMode=false;overlay.querySelector('#lrm-erase').style.background='rgba(255,255,255,.07)';overlay.querySelector('#lrm-erase').textContent='✂ 删除';
      selectedId=(selectedId===w.dataset.itemId)?null:w.dataset.itemId;
      updatePalette(overlay);updateCarryBadge(overlay);
    });
    function onTap(e){
      e.preventDefault();var t=getTile(e);
      if(t.row<0||t.row>=ROWS||t.col<0||t.col>=COLS) return;
      if(eraseMode){if(removeAt(t.col,t.row))render();return;}
      var hit=findAt(t.col,t.row);
      if(hit){
        removeAt(t.col,t.row);selectedId=hit.id;eraseMode=false;
        overlay.querySelector('#lrm-erase').style.background='rgba(255,255,255,.07)';overlay.querySelector('#lrm-erase').textContent='✂ 删除';
        updatePalette(overlay);updateCarryBadge(overlay);render();return;
      }
      if(!selectedId) return;
      if(canPlace(selectedId,t.col,t.row)){state.placed.push({id:selectedId,col:t.col,row:t.row});render();}
    }
    overlay.querySelector('#lrm-canvas').addEventListener('touchstart',onTap,{passive:false});
    overlay.querySelector('#lrm-canvas').addEventListener('click',onTap);
  }

  function updateCarryBadge(overlay){
    var badge=overlay.querySelector('#lrm-carry'),spacer=overlay.querySelector('#lrm-carry-spacer'),nameEl=overlay.querySelector('#lrm-carry-name');
    if(!badge||!nameEl) return;
    if(selectedId){var item=ITEMS.filter(function(i){return i.id===selectedId;})[0];nameEl.textContent='手持: '+(item?item.name:'');badge.style.display='flex';if(spacer)spacer.style.display='none';}
    else{badge.style.display='none';if(spacer)spacer.style.display='';}
  }

  /* ─────────────────────────────────────────
     PUBLIC
  ───────────────────────────────────────── */
  function openRoom(){
    loadState();
    var overlay=document.getElementById(ROOM_ID);
    if(!overlay){overlay=buildOverlay();wireEvents(overlay);}
    overlay.style.display='flex';document.body.style.overflow='hidden';
    roomCanvas=overlay.querySelector('#lrm-canvas');
    updateRoomTabs(overlay);updateFloorRow(overlay);updatePalette(overlay);updateCarryBadge(overlay);
    requestAnimationFrame(function(){resizeCanvas();render();});
  }

  window.openLeonRoom=openRoom;
}());
