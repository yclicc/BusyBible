// Elements from the DOM
const statusReportElement = document.getElementById('statusReport');
const linksElement = document.getElementById('links');
const startDateSelector = document.getElementById('startDateSelector');
const offsetSelector = document.getElementById('offsetSelector');
const translationSelector = document.getElementById('translationSelector');
const presetPlanSelectorDiv = document.getElementById('presetPlanSelectorDiv');
const numListsElement = document.getElementById('numLists');
const selectListElement = document.getElementById('selectList');
const listOfBooksElement = document.getElementById("listOfBooks");
const planListsDiv = document.getElementById("planListsDiv");

// Initial global variables
let startDate, translation, today, offsetValue;
let plan = [];
let speed = [];
let presetPlan = 'Custom';


function populatePresetPlanSelector() {
    for (let planName in presets["plans"]) {
        var button = document.createElement('button');
        button.innerHTML = presets["plansMeta"][planName]["name"];
        button.dataset.planName = planName;
        button.classList.add('presetPlanButton')
        if (planName in presets["plansMeta"]) {
            var tooltip = document.createElement('span');
            tooltip.classList.add('tooltiptext');
            tooltip.innerHTML = presets["plansMeta"][planName]["tooltip"];
            button.appendChild(tooltip);
        }
        button.addEventListener('click', function () {
            plan = structuredClone(presets["plans"][planName]);
            if (planName in presets["speeds"]) {
                speed = structuredClone(presets["speeds"][planName]);
            } else {
                speed = generateDefaultSpeedFromPlan(plan);
            }
            updateListsSelectors();
        })
        presetPlanSelectorDiv.appendChild(button);
    }
}

function updateSelectedPresetPlan() {
    buttons = document.getElementsByClassName('presetPlanButton');
    let presetPlanUpdate = 'Custom'
    for (let i = 0; i < buttons.length; i++) {
        var button = buttons[i];
        let presetSpeed;
        if (button.dataset.planName in presets["speeds"]) {
            presetSpeed = presets["speeds"][button.dataset.planName];
        } else {
            presetSpeed = generateDefaultSpeedFromPlan(presets["plans"][button.dataset.planName])
        }
        if (arrayEquals(plan, presets["plans"][button.dataset.planName]) & arrayEquals(speed, presetSpeed)) {
            presetPlanUpdate = presets["plansMeta"][button.dataset.planName]["name"]
            button.classList.add('selected')
        } else {
            button.classList.remove('selected')
        }
    }
    presetPlan = presetPlanUpdate;

}

// Helper function for modulo operation, supporting negative values
function mod(n, m) {
    return ((n % m) + m) % m;
}

// Converts dd/mm/yyyy as a string to a UTC 00:00:00 date at the start of that day (timezone agnostic)
function createUTCDateFromDateString(dateString) {
    const [day, month, year] = dateString.split('/').map(Number);

    // Note: Months in JavaScript are 0-indexed (0 for January, 1 for February, etc.)
    const utcDate = new Date(Date.UTC(year, month - 1, day));

    return utcDate.toISOString().split('T')[0];
}

function getTodaysDateInLocalTimeAsIfUTC() {
    // Get the time now in the user's timezone e.g. "2023-12-18T15:03:49.796Z" in GMT+9
    const today = new Date();
    // Convert to dd/mm/yyyy format in local users timezone
    const todayFormatted = today.toLocaleDateString('en-gb', { year: 'numeric', month: '2-digit', day: '2-digit' });
    return createUTCDateFromDateString(todayFormatted)
}

// Generates a list of book indexes
function generateBookIndexes() {
    return Array.from({ length: 66 }, (_, i) => i + 1);
}

let listOfBookIndexes = generateBookIndexes();

// Appends a delete button to list items
function appendDeleteButton(listItem, sublistIndex) {
    var deleteButton = document.createElement('span');
    deleteButton.className = 'delete-btn';
    deleteButton.innerHTML = '❌';
    deleteButton.addEventListener('click', () => deleteBookFromPlan(listItem, sublistIndex));
    listItem.appendChild(deleteButton);
}

// Appends circled numbers to list items
function appendNumberInCircle(element, index) {
    let circledNumber = getCircledNumber(index);
    element.innerHTML += `<span class="circled-number">${circledNumber}</span>`;
}

// Returns the Unicode character for a circled number
function getCircledNumber(index) {
    if (index <= 20) {
        return String.fromCodePoint(0x245F + index);
    } else if (index <= 35) {
        return String.fromCodePoint(0x3250 - 20 + index);
    } else if (index <= 50) {
        return String.fromCodePoint(0x32B1 - 36 + index);
    } else {
        return `(${index})`;
    }
}

// Event handler for book selection
function selectBook(bookIndex, listItem) {
    appendNumberInCircle(listItem, selectedBooks.length + 1);
    selectedBooks.push(bookIndex);
}

// Populates a list element with book entries
function populateList(listElement, bookIndexes, isDeletable, sublistIndex) {
    listElement.innerHTML = "";
    bookIndexes.forEach(index => {
        var listItem = document.createElement("li");
        listItem.setAttribute("data-id", index);
        listItem.classList.add("list-group-item");
        listItem.textContent = bibleData[index]["book"] + " ";

        if (isDeletable) {
            appendDeleteButton(listItem, sublistIndex);
        } else {
            listItem.addEventListener('click', () => selectBook(index, listItem));
        }

        listElement.appendChild(listItem);
    });
}

// Tests whether two arrays are equal
function arrayEquals(array1, array2) {
    return (array1.length == array2.length) && array1.every(function (element, index) {
        if (Array.isArray(element) && Array.isArray(array2[index]) && element.length == array2[index].length) {
            return arrayEquals(element, array2[index])
        } else {
            return element === array2[index];
        }
    });
}

// Tests whether a list is found in the values of an object, and then returns the key if so
function testInValues(obj, list) {
    for (let k in obj) {
        if (arrayEquals(obj[k], list)) {
            return k;
        }
    }
    return false;
}

function computeListLength(list) {
    return list.flatMap(bookIndexToListOfChapters).length
}

function createNumberSelector(value) {
    const selector = document.createElement('input');
    selector.type = 'number';
    selector.min = 1;
    selector.value = value;
    return selector;
}

function speedSelectorEventListenerAppend(sublistIndex, chaptersPerActiveDaySelector, activeEveryXDaysSelector, activeOnDayNumberSelector) {
    function onChange() {
        speed[sublistIndex] = [parseInt(chaptersPerActiveDaySelector.value), parseInt(activeEveryXDaysSelector.value), parseInt(activeOnDayNumberSelector.valueAsNumber) - 1];
        activeOnDayNumberSelector.max = parseInt(activeEveryXDaysSelector.value);
        valueUpdate();
    }

    chaptersPerActiveDaySelector.addEventListener('input', onChange);
    activeEveryXDaysSelector.addEventListener('input', onChange);
    activeOnDayNumberSelector.addEventListener('input', onChange);
}

// Populates a span element that heads a list with a title and info
function populateListHeader(spanElement, bookIndexes, sublistIndex) {
    let listName = testInValues(presets["lists"], bookIndexes);
    if (listName) {
        listName = listName + ' : '
    } else {
        listName = ''
    }
    let listLength = computeListLength(bookIndexes);
    const listTitle = document.createElement('span')
    listTitle.innerHTML = `List ${sublistIndex + 1}: ${listName}${listLength} Chapters`;
    spanElement.append(listTitle);
    spanElement.append(document.createElement('br'))
    
    const speedSelector = document.createElement('span');
    const listSpeed = speed[sublistIndex];
    
    const chaptersPerActiveDaySelector = createNumberSelector(listSpeed[0]);
    const activeEveryXDaysSelector = createNumberSelector(listSpeed[1]);
    const activeOnDayNumberSelector = createNumberSelector(listSpeed[2] + 1);
    activeOnDayNumberSelector.max = listSpeed[1];
    speedSelectorEventListenerAppend(sublistIndex, chaptersPerActiveDaySelector, activeEveryXDaysSelector, activeOnDayNumberSelector)
    
    speedSelector.append(chaptersPerActiveDaySelector);
    speedSelector.append(' chapters every ');
    speedSelector.append(activeEveryXDaysSelector);
    speedSelector.append(' days on day ');
    speedSelector.append(activeOnDayNumberSelector)
    
    spanElement.append(speedSelector);
}

// Populate translation selector
function populateTranslationSelector() {
    for (const key in bibleTranslations) {
        const option = document.createElement('option');
        option.value = key;
        option.text = bibleTranslations[key]['label'];
        translationSelector.appendChild(option);
    }
}

// Clears the selection
function clearSelection() {
    selectedBooks = [];
    populateList(listOfBooks, listOfBookIndexes, false);
    valueUpdate();
}

function appendToList() {
    plan[selectList.value - 1] = plan[selectList.value - 1].concat(selectedBooks);
    clearSelection();
    updatePlanListsDiv();
}

function replaceList() {
    plan[selectList.value - 1] = [];
    appendToList();
}

function updateListsSelectors() {
    updatePlanListsDiv();
    numLists.value = plan.length;
    selectList.max = plan.length;
    valueUpdate();

}

function increment() {
    plan.push([]);
    speed.push([1, 1, 0])
    updateListsSelectors();
}

function decrement() {
    if (plan.length > 1) {
        plan.pop();
        speed.pop();
    }
    updateListsSelectors();
}

// Event handler for deleting a book from the plan
function deleteBookFromPlan(listItem, sublistIndex) {
    var index = Array.from(listItem.parentNode.children).indexOf(listItem);
    plan[sublistIndex].splice(index, 1);
    listItem.parentNode.removeChild(listItem);
    updateListsSelectors();
}

// Generates a URL pointing to the current settings
function generateURL(permalink = false, next = false) {
    startDate = startDateSelector.value;
    offsetValue = parseInt(offsetSelector.value);
    translation = translationSelector.value;
    const url = new URL(window.location.href);
    if (permalink) {
        url.searchParams.delete('start');
        if (next) {
            url.searchParams.set('offset', dayOfPlan + 1);
        } else {
            url.searchParams.set('offset', dayOfPlan);
        }
    } else {
        url.searchParams.set('start', startDate);
        url.searchParams.set('offset', offsetValue);
    }
    url.searchParams.set('translation', translation);
    let presetPlan = testInValues(presets["plans"], plan)
    if (presetPlan) {
        url.searchParams.set('plan', presetPlan);
    } else {
        url.searchParams.set('plan', btoa(JSON.stringify(plan)));
    }
    
    if (arrayEquals(speed, generateDefaultSpeedFromPlan(plan))) {
        url.searchParams.delete('speed');
    } else {
        let presetSpeed = testInValues(presets["speeds"], speed);
        if (presetSpeed) {
            url.searchParams.set('speed', presetSpeed);
        } else {
            url.searchParams.set('speed', btoa(JSON.stringify(speed)))
        }
    }
    
    return url
}

// Updates the URL with current parameters
function updateURL(pushNotReplace = false) {
    const url = generateURL();
    if (pushNotReplace) {
        window.history.pushState({}, '', url);
    } else {
        window.history.replaceState({}, '', url);
    }
}

function copyURLtoClipboard(permalink = false, next = false) {
    const url = generateURL(permalink, next);
    navigator.clipboard.writeText(url.href);
}

// Update the display of plan lists
function updatePlanListsDiv() {
    planListsDiv.innerHTML = "";
    plan.forEach((sublist, index) => {
        var sublistDiv = document.createElement("div");
        var sublistHeader = document.createElement("span");
        populateListHeader(sublistHeader, sublist, index);
        sublistDiv.append(sublistHeader);
        var sublistUl = document.createElement("ul");
        populateList(sublistUl, sublist, true, index);
        sublistDiv.append(sublistUl);
        planListsDiv.append(sublistDiv);
    });
    updateURL();
}

function valueUpdate(pushNotReplace = false) {
    updateURL(pushNotReplace);
    updateDayOfPlan();
    updateSelectedPresetPlan();
    reportStatus();
    calculateReadings();
}

function valueUpdatePush() {
    valueUpdate(true);
}

// Initializes the page on load
function pageLogic() {
    populateList(listOfBooksElement, listOfBookIndexes, false);
    populateTranslationSelector();
    populatePresetPlanSelector();
    today = getTodaysDateInLocalTimeAsIfUTC()
    setInitialValuesFromURL();
    updatePlanListsDiv();
    valueUpdate();
};

// Updates the status report on the page
function reportStatus() {
    statusReportElement.innerHTML =
        `The plan is <b>${presetPlan}</b> <br />
    You started the plan on <b>${startDate}</b> <br />
    The offset is <b>${offsetValue}</b><br />
    So you are on day <b>${dayOfPlan + 1}</b>`
}

// Updates the day of the plan
function updateDayOfPlan() {
    daysSinceStart = Math.ceil((new Date(today) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    dayOfPlan = daysSinceStart + offsetValue;
}

function bookIndexToListOfChapters(bookIndex) {
    if (bookIndex === undefined) {
        return []
    } else {
        return bibleData[bookIndex]["chapters"]
    }
}

// Convert a listOfChapters to a list of JSON objects, then extract the desired key for the day of the plan
function listOfChaptersToExtractKey(listOfChapters, listIndex, key) {
    if (listOfChapters === undefined || listOfChapters.length == 0) {
        return []
    } else {
        // chaptersPerActiveDay is e.g. 3 for 3 chapters when this list is active
        // activeEveryXDays is e.g. 5 for one day in 5 the list is active
        // activeOnDayNumber is e.g. 0 for the first in every 5 days
        const [chaptersPerActiveDay, activeEveryXDays, activeOnDayNumber] = speed[listIndex]; 
        if ((dayOfPlan % activeEveryXDays) == activeOnDayNumber) {
            const chaptersReadBefore = Math.floor(dayOfPlan / activeEveryXDays) * chaptersPerActiveDay;
            const listOfChapterIndexes = [...Array(chaptersPerActiveDay).keys()].map(i => i + chaptersReadBefore);
            return listOfChapterIndexes.map(index => listOfChapters[mod(index, listOfChapters.length)][key]);
        } else {
            return [];
        }
    }
}

function listOfChaptersToReadings(listOfChapters, listIndex) {
    return listOfChaptersToExtractKey(listOfChapters, listIndex, "title")
}

function listOfChaptersToListenings(listOfChapters, listIndex) {
    return listOfChaptersToExtractKey(listOfChapters, listIndex, "abbrev")
}

function listOfChaptersToVerseCount(listOfChapters, listIndex) {
    return listOfChaptersToExtractKey(listOfChapters, listIndex, "verses")
}

function formatTime(seconds) {
    // Ensure the input is a positive number
    seconds = Math.abs(seconds);

    // Calculate days, hours, minutes, and remaining seconds
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    // Construct the formatted time string
    let formattedTime = '';
    if (days > 0) {
        formattedTime += days + 'D:';
    }
    if (hours > 0 || days > 0) {
        formattedTime += (hours < 10 ? '0' : '') + hours + 'h:';
    }
    if (minutes > 0 || hours > 0 || days > 0) {
        formattedTime += (minutes < 10 ? '0' : '') + minutes + 'm:';
    }
    formattedTime += (remainingSeconds < 10 ? '0' : '') + remainingSeconds + 's';

    return formattedTime;
}

function verseCountToAudioDuration(verseCount) {
    // The complete Suchet recording is 80 hours long
    const secondsPerVerse = 80 * 60 * 60 / 31102
    const estimatedSecondsDuration = secondsPerVerse * verseCount;
    return formatTime(estimatedSecondsDuration);
}

// Calculates and displays today's readings
function calculateReadings() {
    const readingsLists = plan.map(listOfInts => listOfInts.flatMap(bookIndexToListOfChapters));
    const todaysReadings = readingsLists.flatMap(listOfChaptersToReadings);
    const linkWithoutReadings = `https://www.biblegateway.com/passage/?search=$&version=${bibleTranslations[translation]['read']}`
    const link = linkWithoutReadings.replace('$', todaysReadings.join(','));
    const todaysListenings = readingsLists.flatMap(listOfChaptersToListenings);
    const audioLinkWithoutListenings = `https://www.biblegateway.com/audio/${bibleTranslations[translation]['listen']}$`
    const audioLink = audioLinkWithoutListenings.replace('$', todaysListenings.join(','));
    const verseCount = readingsLists.flatMap(listOfChaptersToVerseCount).reduce(function (prev, curr) {
        return prev + curr;
    }, 0)
    const estimatedAudioDuration = verseCountToAudioDuration(verseCount);
    linksElement.innerHTML = "Today's readings are: <b>" + todaysReadings.join(', ') + '</b><br />' +
        `Verses: <b>${verseCount}</b>` + '<br />' +
        `Estimated audio duration: <b>${estimatedAudioDuration}` + '</b><br />' +
        `<a href="${link}"><b>Read</b> 📖 on BibleGateway</a>` + '<br />' +
        `<a href="${audioLink}"><b>Listen</b> 🔊 on BibleGateway</a>`;
    return todaysReadings;
}

// Function to check if an array contains only integers between min and max (inclusive)
function isArrayValid(arr, min, max) {
    return Array.isArray(arr) && arr.length > 0 && arr.every(num => Number.isInteger(num) && num >= min && num <= max);
}

// Function to check if plan is a list of lists, where each sublist is nonempty and contains only a list of
// integers between 1 and 66 inclusive
function isPlanDataValid(data) {
    const min = 1;
    const max = 66;
    return Array.isArray(data) && data.length > 0 && data.every(sublist => isArrayValid(sublist, min, max));
}

function isSpeedDataValid(data, lengthOfPlan) {
    return Array.isArray(data) && data.length == lengthOfPlan && data.every(sublist => sublist.length == 3);
}

// Returns the default, 1 chapter per day from every list, from the plan
function generateDefaultSpeedFromPlan(plan) {
    return plan.map(sublist => [1, 1, 0]);
}

// Sets initial values from URL parameters
function setInitialValuesFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    startDate = urlParams.get('start');
    offsetValue = urlParams.get('offset');
    translation = urlParams.get('translation');
    const encodedPlan = urlParams.get("plan");
    const encodedSpeed = urlParams.get("speed");

    // Set default values if not provided in the URL
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!startDate || !dateRegex.test(startDate)) {
        startDate = today;
    }
    startDateSelector.value = startDate;

    const offsetInt = parseInt(offsetValue);
    if (!offsetValue || isNaN(offsetInt)) {
        offsetValue = 0;
    } else {
        offsetValue = offsetInt;
    }
    offsetSelector.value = offsetValue;

    if (!translation || !(translation in bibleTranslations)) {
        translation = 'NIVUK';
    }
    translationSelector.value = translation;


    let defaultPlan = Object.values(presets["plans"])[0];

    if (!encodedPlan) {
        plan = structuredClone(defaultPlan);
    } else if (encodedPlan in presets["plans"]) {
        plan = structuredClone(presets["plans"][encodedPlan]);
    } else {
        const decodedPlan = atob(encodedPlan);
        plan = JSON.parse(decodedPlan);
        if (!isPlanDataValid(plan)) {
            plan = defaultPlan;
        }
    }

    if (!encodedSpeed) {
        speed = generateDefaultSpeedFromPlan(plan);
    } else if (encodedSpeed in presets["speeds"]) {
        speed = structuredClone(presets["speeds"][encodedSpeed]);
    } else {
        const decodedSpeed = atob(encodedSpeed);
        speed = JSON.parse(decodedSpeed);
        if (!isSpeedDataValid(speed, plan.length)) {
            speed = generateDefaultSpeedFromPlan(plan);
        }
    }

    updateListsSelectors();

    // Update URL with default values
    updateURL();
}

// Event handler for input changes
startDateSelector.addEventListener('input', valueUpdate);
translationSelector.addEventListener('change', valueUpdatePush);
offsetSelector.addEventListener('input', valueUpdate);

// Additional event listeners
document.addEventListener('DOMContentLoaded', function () {
    numLists.addEventListener('input', function (event) {
        event.preventDefault();
        numLists.value = plan.length;
    });
})

// Event listeners for link copying
document.getElementById('copyPlanLink').addEventListener('click', function (event) {
    copyURLtoClipboard(false);
    event.target.classList.remove('deselected');
    event.target.classList.add('selected');
    setTimeout(function () {
        event.target.classList.add('deselected');
        event.target.classList.remove('selected');
    }, 1000)
})
document.getElementById('copyPassagesLink').addEventListener('click', function (event) {
    copyURLtoClipboard(true);
    event.target.classList.remove('deselected');
    event.target.classList.add('selected');
    setTimeout(function () {
        event.target.classList.add('deselected');
        event.target.classList.remove('selected');
    }, 1000)
})
document.getElementById('copyNextPassagesLink').addEventListener('click', function (event) {
    copyURLtoClipboard(true, true);
    event.target.classList.remove('deselected');
    event.target.classList.add('selected');
    setTimeout(function () {
        event.target.classList.add('deselected');
        event.target.classList.remove('selected');
    }, 1000)
})

// Event listeners for plan manipulation
selectListElement.addEventListener('change', valueUpdate);
document.getElementById('appendButton').addEventListener('click', appendToList);
document.getElementById('replaceButton').addEventListener('click', replaceList);
document.getElementById('clearSelectionButton').addEventListener('click', clearSelection);

// Event listeners for plan modification
document.getElementById('increment').addEventListener('click', increment);
document.getElementById('decrement').addEventListener('click', decrement);
