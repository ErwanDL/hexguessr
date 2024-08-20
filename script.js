"use strict";


window.onload = function () {
    const hexCodeRe = /^([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})$/;

    const targetColorRGB = [random256(), random256(), random256()]

    // Set a random color to the target panel
    const targetColorPanel = document.getElementById('target-color-panel');
    targetColorPanel.style.backgroundColor = rgbToHex(targetColorRGB);


    const yourGuessColorPanel = document.getElementById('your-guess-color-panel');
    const errorMessage = document.getElementById("error-message")
    const resultMessage = document.getElementById('result-message');
    const userGuessInput = document.getElementById('color-guess');

    userGuessInput.value = ""

    // Function to check the user's guess
    window.checkGuess = function () {
        errorMessage.textContent = ""
        resultMessage.textContent = ""

        const userGuessHex = userGuessInput.value.trim();
        const matches = userGuessHex.match(hexCodeRe)

        if (matches === null || matches.length !== 4) {
            errorMessage.textContent = "\"#" + userGuessHex + "\" is not a valid RGB hex string. Example: #FF77AA";
            return
        }

        yourGuessColorPanel.textContent = ""
        yourGuessColorPanel.style.backgroundColor = "#" + userGuessHex;

        const userGuessRGB = hexToRgb(matches.slice(1))
        const dist = rgbDistance(userGuessRGB, targetColorRGB)
        console.log("dist: ", dist)
        const score = 100 - (100 * dist)

        resultMessage.textContent = "Your score: " + to1DecimalPlace(score) + "%\n\nThe target color was " + rgbToHex(targetColorRGB)

        return
    };
}

function rgbToHex(rgbArr) {
    function componentToHex(c) {
        const hex = c.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }

    return "#" + componentToHex(rgbArr[0]) + componentToHex(rgbArr[1]) + componentToHex(rgbArr[2]);
}

function hexToRgb(hexArr) {
    return [parseInt(hexArr[0], 16), parseInt(hexArr[1], 16), parseInt(hexArr[2], 16)]
}

function random256() {
    return Math.floor(Math.random() * 256)
}

// Normalized between 0 and 1.
function rgbDistance(rgbA, rgbB) {
    const rDist = Math.pow(Math.abs(rgbA[0] - rgbB[0]), 2)
    const gDist = Math.pow(Math.abs(rgbA[1] - rgbB[1]), 2)
    const bDist = Math.pow(Math.abs(rgbA[2] - rgbB[2]), 2)

    const dist = Math.sqrt(rDist + gDist + bDist)

    const maxDist = Math.sqrt(3 * Math.pow(255, 2))

    return dist / maxDist
}

function to1DecimalPlace(num) {
    return num.toString().match(/^-?\d+(?:\.\d{0,1})?/)[0]
}