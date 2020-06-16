import { createSignature } from "../db";

const canvas = document.getElementById("canvas");
const form = document.getElementById("form");
const hiddenInput = document.getElementById("signature");

let ctx = canvas.getContext("2d");
ctx.strokeStyle = "#222222";
ctx.lineWidth = 4;

let drawing = false;
let mousePos = {
    x: 0,
    y: 0,
};
let lastPos = mousePos;

form.addEventListener("submit", (e) => {
    e.preventDefault();

    // get data from fields
    const { firstName, lastName, signature } = e.currentTarget;

    // send request to DB to save data
    const query = `INSERT INTO petition VALUES ($1, $2, $3)`;
    createSignature(query, { firstName, lastName, signature });
});

canvas.addEventListener(
    "mousedown",
    function (e) {
        drawing = true;
        lastPos = getMousePos(this, e);
    },
    false
);

canvas.addEventListener(
    "mouseup",
    function (e) {
        const dataUrl = canvas.toDataURL();
        hiddenInput.innerHTML = dataUrl;
        drawing = false;
    },
    false
);

canvas.addEventListener(
    "mousemove",
    function (e) {
        mousePos = getMousePos(this, e);
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
