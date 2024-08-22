"use strict";

const months = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];
const hexCodeRe = /^([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})$/;
const selectedGameModeClass = "selected-game-mode-button";
const classicMode = "classic-mode";
const trainingMode = "training-mode";
const gameModes = {};
gameModes[classicMode] = "Everyday a new color, the same for everyone, only one attempt.\nChallenge your friends and get the highest score!";
gameModes[trainingMode] = "Practice with as many attempts and random colors as you want.";

const gameModeDescription = document.getElementById('game-mode-description');
const targetColorPanel = document.getElementById('target-color-panel');
const yourGuessColorPanel = document.getElementById('your-guess-color-panel');
const errorMessage = document.getElementById("error-message");
const resultMessage = document.getElementById('result-message');
const inputContainer = document.getElementById('input-container');
const userGuessInput = document.getElementById('color-guess');
const dateTitle = document.getElementById('date-title');
const checkGuessButton = document.getElementById('check-guess-button');
const retryButton = document.getElementById('retry-button');


let targetColorRGB;

window.onload = function () {
    // Allow submitting guesses with Enter
    userGuessInput.onkeydown = function (e) {
        if (e.key === "Enter") {
            checkGuessButton.click();
            this.blur();
        }
    };

    selectGameMode(classicMode);
}

function selectGameMode(id) {
    gameModeDescription.textContent = gameModes[id];

    for (const mode in gameModes) {
        if (mode === id) {
            document.getElementById(mode).classList.add(selectedGameModeClass);
        } else {
            document.getElementById(mode).classList.remove(selectedGameModeClass);
        }
    }

    teardownClassicMode();
    teardownTrainingMode();
    if (id === classicMode) {
        setupClassicMode();
    } else if (id === trainingMode) {
        setupTrainingMode();
    }
}

function setupClassicMode() {
    resetInputsAndMessages();

    const today = getCurrentDateDMY();
    dateTitle.textContent = "Color of the day: " + today[0] + " " + months[today[1]].slice(0, 3) + " " + today[2];
    dateTitle.style.display = "";

    const targetColorRGB = rgbColorFromDate(...today);
    checkGuessButton.onclick = function () { checkGuess(targetColorRGB, { dateDMY: today, key: classicMode }); };

    setTargetColor(targetColorRGB);

    const storedDataJSON = localStorage.getItem(classicMode);

    if (storedDataJSON == null) {
        return;
    }

    // Example structure of the stored data: `{dateDMY: [25, 5, 2024], guessRGB: [123, 19, 245]}`
    const storedData = JSON.parse(storedDataJSON);
    if (!datesDMYAreEqual(storedData.dateDMY, today)) {
        return;
    }

    paintAndScoreUserGuessRGB(storedData.guessRGB, targetColorRGB);
    inputContainer.style.display = "none";
    checkGuessButton.style.display = "none";
}

function teardownClassicMode() {
    resetInputsAndMessages();
    dateTitle.style.display = "none";
    inputContainer.style.display = "";
    checkGuessButton.style.display = "";
}

function setupTrainingMode() {
    resetInputsAndMessages();

    retryButton.style.display = "";
    retryButton.onclick = function () {
        setupTrainingMode();
    }

    const targetColorRGB = [random256(), random256(), random256()];
    checkGuessButton.onclick = function () { checkGuess(targetColorRGB); };
    setTargetColor(targetColorRGB);
}

function teardownTrainingMode() {
    resetInputsAndMessages();
    retryButton.style.display = "none";
    retryButton.onclick = null;
}

function resetInputsAndMessages() {
    // Reset all text fields
    userGuessInput.value = "";
    errorMessage.textContent = "";
    resultMessage.textContent = "";

    // Unset the "Check Guess" button action
    checkGuessButton.onclick = null;

    // Reset guessed color
    yourGuessColorPanel.textContent = "Input a guess below!";
    yourGuessColorPanel.style.backgroundColor = "transparent";
}

// persistInfo is optional, if provided it must be structured like:
// `persistInfo = {dateDMY: [24, 5, 2024], key: "classic-mode"}`
function checkGuess(targetColorRGB, persistInfo = null) {
    errorMessage.textContent = "";
    resultMessage.textContent = "";

    const userGuessRGB = parseUserGuessRGB();
    if (userGuessRGB === null) {
        return;
    }

    paintAndScoreUserGuessRGB(userGuessRGB, targetColorRGB);

    if (persistInfo !== null) {
        const storageData = { dateDMY: persistInfo.dateDMY, guessRGB: userGuessRGB };
        localStorage.setItem(persistInfo.key, JSON.stringify(storageData));
    }
}

function parseUserGuessRGB() {
    const userGuessHex = userGuessInput.value.trim();
    const matches = userGuessHex.match(hexCodeRe);

    if (matches === null || matches.length !== 4) {
        errorMessage.textContent = "\"#" + userGuessHex + "\" is not a valid RGB hex string. Example: #FF77AA";
        return null;
    }

    return hexToRgb(matches.slice(1));
}

function paintAndScoreUserGuessRGB(userGuessRGB, targetColorRGB) {
    yourGuessColorPanel.textContent = "";
    yourGuessColorPanel.style.backgroundColor = rgbToString(userGuessRGB);

    resultMessage.innerHTML = scoreMessage(userGuessRGB, targetColorRGB);
}

function scoreMessage(userGuessRGB, targetColorRGB) {
    const dist = rgbDistance(userGuessRGB, targetColorRGB);
    const score = 100 - (100 * dist);

    return "Your score: " + to1DecimalPlace(score) + "%" +
        "\n\n<b>The target was " + rgbToHex(targetColorRGB) + "</b>" +
        "\nYour guess was " + rgbToHex(userGuessRGB);
}

function rgbColorFromDate(day, month, year) {
    const r = cantor3(day, month, year) % 256;
    const g = cantor3(month, year, day) % 256;
    const b = cantor3(year, day, month) % 256;

    return [r, g, b]
}

function setTargetColor(rgbArr) {
    targetColorPanel.style.backgroundColor = rgbToString(rgbArr);
}

function cantor3(a, b, c) {
    return cantor(a, cantor(b, c));
}

function cantor(a, b) {
    return (a + b + 1) * (a + b) / 2 + b;
}

function rgbToHex(rgbArr) {
    function componentToHex(c) {
        const hex = c.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }

    return "#" + componentToHex(rgbArr[0]) + componentToHex(rgbArr[1]) + componentToHex(rgbArr[2]);
}

function rgbToString(rgbArr) {
    return "rgb(" + rgbArr.join(",") + ")"
}

function hexToRgb(hexArr) {
    return [parseInt(hexArr[0], 16), parseInt(hexArr[1], 16), parseInt(hexArr[2], 16)];
}

function random256() {
    return Math.floor(Math.random() * 256);
}

// Normalized between 0 and 1.
function rgbDistance(rgbA, rgbB) {
    const rDist = Math.pow(Math.abs(rgbA[0] - rgbB[0]), 2);
    const gDist = Math.pow(Math.abs(rgbA[1] - rgbB[1]), 2);
    const bDist = Math.pow(Math.abs(rgbA[2] - rgbB[2]), 2);

    const dist = Math.sqrt(rDist + gDist + bDist);

    const maxDist = Math.sqrt(3 * Math.pow(255, 2));

    return dist / maxDist;
}

function to1DecimalPlace(num) {
    return num.toString().match(/^-?\d+(?:\.\d{0,1})?/)[0];
}

function getCurrentDateDMY() {
    const today = new Date();
    return [today.getDate(), today.getMonth() + 1, today.getFullYear()]
}

function datesDMYAreEqual(dateA, dateB) {
    return dateA[0] === dateB[0] && dateA[1] === dateB[1] && dateA[2] === dateB[2]
}