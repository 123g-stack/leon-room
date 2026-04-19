/* Leon Room Engine v5 — Isometric Canvas 2D, no external deps */
(function () {
  'use strict';

  var ROOM_ID   = 'leon-room-overlay';
  var SAVE_BASE = 'leonRoom5_';
  var COLS = 9, ROWS = 7;
  var TW = 64, TH = 32, DPR = 1;
  var OX = 0, OY = 0, CW = 0, CH = 0;
  var WALL_H = 64;

  var currentRoom = 'bedroom';
  var state       = { placed: [], floor: 'wood' };
  var selectedId  = null;
  var eraseMode   = false;
  var roomCanvas  = null;
  var roomCtx     = null;

  /* ─── ROOM DEFS ─── */
  var ROOM_DEFS = [
    { id:'bedroom', name:'卧室',  icon:'🛏',
      wall:'#ede5d8', wallB:'#d8cec4', base:'#c4a880', baseHi:'#d8bc98',
      floors:['wood','dark','pink','stone'], defaultFloor:'wood',
      items:['bed','dresser','shelf','bookcase','lamp','clock','window','rug','cat','toy',
             'bathtub','plant','photoframe','aircond','sofa','chair','desk','tv','tvstand','fridge','vase'] },
    { id:'living',  name:'客厅',  icon:'🛋',
      wall:'#e8e4f0', wallB:'#d8d0e8', base:'#b8b0d0', baseHi:'#ccc4e8',
      floors:['wood','pink','stone'], defaultFloor:'wood',
      items:['sofa','coffeetable','tv','tvstand','bookcase','shelf','chair','lamp','clock',
             'window','rug','cat','plant','vase','photoframe','aircond','table','toy','piano'] },
    { id:'dining',  name:'餐厅',  icon:'🍽️',
      wall:'#f0eadc', wallB:'#e0d8c8', base:'#ccb880', baseHi:'#ddd098',
      floors:['wood','stone'], defaultFloor:'wood',
      items:['diningtbl','chair','sideboard','winecabinet','teaset','lamp','clock','window',
             'rug','vase','plant','photoframe','shelf','table'] },
    { id:'kitchen', name:'厨房',  icon:'🍳',
      wall:'#e4ede6', wallB:'#d4ddd6', base:'#98b898', baseHi:'#aacaaa',
      floors:['stone','wood'], defaultFloor:'stone',
      items:['stove','sink','fridge','counter','microwave','cabinet','coffeemaker',
             'table','chair','lamp','clock','window','plant','shelf'] },
    { id:'garden',  name:'花园',  icon:'🌸',
      wall:null, floors:['grass','stone'], defaultFloor:'grass',
      items:['plant','bigtree','bench','fountain','flowerbed','pond','swing','birdbath',
             'cat','vase','table','chair','lamp','clock'] },
  ];

  /* ─── ITEMS ─── */
  var ITEMS = [
    {id:'bed',w:2,h:3,name:'床'},{id:'dresser',w:2,h:2,name:'梳妆台'},{id:'shelf',w:1,h:3,name:'书架'},
    {id:'bookcase',w:2,h:3,name:'书柜'},{id:'lamp',w:1,h:1,name:'台灯'},{id:'clock',w:1,h:1,name:'时钟'},
    {id:'window',w:2,h:2,name:'窗户'},{id:'rug',w:3,h:2,name:'地毯'},{id:'cat',w:1,h:1,name:'猫咪'},
    {id:'toy',w:1,h:1,name:'玩偶'},{id:'bathtub',w:2,h:2,name:'浴缸'},{id:'plant',w:1,h:1,name:'植物'},
    {id:'vase',w:1,h:1,name:'花瓶'},{id:'photoframe',w:1,h:1,name:'相框'},{id:'aircond',w:2,h:1,name:'空调'},
    {id:'sofa',w:3,h:2,name:'沙发'},{id:'coffeetable',w:2,h:1,name:'茶几'},{id:'tv',w:2,h:2,name:'电视'},
    {id:'tvstand',w:3,h:1,name:'电视柜'},{id:'chair',w:1,h:1,name:'椅子'},{id:'piano',w:3,h:2,name:'钢琴'},
    {id:'desk',w:2,h:2,name:'书桌'},{id:'fridge',w:1,h:2,name:'冰箱'},{id:'table',w:2,h:2,name:'圆桌'},
    {id:'diningtbl',w:3,h:2,name:'餐桌'},{id:'sideboard',w:3,h:1,name:'餐边柜'},{id:'winecabinet',w:1,h:3,name:'酒柜'},
    {id:'teaset',w:1,h:1,name:'茶具'},{id:'stove',w:2,h:2,name:'灶台'},{id:'sink',w:1,h:2,name:'水槽'},
    {id:'counter',w:3,h:1,name:'料理台'},{id:'microwave',w:1,h:1,name:'微波炉'},{id:'cabinet',w:2,h:2,name:'橱柜'},
    {id:'coffeemaker',w:1,h:1,name:'咖啡机'},{id:'bench',w:2,h:1,name:'长椅'},{id:'fountain',w:2,h:2,name:'喷泉'},
    {id:'flowerbed',w:2,h:1,name:'花圃'},{id:'pond',w:2,h:2,name:'水池'},{id:'swing',w:2,h:2,name:'秋千'},
    {id:'bigtree',w:2,h:3,name:'大树'},{id:'birdbath',w:1,h:1,name:'鸟浴盆'},
  ];

  /* ─── FLOORS ─── */
  var FLOORS = [
    {id:'wood', name:'木地板',c:['#d4a76a','#c49458']},
    {id:'dark', name:'深木',  c:['#8a5c34','#7a4c28']},
    {id:'stone',name:'石板',  c:['#c8c0b0','#b8b0a0']},
    {id:'pink', name:'粉毯',  c:['#f4d0e0','#e4c0d0']},
    {id:'grass',name:'草地',  c:['#72c860','#62b050']},
  ];

  /* ─── ISO HELPERS ─── */
  function gp(col, row) {
    return { x: OX + (col - row) * TW / 2, y: OY + (col + row) * TH / 2 };
  }

  function screenToTile(sx, sy) {
    var dx = sx - OX, dy = sy - OY;
    return {
      col: Math.floor((dx / (TW / 2) + dy / (TH / 2)) / 2),
      row: Math.floor((dy / (TH / 2) - dx / (TW / 2)) / 2)
    };
  }

  function poly(c, pts, color) {
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length; i++) c.lineTo(pts[i].x, pts[i].y);
    c.closePath();
    c.fill();
  }

  /* Draw isometric box spanning gridW x gridH tiles, boxH pixels tall */
  function isoBox(c, col, row, gridW, gridH, boxH, topCol, leftCol, rightCol) {
    var a = gp(col, row), b = gp(col + gridW, row),
        d = gp(col, row + gridH), e = gp(col + gridW, row + gridH);
    poly(c, [a, b, e, d], topCol);
    c.strokeStyle = 'rgba(0,0,0,0.10)'; c.lineWidth = 0.5; c.stroke();
    poly(c, [d, e, {x:e.x,y:e.y+boxH}, {x:d.x,y:d.y+boxH}], leftCol);
    c.stroke();
    poly(c, [e, b, {x:b.x,y:b.y+boxH}, {x:e.x,y:e.y+boxH}], rightCol);
    c.stroke();
  }

  function isoFlat(c, col, row, gridW, gridH, color) {
    var a = gp(col, row), b = gp(col + gridW, row),
        d = gp(col, row + gridH), e = gp(col + gridW, row + gridH);
    poly(c, [a, b, e, d], color);
  }

  /* ─── ITEM HEIGHTS (screen px) ─── */
  var HH = {
    rug:2, pond:4, flowerbed:8, coffeetable:10, teaset:10, bench:12,
    counter:12, microwave:12, tvstand:12, clock:14, aircond:14, vase:14,
    birdbath:16, coffeemaker:16, cat:14, toy:14, table:16, diningtbl:16,
    photoframe:16, sink:18, bathtub:16, chair:18, sofa:20, bed:20, stove:20,
    desk:18, plant:22, lamp:26, fountain:24, tv:20, sideboard:20, fridge:30,
    dresser:24, winecabinet:32, shelf:32, bookcase:32, cabinet:32, piano:26,
    swing:28, bigtree:44, window:24
  };

  /* ─── ITEM COLORS [top, leftFace, rightFace] ─── */
  var IC = {
    bed:['#b8cef8','#5070b8','#8098d0'],dresser:['#ddb870','#8a5818','#b07838'],
    shelf:['#d4a848','#7a4c18','#a86828'],bookcase:['#d4a848','#7a4c18','#a86828'],
    lamp:['#fff0a0','#c8a030','#e8c050'],clock:['#f8f0e0','#b0a090','#d0c0b0'],
    window:['#c0e8ff','#4890c8','#70b0e0'],rug:['#c8a8f0','#8860c0','#a880d8'],
    cat:['#f8d070','#c89838','#e0b850'],toy:['#ffc0d8','#d07898','#f098b8'],
    bathtub:['#f0f0e8','#b8b8b0','#d8d8d0'],plant:['#78d060','#306820','#58a038'],
    vase:['#f08080','#c04040','#d86060'],photoframe:['#d4a848','#7a4c18','#a86828'],
    aircond:['#eceef8','#a8aac0','#c8cae0'],sofa:['#d86060','#882828','#b84040'],
    coffeetable:['#d4a848','#8a5818','#b07838'],tv:['#404858','#101820','#282e38'],
    tvstand:['#505868','#182028','#303840'],chair:['#b090d0','#6040a8','#9068c0'],
    piano:['#282828','#080810','#181820'],desk:['#d4a848','#8a5818','#b07838'],
    fridge:['#e0e8f0','#98a8b8','#c0c8d8'],table:['#d4a848','#8a5818','#b07838'],
    diningtbl:['#d4a848','#8a5818','#b07838'],sideboard:['#c07830','#7a3808','#a05820'],
    winecabinet:['#4a2818','#180808','#301410'],teaset:['#f8e8d0','#c8a878','#e0c8a0'],
    stove:['#9898a0','#484850','#686870'],sink:['#d0d8e0','#8090a0','#b0b8c8'],
    counter:['#e8ece0','#989c90','#c0c4b8'],microwave:['#585868','#182028','#303840'],
    cabinet:['#d09858','#805820','#a87838'],coffeemaker:['#383e3e','#100e0e','#202828'],
    bench:['#c8a060','#784818','#a07040'],fountain:['#98d0e8','#4890b0','#70b0d0'],
    flowerbed:['#78c050','#306018','#58a030'],pond:['#70a8e8','#3068b0','#5080c8'],
    swing:['#c8a068','#805028','#a07848'],bigtree:['#58b840','#206010','#40a028'],
    birdbath:['#d8e0e8','#9098a8','#b8c0d0'],
  };
  function ic(id) { return IC[id] || ['#c8c0b8','#907870','#a89888']; }

  /* ─── SPECIAL DRAW FUNCTIONS ─── */
  function drawPlant(c, col, row, item) {
    var bh = HH[item.id] || 22;
    var e = gp(col + item.w, row + item.h), d = gp(col, row + item.h);
    var cx = Math.round((e.x + d.x) / 2), cy = Math.round((e.y + d.y) / 2) - bh * 0.4;
    isoBox(c, col, row, item.w, item.h, Math.floor(bh * 0.42), '#d89058', '#9a5820', '#c07838');
    var r1 = TW * item.w * 0.28;
    c.fillStyle = '#78d060'; c.beginPath(); c.ellipse(cx, cy, Math.round(r1), Math.round(r1 * 0.65), 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#58a840'; c.beginPath(); c.ellipse(cx - Math.round(r1*0.4), cy + Math.round(r1*0.25), Math.round(r1*0.65), Math.round(r1*0.45), 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#90e060'; c.beginPath(); c.ellipse(cx + Math.round(r1*0.3), cy - Math.round(r1*0.1), Math.round(r1*0.55), Math.round(r1*0.4), 0, 0, Math.PI * 2); c.fill();
  }

  function drawRug(c, col, row, item) {
    isoFlat(c, col, row, item.w, item.h, ic('rug')[0]);
    var a=gp(col,row),b=gp(col+item.w,row),d=gp(col,row+item.h),e=gp(col+item.w,row+item.h);
    c.strokeStyle = ic('rug')[1]; c.lineWidth = 3;
    c.beginPath(); c.moveTo(a.x,a.y); c.lineTo(b.x,b.y); c.lineTo(e.x,e.y); c.lineTo(d.x,d.y); c.closePath(); c.stroke();
    isoFlat(c, col+0.2, row+0.2, item.w-0.4, item.h-0.4, 'rgba(255,255,255,0.12)');
  }

  function drawPond(c, col, row, item) {
    var a=gp(col,row),b=gp(col+item.w,row),d=gp(col,row+item.h),e=gp(col+item.w,row+item.h);
    var cx=(a.x+b.x+d.x+e.x)/4, cy=(a.y+b.y+d.y+e.y)/4+2;
    var rx=TW*item.w*0.38, ry=TH*item.h*0.38;
    c.fillStyle='#5090d8'; c.beginPath(); c.ellipse(Math.round(cx),Math.round(cy),Math.round(rx),Math.round(ry),0,0,Math.PI*2); c.fill();
    c.fillStyle='#70b0f0'; c.beginPath(); c.ellipse(Math.round(cx-rx*0.1),Math.round(cy-ry*0.1),Math.round(rx*0.65),Math.round(ry*0.65),0,0,Math.PI*2); c.fill();
    c.fillStyle='rgba(180,230,255,0.5)'; c.beginPath(); c.ellipse(Math.round(cx-rx*0.2),Math.round(cy-ry*0.3),Math.round(rx*0.3),Math.round(ry*0.25),0,0,Math.PI*2); c.fill();
    c.fillStyle='#50a830'; c.beginPath(); c.ellipse(Math.round(cx-rx*0.35),Math.round(cy+ry*0.1),Math.round(rx*0.18),Math.round(ry*0.15),0,0,Math.PI*2); c.fill();
    c.fillStyle='#68c040'; c.beginPath(); c.ellipse(Math.round(cx+rx*0.3),Math.round(cy+ry*0.2),Math.round(rx*0.15),Math.round(ry*0.12),0,0,Math.PI*2); c.fill();
    [[0,-1],[0.7,-0.7],[1,0],[0.7,0.7],[0,1],[-0.7,0.7],[-1,0],[-0.7,-0.7]].forEach(function(s){
      c.fillStyle='#b0a890'; c.beginPath(); c.ellipse(Math.round(cx+s[0]*rx*0.88),Math.round(cy+s[1]*ry*0.88),6,4,0,0,Math.PI*2); c.fill();
    });
  }

  function drawBookcase(c, col, row, item) {
    var bh = HH[item.id] || 32; var cols = ic(item.id);
    isoBox(c, col, row, item.w, item.h, bh, cols[0], cols[1], cols[2]);
    var e=gp(col+item.w,row+item.h), b=gp(col+item.w,row);
    var bookColors=['#e04040','#f08020','#4080d0','#40a040','#a040c0','#d0a020','#e05080'];
    for (var bi=0; bi<6; bi++) {
      var bx=e.x+(b.x-e.x)*(bi/7);
      c.fillStyle=bookColors[bi%bookColors.length];
      c.fillRect(Math.round(bx), Math.round(e.y+bh*0.08), 3, Math.round(bh*0.5));
    }
    for (var s=1; s<3; s++) {
      c.strokeStyle='rgba(0,0,0,0.22)'; c.lineWidth=1.5;
      c.beginPath();
      c.moveTo(Math.round(b.x),Math.round(b.y+bh*(1-s/3)));
      c.lineTo(Math.round(e.x),Math.round(e.y+bh*(1-s/3))); c.stroke();
    }
  }

  function drawTV(c, col, row, item) {
    var bh=HH['tv']||20; var cols=ic('tv');
    isoBox(c,col,row,item.w,item.h,bh,cols[0],cols[1],cols[2]);
    var pad=0.12;
    var sa=gp(col+pad,row+pad),sb=gp(col+item.w-pad,row+pad),sd=gp(col+pad,row+item.h-pad),se=gp(col+item.w-pad,row+item.h-pad);
    poly(c,[sa,sb,se,sd],'#2858d0');
    poly(c,[sa,{x:(sa.x+sb.x)/2,y:(sa.y+sb.y)/2},{x:(sa.x+sb.x)/2+2,y:(sa.y+sb.y)/2+4},{x:sa.x+2,y:sa.y+4}],'rgba(255,255,255,0.15)');
  }

  function drawWindow(c, col, row, item) {
    var bh=HH['window']||24; var cols=ic('window');
    isoBox(c,col,row,item.w,item.h,bh,cols[0],cols[1],cols[2]);
    poly(c,[gp(col,row),gp(col+0.35,row),gp(col+0.35,row+item.h),gp(col,row+item.h)],'rgba(240,180,200,0.5)');
    poly(c,[gp(col+item.w-0.35,row),gp(col+item.w,row),gp(col+item.w,row+item.h),gp(col+item.w-0.35,row+item.h)],'rgba(240,180,200,0.5)');
  }

  function drawFountain(c, col, row, item) {
    var a=gp(col,row),b=gp(col+item.w,row),d=gp(col,row+item.h),e=gp(col+item.w,row+item.h);
    var cx=(a.x+b.x+d.x+e.x)/4, cy=(a.y+b.y+d.y+e.y)/4, bh=HH['fountain'];
    var rx=TW*item.w*0.35, ry=TH*item.h*0.35;
    c.fillStyle='#a0b8c8'; c.beginPath(); c.ellipse(Math.round(cx),Math.round(cy+4),Math.round(rx),Math.round(ry),0,0,Math.PI*2); c.fill();
    c.fillStyle='#70c0e0'; c.beginPath(); c.ellipse(Math.round(cx),Math.round(cy+2),Math.round(rx*0.78),Math.round(ry*0.78),0,0,Math.PI*2); c.fill();
    c.fillStyle='#b8c8d0'; c.fillRect(Math.round(cx-4),Math.round(cy-bh*0.5),8,Math.round(bh*0.5));
    c.strokeStyle='rgba(120,200,240,0.7)'; c.lineWidth=2;
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(d2){
      c.beginPath(); c.moveTo(Math.round(cx),Math.round(cy-bh*0.5));
      c.quadraticCurveTo(Math.round(cx+d2[0]*rx*0.5),Math.round(cy-bh*0.6),Math.round(cx+d2[0]*rx*0.35),Math.round(cy+ry*0.1)); c.stroke();
    });
  }

  function drawCat(c, col, row, item) {
    var e=gp(col+item.w,row+item.h), d=gp(col,row+item.h);
    var cx=Math.round((e.x+d.x)/2), cy=Math.round((e.y+d.y)/2)-10;
    c.fillStyle='rgba(0,0,0,0.12)'; c.beginPath(); c.ellipse(cx,cy+14,10,4,0,0,Math.PI*2); c.fill();
    c.fillStyle='#f0c858'; c.beginPath(); c.ellipse(cx,cy+4,9,7,0,0,Math.PI*2); c.fill();
    c.beginPath(); c.ellipse(cx+5,cy-4,8,7,0,0,Math.PI*2); c.fill();
    c.beginPath(); c.moveTo(cx+1,cy-9); c.lineTo(cx-1,cy-14); c.lineTo(cx+5,cy-11); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(cx+7,cy-9); c.lineTo(cx+10,cy-14); c.lineTo(cx+12,cy-10); c.closePath(); c.fill();
    c.fillStyle='#2a1840'; c.beginPath(); c.ellipse(cx+3,cy-5,2,2,0,0,Math.PI*2); c.fill();
    c.beginPath(); c.ellipse(cx+8,cy-5,2,2,0,0,Math.PI*2); c.fill();
    c.fillStyle='#f098b0'; c.beginPath(); c.ellipse(cx+5,cy-2,2,1,0,0,Math.PI*2); c.fill();
    c.strokeStyle='#e0b848'; c.lineWidth=3;
    c.beginPath(); c.moveTo(cx-8,cy+4); c.quadraticCurveTo(cx-14,cy-2,cx-10,cy-8); c.stroke();
  }

  function drawLamp(c, col, row, item) {
    var e=gp(col+item.w,row+item.h), d=gp(col,row+item.h);
    var cx=Math.round((e.x+d.x)/2), cy=Math.round((e.y+d.y)/2)-4, bh=HH['lamp'];
    c.save(); c.globalAlpha=0.15; c.fillStyle='#ffe080';
    c.beginPath(); c.ellipse(cx,cy-bh*0.4,18,10,0,0,Math.PI*2); c.fill(); c.restore();
    c.fillStyle='#f0c840';
    c.beginPath(); c.moveTo(cx-14,cy-bh*0.3); c.lineTo(cx+14,cy-bh*0.3); c.lineTo(cx+10,cy-bh*0.65); c.lineTo(cx-10,cy-bh*0.65); c.closePath(); c.fill();
    c.fillStyle='#e8b830';
    c.fillRect(Math.round(cx-14),Math.round(cy-bh*0.3),28,Math.round(bh*0.06));
    c.fillStyle='#a07828'; c.fillRect(cx-2,Math.round(cy-bh*0.65),4,Math.round(bh*0.5));
    c.fillStyle='#b08838'; c.beginPath(); c.ellipse(cx,Math.round(cy-bh*0.18),10,4,0,0,Math.PI*2); c.fill();
  }

  function drawFlowerBed(c, col, row, item) {
    isoFlat(c,col,row,item.w,item.h,'#6a4020');
    isoFlat(c,col+0.1,row+0.1,item.w-0.2,item.h-0.2,'#7a5030');
    var a=gp(col,row),b=gp(col+item.w,row),d=gp(col,row+item.h);
    var pts=[[0.2,0.8],[0.45,0.7],[0.7,0.75],[0.85,0.55],[0.55,0.45],[0.3,0.5]];
    var fcs=['#ff6080','#ffe030','#ff50c0','#60d0ff','#ff8020','#a0e030'];
    pts.forEach(function(p,i){
      var fx=a.x+(b.x-a.x)*p[0]+(d.x-a.x)*p[1], fy=a.y+(b.y-a.y)*p[0]+(d.y-a.y)*p[1]-8;
      c.fillStyle='#3a8020'; c.fillRect(Math.round(fx)-1,Math.round(fy),2,8);
      c.fillStyle=fcs[i]; c.beginPath(); c.ellipse(Math.round(fx),Math.round(fy)-2,5,4,0,0,Math.PI*2); c.fill();
    });
  }

  function drawBigTree(c, col, row, item) {
    var a=gp(col,row),b=gp(col+item.w,row),d=gp(col,row+item.h),e=gp(col+item.w,row+item.h);
    var bx=(a.x+b.x+d.x+e.x)/4, by=(a.y+b.y+d.y+e.y)/4, bh=HH['bigtree'];
    c.fillStyle='rgba(0,0,0,0.10)'; c.beginPath(); c.ellipse(Math.round(bx),Math.round(by+4),Math.round(TW*0.35),Math.round(TH*0.25),0,0,Math.PI*2); c.fill();
    c.fillStyle='#8a5c28'; c.fillRect(Math.round(bx)-5,Math.round(by-bh*0.55),10,Math.round(bh*0.6));
    c.fillStyle='#a87040'; c.fillRect(Math.round(bx)-3,Math.round(by-bh*0.55),4,Math.round(bh*0.6));
    [['#3a9020',0.88,0.38],['#4aaa30',0.72,0.24],['#3a9828',0.58,0.14],['#52c038',0.42,0.06]].forEach(function(l){
      c.fillStyle=l[0]; c.beginPath(); c.ellipse(Math.round(bx),Math.round(by-bh*l[2]),Math.round(TW*l[1]*0.4),Math.round(bh*(l[1]-0.3)*0.45),0,0,Math.PI*2); c.fill();
    });
    ['#f04040','#f8a020','#f04060'].forEach(function(fc,fi){
      c.fillStyle=fc; c.beginPath(); c.ellipse(Math.round(bx+(fi-1)*14),Math.round(by-bh*0.3),5,5,0,0,Math.PI*2); c.fill();
    });
  }

  function drawSwing(c, col, row, item) {
    var a=gp(col,row),b=gp(col+item.w,row),d=gp(col,row+item.h),e=gp(col+item.w,row+item.h);
    var cx=(a.x+b.x+d.x+e.x)/4, cy=(a.y+b.y+d.y+e.y)/4, bh=HH['swing'];
    c.strokeStyle='#a07838'; c.lineWidth=4;
    c.beginPath(); c.moveTo(Math.round(a.x+4),Math.round(e.y)); c.lineTo(Math.round(cx),Math.round(cy-bh+4)); c.stroke();
    c.beginPath(); c.moveTo(Math.round(b.x-4),Math.round(e.y)); c.lineTo(Math.round(cx),Math.round(cy-bh+4)); c.stroke();
    c.beginPath(); c.moveTo(Math.round(cx-TW*0.3),Math.round(cy-bh*0.55)); c.lineTo(Math.round(cx+TW*0.3),Math.round(cy-bh*0.55)); c.stroke();
    c.strokeStyle='#c89848'; c.lineWidth=2;
    c.beginPath(); c.moveTo(Math.round(cx-12),Math.round(cy-bh*0.55)); c.lineTo(Math.round(cx-10),Math.round(cy-bh*0.15)); c.stroke();
    c.beginPath(); c.moveTo(Math.round(cx+12),Math.round(cy-bh*0.55)); c.lineTo(Math.round(cx+10),Math.round(cy-bh*0.15)); c.stroke();
    c.fillStyle='#a07838'; c.fillRect(Math.round(cx-12),Math.round(cy-bh*0.18),24,5);
  }

  var SPECIAL = {
    plant:drawPlant, rug:drawRug, pond:drawPond, bookcase:drawBookcase,
    shelf:drawBookcase, tv:drawTV, window:drawWindow, fountain:drawFountain,
    cat:drawCat, lamp:drawLamp, flowerbed:drawFlowerBed, bigtree:drawBigTree, swing:drawSwing,
  };

  function drawItemOnCanvas(c, p) {
    var item = ITEMS.filter(function(i){return i.id===p.id;})[0];
    if (!item) return;
    if (SPECIAL[item.id]) {
      SPECIAL[item.id](c, p.col, p.row, item);
    } else {
      var bh=HH[item.id]||20, cols=ic(item.id);
      isoBox(c,p.col,p.row,item.w,item.h,bh,cols[0],cols[1],cols[2]);
    }
  }

  /* ─── PALETTE THUMBNAIL ─── */
  function makePaletteThumb(item) {
    var sz=44, cv=document.createElement('canvas');
    cv.width=cv.height=sz; cv.style.width=cv.style.height=sz+'px';
    cv.style.imageRendering='pixelated';
    var ctx=cv.getContext('2d');
    var tw=sz*0.72, th=tw/2, ox2=sz/2, oy2=sz*0.18;
    var bh2=Math.min(HH[item.id]||20,sz*0.42), cols=ic(item.id);
    ctx.fillStyle=cols[0]; ctx.beginPath();
    ctx.moveTo(ox2,oy2); ctx.lineTo(ox2+tw/2,oy2+th/2); ctx.lineTo(ox2,oy2+th); ctx.lineTo(ox2-tw/2,oy2+th/2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.12)'; ctx.lineWidth=0.5; ctx.stroke();
    ctx.fillStyle=cols[1]; ctx.beginPath();
    ctx.moveTo(ox2-tw/2,oy2+th/2); ctx.lineTo(ox2,oy2+th); ctx.lineTo(ox2,oy2+th+bh2); ctx.lineTo(ox2-tw/2,oy2+th/2+bh2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle=cols[2]; ctx.beginPath();
    ctx.moveTo(ox2,oy2+th); ctx.lineTo(ox2+tw/2,oy2+th/2); ctx.lineTo(ox2+tw/2,oy2+th/2+bh2); ctx.lineTo(ox2,oy2+th+bh2); ctx.closePath(); ctx.fill(); ctx.stroke();
    return cv;
  }

  /* ─── BACKGROUND ─── */
  function getRoomDef() { return ROOM_DEFS.filter(function(r){return r.id===currentRoom;})[0]||ROOM_DEFS[0]; }

  function renderBackground() {
    var c=roomCtx, rd=getRoomDef();
    var f=FLOORS.filter(function(fl){return fl.id===state.floor;})[0]||FLOORS[0];
    c.clearRect(0,0,CW,CH);

    if (rd.id==='garden') {
      var grad=c.createLinearGradient(0,0,0,CH);
      grad.addColorStop(0,'#78c8f8'); grad.addColorStop(0.55,'#b0e0ff'); grad.addColorStop(1,'#c0e8b0');
      c.fillStyle=grad; c.fillRect(0,0,CW,CH);
      [[CW*0.18,14,40,15],[CW*0.55,10,52,18],[CW*0.82,18,32,12]].forEach(function(cl){
        c.fillStyle='rgba(255,255,255,0.82)';
        c.beginPath(); c.ellipse(cl[0],cl[1],cl[2],cl[3],0,0,Math.PI*2); c.fill();
        c.beginPath(); c.ellipse(cl[0]+cl[2]*0.5,cl[1]-cl[3]*0.45,cl[2]*0.6,cl[3]*0.7,0,0,Math.PI*2); c.fill();
      });
    } else {
      c.fillStyle='#1a1020'; c.fillRect(0,0,CW,CH);
      var p00=gp(0,0), p0R=gp(0,ROWS), pC0=gp(COLS,0);
      // left wall
      c.fillStyle=rd.base||'#c4a880';
      c.beginPath(); c.moveTo(p00.x,p00.y-WALL_H); c.lineTo(p0R.x,p0R.y-WALL_H); c.lineTo(p0R.x,p0R.y); c.lineTo(p00.x,p00.y); c.closePath(); c.fill();
      c.strokeStyle='rgba(0,0,0,0.07)'; c.lineWidth=1;
      for (var wy=-WALL_H+10; wy<0; wy+=12) { c.beginPath(); c.moveTo(p00.x,p00.y+wy); c.lineTo(p0R.x,p0R.y+wy); c.stroke(); }
      // right wall
      c.fillStyle=rd.wall||'#ede5d8';
      c.beginPath(); c.moveTo(p00.x,p00.y-WALL_H); c.lineTo(pC0.x,pC0.y-WALL_H); c.lineTo(pC0.x,pC0.y); c.lineTo(p00.x,p00.y); c.closePath(); c.fill();
      c.strokeStyle='rgba(0,0,0,0.05)'; c.lineWidth=1;
      for (var wy2=-WALL_H+10; wy2<0; wy2+=12) { c.beginPath(); c.moveTo(p00.x,p00.y+wy2); c.lineTo(pC0.x,pC0.y+wy2); c.stroke(); }
      // ridge
      c.strokeStyle=rd.baseHi||'#d8bc98'; c.lineWidth=2;
      c.beginPath(); c.moveTo(pC0.x,pC0.y-WALL_H); c.lineTo(p00.x,p00.y-WALL_H); c.lineTo(p0R.x,p0R.y-WALL_H); c.stroke();
      // baseboard
      c.fillStyle=rd.base||'#c4a880';
      c.beginPath(); c.moveTo(p00.x,p00.y-4); c.lineTo(p0R.x,p0R.y-4); c.lineTo(p0R.x,p0R.y+2); c.lineTo(p00.x,p00.y+2); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(p00.x,p00.y-4); c.lineTo(pC0.x,pC0.y-4); c.lineTo(pC0.x,pC0.y+2); c.lineTo(p00.x,p00.y+2); c.closePath(); c.fill();
    }

    // floor tiles
    for (var r=0; r<ROWS; r++) {
      for (var col=0; col<COLS; col++) {
        var color=(col+r)%2===0?f.c[0]:f.c[1];
        var a=gp(col,r),b=gp(col+1,r),d=gp(col,r+1),e=gp(col+1,r+1);
        c.fillStyle=color; c.beginPath(); c.moveTo(a.x,a.y); c.lineTo(b.x,b.y); c.lineTo(e.x,e.y); c.lineTo(d.x,d.y); c.closePath(); c.fill();
        c.strokeStyle='rgba(0,0,0,0.07)'; c.lineWidth=0.5; c.stroke();
      }
    }
    // front shadow
    var fL=gp(0,ROWS), fR=gp(COLS,ROWS);
    c.fillStyle='rgba(0,0,0,0.18)';
    c.beginPath(); c.moveTo(fL.x,fL.y); c.lineTo(fR.x,fR.y); c.lineTo(fR.x,fR.y+8); c.lineTo(fL.x,fL.y+8); c.closePath(); c.fill();
  }

  /* ─── RENDER ─── */
  function render() {
    if (!roomCtx) return;
    renderBackground();
    var rugs=state.placed.filter(function(p){return p.id==='rug';});
    var others=state.placed.filter(function(p){return p.id!=='rug';});
    others.sort(function(a,b){return (a.row+a.col)-(b.row+b.col);});
    rugs.forEach(function(p){drawItemOnCanvas(roomCtx,p);});
    others.forEach(function(p){drawItemOnCanvas(roomCtx,p);});
  }

  /* ─── RESIZE ─── */
  function resizeCanvas() {
    if (!roomCanvas) return;
    DPR=Math.min(window.devicePixelRatio||1,3);
    var wrap=document.getElementById(ROOM_ID).querySelector('#lrm-wrap');
    var wrapW=wrap.clientWidth||window.innerWidth;
    TW=Math.max(48,Math.min(Math.floor(wrapW*2/(COLS+ROWS+1)),80));
    TH=Math.floor(TW/2);
    OX=Math.round(ROWS*TW/2);
    OY=WALL_H;
    CW=OX+Math.round(COLS*TW/2)+TW/2;
    CH=OY+Math.round((COLS+ROWS)*TH/2)+56;
    roomCanvas.width=Math.round(CW*DPR); roomCanvas.height=Math.round(CH*DPR);
    roomCanvas.style.width=CW+'px'; roomCanvas.style.height=CH+'px';
    roomCtx=roomCanvas.getContext('2d'); roomCtx.scale(DPR,DPR);
  }

  /* ─── COLLISION ─── */
  function canPlace(id,col,row){
    var item=ITEMS.filter(function(i){return i.id===id;})[0]; if(!item) return false;
    if(col<0||row<0||col+item.w>COLS||row+item.h>ROWS) return false;
    return !state.placed.some(function(p){
      var pi=ITEMS.filter(function(i){return i.id===p.id;})[0]; if(!pi) return false;
      return col<p.col+pi.w&&col+item.w>p.col&&row<p.row+pi.h&&row+item.h>p.row;
    });
  }
  function removeAt(col,row){
    var idx=-1;
    state.placed.forEach(function(p,i){
      var item=ITEMS.filter(function(it){return it.id===p.id;})[0]; if(!item) return;
      if(col>=p.col&&col<p.col+item.w&&row>=p.row&&row<p.row+item.h) idx=i;
    });
    if(idx>=0) state.placed.splice(idx,1); return idx>=0;
  }
  function findAt(col,row){
    var result=null;
    state.placed.forEach(function(p){
      var item=ITEMS.filter(function(i){return i.id===p.id;})[0]; if(!item) return;
      if(col>=p.col&&col<p.col+item.w&&row>=p.row&&row<p.row+item.h) result=item;
    });
    return result;
  }

  /* ─── SAVE / LOAD ─── */
  function saveKey(){return SAVE_BASE+currentRoom;}
  function saveState(){try{localStorage.setItem(saveKey(),JSON.stringify(state));}catch(e){}}
  function loadState(){
    try{var d=JSON.parse(localStorage.getItem(saveKey())||'null');if(d&&Array.isArray(d.placed)){state=d;return;}}catch(e){}
    var rd=getRoomDef();state={placed:[],floor:rd.defaultFloor||rd.floors[0]||'wood'};
  }

  /* ─── ROOM SWITCH ─── */
  function switchRoom(roomId,overlay){
    if(roomId===currentRoom) return;
    saveState();currentRoom=roomId;loadState();
    updateRoomTabs(overlay);updateFloorRow(overlay);updatePalette(overlay);render();
  }
  function updateRoomTabs(overlay){
    overlay.querySelectorAll('[data-room-id]').forEach(function(b){
      var a=b.dataset.roomId===currentRoom;
      b.style.borderBottom=a?'2px solid #ff88aa':'2px solid transparent';
      b.style.color=a?'#ff88aa':'#ccbbdd'; b.style.fontWeight=a?'700':'500';
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

  /* ─── BUILD OVERLAY ─── */
  function buildOverlay(){
    var el=document.createElement('div');
    el.id=ROOM_ID;
    el.style.cssText='position:fixed;inset:0;z-index:3300;background:#120c1a;display:none;'+
      'flex-direction:column;font-family:"Trebuchet MS","Microsoft YaHei",sans-serif;color:#fff7fb;user-select:none;-webkit-user-select:none;';
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
    var tabs=document.createElement('div');
    tabs.id='lrm-rooms';
    tabs.style.cssText='display:flex;background:#18102a;border-bottom:1px solid rgba(255,182,214,.2);overflow-x:auto;flex-shrink:0;scrollbar-width:none;-webkit-overflow-scrolling:touch;';
    ROOM_DEFS.forEach(function(rd){
      var btn=document.createElement('button');
      btn.style.cssText='flex:1;min-width:58px;height:36px;border:none;border-bottom:2px solid transparent;background:none;color:#ccbbdd;font-size:11px;font-weight:500;cursor:pointer;white-space:nowrap;padding:0 2px;';
      btn.textContent=rd.icon+' '+rd.name; btn.dataset.roomId=rd.id; tabs.appendChild(btn);
    });
    var wrap=document.createElement('div');
    wrap.id='lrm-wrap';
    wrap.style.cssText='flex:1;min-height:0;overflow:auto;display:flex;justify-content:center;align-items:flex-start;background:#120c1a;';
    var cv=document.createElement('canvas');
    cv.id='lrm-canvas';
    cv.style.cssText='image-rendering:pixelated;image-rendering:crisp-edges;touch-action:none;display:block;';
    wrap.appendChild(cv);
    var bot=document.createElement('div');
    bot.style.cssText='flex-shrink:0;background:#1e1228;border-top:1px solid rgba(255,182,214,.28);';
    var floorRow=document.createElement('div');
    floorRow.id='lrm-floor-row';
    floorRow.style.cssText='display:flex;gap:5px;padding:5px 12px;border-bottom:1px solid rgba(255,182,214,.14);overflow-x:auto;align-items:center;';
    floorRow.innerHTML='<span style="font-size:10px;color:#ffddeb;white-space:nowrap;flex-shrink:0;">地板</span>';
    FLOORS.forEach(function(f){
      var btn=document.createElement('button');
      btn.style.cssText='height:22px;padding:0 9px;border-radius:8px;border:2px solid transparent;background:'+f.c[0]+';color:#2a1830;font-size:10px;font-weight:700;cursor:pointer;flex-shrink:0;white-space:nowrap;';
      btn.textContent=f.name; btn.dataset.floor=f.id; floorRow.appendChild(btn);
    });
    var pal=document.createElement('div');
    pal.id='lrm-palette';
    pal.style.cssText='display:flex;gap:5px;padding:6px 12px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;';
    ITEMS.forEach(function(item){
      var w=document.createElement('div');
      w.style.cssText='flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;padding:3px;border-radius:8px;border:2px solid transparent;';
      w.dataset.itemId=item.id; w.appendChild(makePaletteThumb(item));
      var lbl=document.createElement('span'); lbl.style.cssText='font-size:9px;color:#ffddeb;white-space:nowrap;'; lbl.textContent=item.name; w.appendChild(lbl);
      pal.appendChild(w);
    });
    bot.appendChild(floorRow); bot.appendChild(pal);
    el.appendChild(hdr); el.appendChild(tabs); el.appendChild(wrap); el.appendChild(bot);
    document.body.appendChild(el); return el;
  }

  /* ─── EVENTS ─── */
  function getTile(e){
    var rect=roomCanvas.getBoundingClientRect();
    var sx,sy;
    if(e.touches&&e.touches.length>0){sx=(e.touches[0].clientX-rect.left)*(CW/rect.width);sy=(e.touches[0].clientY-rect.top)*(CH/rect.height);}
    else{sx=(e.clientX-rect.left)*(CW/rect.width);sy=(e.clientY-rect.top)*(CH/rect.height);}
    return screenToTile(sx,sy);
  }

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
    overlay.querySelector('#lrm-rooms').addEventListener('click',function(e){var btn=e.target.closest('[data-room-id]');if(btn)switchRoom(btn.dataset.roomId,overlay);});
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

  /* ─── PUBLIC ─── */
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
