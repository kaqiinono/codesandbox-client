const fs = require('fs');
const path = require('path');

function getDateStr() {
  const date = new Date();
  const Y = date.getFullYear() + '_';
  const M =
    (date.getMonth() + 1 < 10
      ? '0' + (date.getMonth() + 1)
      : date.getMonth() + 1) + '_';
  const D = date.getDate() + '_';
  const h = date.getHours() + '_';
  const m = date.getMinutes() + '_';
  const s = date.getSeconds();
  return Y + M + D + h + m + s;
}

// function GetRandomNum(Min, Max) {
//   const Range = Max - Min;
//   const Rand = Math.random();
//   return (Min + Math.round(Rand * Range));
// }

function save(config, dev) {
  fs.writeFileSync(
    path.resolve(
      __dirname,
      `./result/${dev ? 'dev' : 'pro'}/${getDateStr()}.json`
    ),
    JSON.stringify(config)
  );
}

module.exports = save;
