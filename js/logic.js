// Elements from the DOM
const statusReportElement = document.getElementById('statusReport');
const linksElement = document.getElementById('links');
const startDateSelector = document.getElementById('startDateSelector');
const offsetSelector = document.getElementById('offsetSelector');
const numListsElement = document.getElementById('numLists');
const selectListElement = document.getElementById('selectList');
const listOfBooksElement = document.getElementById("listOfBooks");
const planListsDiv = document.getElementById("planListsDiv");

// Initial global variables
let startDate, today, offsetValue;
let plan = [];
let defaultPlan = [[40, 41, 42, 43], [1, 2, 3, 4, 5], [45, 46, 47, 48, 49, 50, 51, 58], 
                    [52, 53, 54, 55, 56, 57, 59, 60, 61, 62, 63, 64, 65, 66], [18, 22], 
                    [19], [20, 21], [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17], 
                    [23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39], 
                    [44]];

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
    updateListsSelectors();
}

function decrement() {
    if (plan.length > 1) {
        plan.pop();
    }
    updateListsSelectors();
}

// Event handler for deleting a book from the plan
function deleteBookFromPlan(listItem, sublistIndex) {
    var index = Array.from(listItem.parentNode.children).indexOf(listItem);
    plan[sublistIndex].splice(index, 1);
    listItem.parentNode.removeChild(listItem);
}

// Updates the URL with current parameters
function updateURL() {
    startDate = startDateSelector.value;
    offsetValue = parseInt(offsetSelector.value);
    const url = new URL(window.location.href);
    url.searchParams.set('start', startDate);
    url.searchParams.set('offset', offsetValue);
    url.searchParams.set('plan', btoa(JSON.stringify(plan)));
    window.history.replaceState({}, '', url);
}

// Update the display of plan lists
function updatePlanListsDiv() {
    planListsDiv.innerHTML = "";
    plan.forEach((sublist, index) => {
        var sublistUl = document.createElement("ul");
        populateList(sublistUl, sublist, true, index);
        planListsDiv.append(sublistUl);
    });
    updateURL();
}

function valueUpdate() {
  updateURL();
  updateDayOfPlan();
  reportStatus();
  calculateReadings();
}

// Initializes the page on load
function pageLogic() {
  populateList(listOfBooksElement, listOfBookIndexes, false);
  today = getTodaysDateInLocalTimeAsIfUTC()
  setInitialValuesFromURL();
  updatePlanListsDiv();
  valueUpdate();
};

// Updates the status report on the page
function reportStatus() {
    statusReportElement.innerHTML =
        `You started the plan on ${startDate} <br />
    The offset is ${offsetValue}<br />
    So you are on day ${dayOfPlan + 1}`
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

function listOfChaptersToReadings(listOfChapters) {
  if (listOfChapters === undefined || listOfChapters.length == 0) {
      return []
  } else {
      return [listOfChapters[mod(dayOfPlan, listOfChapters.length)]["title"]]
  }
}

function listOfChaptersToListenings(listOfChapters) {
    if (listOfChapters === undefined || listOfChapters.length == 0) {
        return []
    } else {
        return [listOfChapters[mod(dayOfPlan, listOfChapters.length)]["abbrev"]]
    }
}

// Calculates and displays today's readings
function calculateReadings() {
    const readingsLists = plan.map(listOfInts => listOfInts.flatMap(bookIndexToListOfChapters));
    const todaysReadings = readingsLists.flatMap(listOfChaptersToReadings);
    const link = `https://www.biblegateway.com/passage/?search=${todaysReadings.join(',')}&version=NIVUK`;
    const todaysListenings = readingsLists.flatMap(listOfChaptersToListenings);
    const audioLink = `https://www.biblegateway.com/audio/suchet/nivuk/${todaysListenings.join(',')}`;
    linksElement.innerHTML = "Today's readings are: " + todaysReadings.join(', ') + '<br />' +
        `<a href="${link}">Read 📖</a>` + '<br />' +
        `<a href="${audioLink}">Listen 🔊</a>`;
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

// Sets initial values from URL parameters
function setInitialValuesFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    startDate = urlParams.get('start');
    offsetValue = urlParams.get('offset');
    const encodedPlan = urlParams.get("plan");

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

    if (!encodedPlan) {
        plan = defaultPlan;
    } else {
        const decodedPlan = atob(encodedPlan);
        plan = JSON.parse(decodedPlan);
        if (!isPlanDataValid(plan)) {
            plan = defaultPlan;
        }
    }

    updateListsSelectors();

    // Update URL with default values
    updateURL();
}

// Event handler for input changes
startDateSelector.addEventListener('input', valueUpdate);
offsetSelector.addEventListener('input', valueUpdate);

// Additional event listeners
document.addEventListener('DOMContentLoaded', function () {
    numLists.addEventListener('input', function (event) {
        event.preventDefault();
        numLists.value = plan.length;
    });
})

// Event listeners for plan manipulation
selectListElement.addEventListener('change', valueUpdate);
document.getElementById('appendButton').addEventListener('click', appendToList);
document.getElementById('replaceButton').addEventListener('click', replaceList);
document.getElementById('clearSelectionButton').addEventListener('click', clearSelection);

// Event listeners for plan modification
document.getElementById('increment').addEventListener('click', increment);
document.getElementById('decrement').addEventListener('click', decrement);
