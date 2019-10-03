/* eslint-disable no-console */
const colors = require('colors');

module.exports = {
  debug: (...message) => { console.log(colors.green('\n[**DEBUG]**: \n', ...message)); },
  info: (...message) => { console.log(colors.blue('[INFO]: ', ...message)); },
  warning: (...message) => { console.log(colors.yellow('[WARNING]: ', ...message)); },
  error: (...message) => { console.log(colors.brightRed('[ERROR]: ', ...message)); },
};
