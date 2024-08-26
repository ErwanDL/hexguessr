"use strict";

const months = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];
const hexCodeRe = /^([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})$/;
const selectedGameModeClass = "selected-game-mode-button";
const classicMode = "classic-mode";
const trainingMode = "training-mode";
const blinkMode = "blink-mode";
const gameModes = {};
gameModes[classicMode] = "Everyday a new color, the same for everyone, only one attempt.\nChallenge your friends and get the highest score!";
gameModes[trainingMode] = "Practice with as many attempts and random colors as you want.";
gameModes[blinkMode] = "Only for the maddest out there: it's like Classic mode,\nbut you only get to see the color for 0.1s!"

const gameModeDescription = document.getElementById('game-mode-description');
const targetColorPanel = document.getElementById('target-color-panel');
const yourGuessColorPanel = document.getElementById('your-guess-color-panel');
const errorMessage = document.getElementById('error-message');
const resultMessage = document.getElementById('result-message');
const panelsContainer = document.getElementById('panels-container');
const inputContainer = document.getElementById('input-container');
const userGuessInput = document.getElementById('color-guess');
const readyButton = document.getElementById('ready-button');
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

    resetGameToDefault();
    if (id === classicMode) {
        setupClassicMode();
    } else if (id === trainingMode) {
        setupTrainingMode();
    } else if (id === blinkMode) {
        setupBlinkMode();
    } else {
        console.error("Unknown game mode ID: " + id);
    }
}

function setupClassicMode() {
    const today = getCurrentDateDMY();
    dateTitle.textContent = "Classic Mode color of the day:\n" + formatDateDMY(today);

    const targetColorRGB = rgbColorFromDate(...today);
    checkGuessButton.onclick = function () { checkGuess(targetColorRGB, { dateDMY: today, key: classicMode }); };
    targetColorPanel.style.backgroundColor = rgbToString(targetColorRGB);

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
    disableGuessing();
}

function setupTrainingMode() {
    dateTitle.style.display = "none";

    // Show a retry button
    retryButton.style.display = "";
    retryButton.onclick = function () {
        resetGameToDefault();
        setupTrainingMode();
    }

    const targetColorRGB = [random256(), random256(), random256()];
    checkGuessButton.onclick = function () { checkGuess(targetColorRGB); };
    targetColorPanel.style.backgroundColor = rgbToString(targetColorRGB);
}

function setupBlinkMode() {
    const today = getCurrentDateDMY();
    dateTitle.textContent = "Blink Mode color of the day:\n" + formatDateDMY(today);

    const targetColorRGB = rgbColorFromDate(...today.map((v) => v + 1));
    checkGuessButton.onclick = function () { checkGuess(targetColorRGB, { dateDMY: today, key: blinkMode }); };

    const storedDataJSON = localStorage.getItem(blinkMode);
    if (storedDataJSON != null) {
        const storedData = JSON.parse(storedDataJSON);
        if (datesDMYAreEqual(storedData.dateDMY, today)) {
            targetColorPanel.style.backgroundColor = rgbToString(targetColorRGB);
            paintAndScoreUserGuessRGB(storedData.guessRGB, targetColorRGB);
            disableGuessing();
            return;
        }
    }

    disableGuessing();
    panelsContainer.style.visibility = "hidden";
    readyButton.style.display = "";

    readyButton.onclick = function () {
        readyButton.style.display = "none"
        panelsContainer.style.visibility = "visible";
        targetColorPanel.style.backgroundColor = "transparent";

        let countdownValue = 3;
        targetColorPanel.innerText = countdownValue;
        targetColorPanel.style.fontSize = "5em";

        // Start the countdown
        const countdownInterval = setInterval(function () {
            countdownValue--;
            targetColorPanel.innerText = countdownValue;

            if (countdownValue <= 0) {
                clearInterval(countdownInterval);
                targetColorPanel.textContent = "none";
                targetColorPanel.style.fontSize = "";
                targetColorPanel.style.backgroundColor = rgbToString(targetColorRGB);
                reenableGuessing();

                setTimeout(function () {
                    targetColorPanel.style.backgroundColor = "";
                    targetColorPanel.textContent = "Color already shown, you better not have blinked!"
                }, 100);
            }
        }, 1000);
    }
}

function disableGuessing() {
    inputContainer.style.display = "none";
    checkGuessButton.style.display = "none";
}

function reenableGuessing() {
    inputContainer.style.display = "";
    checkGuessButton.style.display = "";
}

function resetGameToDefault() {
    // Reset all text fields
    userGuessInput.value = "";
    errorMessage.textContent = "";
    resultMessage.textContent = "";

    // Restore guess input
    inputContainer.style.display = "";
    checkGuessButton.style.display = "";

    // Hide retry button
    retryButton.style.display = "none";

    // Hide ready button
    readyButton.style.display = "none";

    // Reset guessed color panel
    yourGuessColorPanel.textContent = "Input a guess below!";
    yourGuessColorPanel.style.backgroundColor = "";

    // Unset button actions
    checkGuessButton.onclick = null;
    retryButton.onclick = null;

    // Restore date
    dateTitle.style.display = "";

    // Restore visibility of panelsContainer
    panelsContainer.style.visibility = "";
}

// persistInfo is optional, if provided it must be structured like:
// `persistInfo = {dateDMY: [24, 5, 2024], key: "classic-mode"}`
function checkGuess(targetColorRGB, persistInfo = null) {
    errorMessage.textContent = "";
    resultMessage.textContent = "";

    // Re-enable the target color panel (for blink mode)
    targetColorPanel.textContent = "";
    targetColorPanel.style.backgroundColor = rgbToString(targetColorRGB);

    const userGuessRGB = parseUserGuessRGB();
    if (userGuessRGB === null) {
        return;
    }

    paintAndScoreUserGuessRGB(userGuessRGB, targetColorRGB);

    if (persistInfo !== null) {
        const storageData = { dateDMY: persistInfo.dateDMY, guessRGB: userGuessRGB };
        localStorage.setItem(persistInfo.key, JSON.stringify(storageData));

        disableGuessing();
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

function formatDateDMY(d) {
    return d[0] + " " + months[d[1]].slice(0, 3) + " " + d[2];
}