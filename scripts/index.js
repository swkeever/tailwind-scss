const { pick } = require("lodash");
let { theme } = require("../stubs/defaultConfig.stub");
const categories = require("./tailwind.config");
const preprocess = require("./preprocessor");
const { generateFile, generateIndexFile } = require("./generator");

theme = preprocess(theme);

Object.entries(categories).forEach(([category, properties]) => {
  const data = pick(theme, properties);
  generateFile(category, data);
});

generateIndexFile(categories);
