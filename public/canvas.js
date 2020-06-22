const canvas = document.getElementById("canvas");
const hiddenInput = document.getElementById("signature");
const clearBtn = document.getElementById("clear-canvas");

let ctx = canvas.getContext("2d");
ctx.strokeStyle = "#222222";
ctx.lineWidth = 1;

let drawing = false;
let mousePos = {
    x: 0,
    y: 0,
};
let lastPos = mousePos;

clearBtn.addEventListener("click", () => clearCanvas());

canvas.addEventListener(
    "mousedown",
    function (e) {
        drawing = true;
        lastPos = getMousePos(this, e);
    },
    false
);

document.addEventListener(
    "mouseup",
    function () {
        const dataUrl = canvas.toDataURL();
        hiddenInput.value = dataUrl;
        drawing = false;
    },
    false
);

canvas.addEventListener(
    "mousemove",
    function (e) {
        mousePos = getMousePos(this, e);
        renderCanvas();
    },
    false
);

function getMousePos(canvasDom, mouseEvent) {
    var rect = canvasDom.getBoundingClientRect();
    return {
        x: mouseEvent.clientX - rect.left,
        y: mouseEvent.clientY - rect.top,
    };
}

function renderCanvas() {
    if (drawing) {
        ctx.moveTo(lastPos.x, lastPos.y);
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.stroke();
        lastPos = mousePos;
    }
}

function clearCanvas() {
    canvas.width = canvas.width;
}
