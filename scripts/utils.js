function toKebabCase(string) {
  return string
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/\s+/g, "-")
    .toLowerCase();
}

module.exports = {
  toKebabCase,
};
