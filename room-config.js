/**
 * room-config.js — 自定义配置入口
 *
 * 在这里添加你自己的精灵图、物品、场景、地板。
 * 所有 API 都挂在 window.LeonRoom 上，在 room-engine.js 加载后即可调用。
 *
 * ── 添加/替换精灵图 ──────────────────────────────────────────
 *
 * LeonRoom.registerItem({
 *   id:   'bed',               // 内置物品 id，覆盖其精灵图
 *   file: 'sprites/bed.png'   // 相对路径 or 完整 URL
 * });
 *
 * ── 添加全新物品 ─────────────────────────────────────────────
 *
 * LeonRoom.registerItem({
 *   id:     'pizza',           // 唯一 id（英文）
 *   name:   '披萨🍕',          // 显示名称
 *   file:   'sprites/custom/pizza.png',
 *   w:      1,                 // 占格宽
 *   h:      1,                 // 占格高
 *   height: 12,                // 物品视觉高度(px，基于 TW=64)
 *   colors: ['#f0c080','#c08030','#e0a050']  // 无精灵图时的备用颜色[顶/左/右]
 * });
 *
 * ── 把新物品加入某个场景的物品栏 ────────────────────────────
 *
 * LeonRoom.registerScene({
 *   id:    'bedroom',
 *   items: ['bed','dresser','shelf','bookcase','lamp','clock','window','rug',
 *           'cat','toy','bathtub','plant','photoframe','aircond','sofa','chair',
 *           'desk','tv','tvstand','fridge','vase',
 *           'pizza']           // ← 追加你的新物品
 * });
 *
 * ── 添加全新场景 ─────────────────────────────────────────────
 *
 * LeonRoom.registerScene({
 *   id:           'cafe',
 *   name:         '咖啡厅',
 *   icon:         '☕',
 *   wall:         '#e8ddc8',   // 右墙颜色
 *   wallB:        '#d8ccb0',
 *   base:         '#b89878',   // 左墙颜色
 *   baseHi:       '#ceb098',
 *   floors:       ['wood','stone'],
 *   defaultFloor: 'wood',
 *   items:        ['table','chair','coffeemaker','plant','lamp','shelf','sofa']
 * });
 *
 * ── 添加自定义地板 ───────────────────────────────────────────
 *
 * LeonRoom.registerFloor({
 *   id:     'blue_tile',
 *   name:   '蓝砖',
 *   colors: ['#8ab4e0','#6a94c0']   // [浅色格, 深色格]
 * });
 *
 * ──────────────────────────────────────────────────────────────
 * PNG 规范（供 AI 生图参考）：
 *   - 透明背景 (RGBA PNG)
 *   - 建议尺寸：1x1 格 → 64×96, 2x2 格 → 128×160, 以此类推
 *   - 视角：等距左上（isometric, upper-left view）
 *   - 物品底边与图片底边对齐，左右居中
 *   - 风格：像素风 / Stardew Valley 色调
 * ──────────────────────────────────────────────────────────────
 */

// ===================== 在这里写你的配置 =====================

// 示例（取消注释即可生效）：

// LeonRoom.registerItem({ id: 'bed',  file: 'sprites/bed.png' });
// LeonRoom.registerItem({ id: 'sofa', file: 'sprites/sofa.png' });
// LeonRoom.registerItem({ id: 'desk', file: 'sprites/desk.png' });

// LeonRoom.registerItem({
//   id: 'pizza', name: '披萨🍕',
//   file: 'sprites/custom/pizza.png',
//   w: 1, h: 1, height: 12
// });
// LeonRoom.registerScene({
//   id: 'bedroom',
//   items: ['bed','dresser','shelf','bookcase','lamp','clock','window','rug',
//           'cat','toy','bathtub','plant','photoframe','aircond','sofa','chair',
//           'desk','tv','tvstand','fridge','vase','pizza']
// });

// ============================================================
