exports.capitalize = function (text, separator = "-") {
    return text
        .split(separator)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
};
