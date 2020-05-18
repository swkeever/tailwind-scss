const _ = require("lodash");

const keysToOmit = [
  "background",
  "fill",
  "container",
  "cursor",
  "inset",
  "listStyle",
  "objectPosition",
  "transform",
];
const subKeysToOmit = ["stroke", "colors.current", "colors.transparent"];

function preprocess(theme) {
  // theme = _.omitBy(theme, _.isFunction);
  theme = _.omitBy(theme, (v, k) => keysToOmit.some((str) => k.includes(str)));
  theme = _.omit(theme, subKeysToOmit);
  // theme = _.merge(theme, theme.colors);
  // delete theme.colors;
  return theme;
}

module.exports = preprocess;
