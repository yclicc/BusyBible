var startDate, offsetValue;

function mod(n, m) {
  // Modulo that works for negative lookups, turning them into the modulus minus the number
  return ((n % m) + m) % m
}

// Function to update URL parameters
function updateURL() {
  startDate = startDateSelector.value;
  offsetValue = parseInt(offsetSelector.value);

  // Update URL with parameters
  const url = new URL(window.location.href);
  url.searchParams.set('start', startDate);
  url.searchParams.set('offset', offsetValue);
  const decodedPlan = JSON.stringify(plan);
  url.searchParams.set('plan', btoa(decodedPlan));

  // Replace current URL with the updated one
  window.history.replaceState({}, '', url);
}

function updatePlanListsDiv() {
  listOfSortableLists = []
  // Get rid of everything currently in the div
  planListsDiv.innerHTML = "";
  plan.forEach(function (sublist, index) {
    var sublistUl = document.createElement("ul");
    populateList(sublistUl, sublist, true, index)
    planListsDiv.append(sublistUl);
    updateURL();
  });
}

// Function to append circled numbers to li elements
function appendNumberInCircle(element, index) {
  let circledNumber;
  if (index <= 20) {
    circledNumber = String.fromCodePoint(0x245F + index); // Unicode for circled numbers
  } else if (index <= 35) {
    circledNumber = String.fromCodePoint(0x3250 - 20 + index); // Unicode for numbers between 20 and 50
  } else if (index <= 50) {
    circledNumber = String.fromCodePoint(0x32B1 - 36 + index);
  } else {
    circledNumber = `(${index})`
  }
  element.innerHTML += `<span class="circled-number">${circledNumber}</span>`;
}

function populateList(list, listOfIndexes, deleteInsteadOfSelect, sublistIndex) {
  list.innerHTML = "";
  listOfIndexes.forEach(function (i) {
    var listItem = document.createElement("li");

    listItem.setAttribute("data-id", i);
    listItem.classList.add("list-group-item")
    listItem.textContent = bibleData[i]["book"] + " ";
    if (deleteInsteadOfSelect) {
      // This is a RHS list of books in the plan, so we want to be able to delete them
      var deleteButton = document.createElement('span');
      deleteButton.className = 'delete-btn';
      deleteButton.innerHTML = '❌';
      deleteButton.addEventListener('click', function () {
        var index = Array.from(listItem.parentNode.children).indexOf(listItem);
        plan[sublistIndex].splice(index, 1);
        // Get the parent list item and remove it
        listItem.parentNode.removeChild(listItem);
      });
      listItem.appendChild(deleteButton);
    } else {
      // This is the LHS list of books in the whole Bible, so we want to be able to select them
      listItem.addEventListener('click', function () {
        appendNumberInCircle(listItem, selectedBooks.length + 1);
        selectedBooks.push(i);
      });
    }
    list.appendChild(listItem);
  });
}

let listOfBookIndexes = []
for (let i = 1; i <= 66; i++) {
  listOfBookIndexes.push(i)
}

var statusReport = document.getElementById('statusReport');
var links = document.getElementById('links');
var startDateSelector = document.getElementById('startDateSelector');
var offsetSelector = document.getElementById('offsetSelector');
var numLists = document.getElementById('numLists');
var selectList = document.getElementById('selectList');
var listOfBooks = document.getElementById("listOfBooks");
var planListsDiv = document.getElementById("planListsDiv")

document.addEventListener('DOMContentLoaded', function () {
  numLists.addEventListener('input', function (event) {
    event.preventDefault();
    numLists.value = plan.length;
  });
})


function clearSelection() {
  selectedBooks = [];
  populateList(listOfBooks, listOfBookIndexes, false);
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

function fetchAndRedirect(bibleGatewayUrl) {
  fetch(thirdPartyUrl)
    .then(response => response.text())
    .then(html => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const audioLink = doc.querySelector(".audio-link");

      console.log(audioLink);
    })
}


function pageLogic() {
  function valueUpdate() {
    updateURL();
    updateDayOfPlan();
    reportStatus();
    calculateReadings();
  }
  
  // Event listeners for input changes
  startDateSelector.addEventListener('input', valueUpdate);
  offsetSelector.addEventListener('input', valueUpdate);

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

  const today = getTodaysDateInLocalTimeAsIfUTC()

  // Function to check if an array contains only integers between min and max (inclusive)
  function isArrayValid(arr, min, max) {
    return Array.isArray(arr) && arr.length > 0 && arr.every(num => Number.isInteger(num) && num >= min && num <= max);
  }

  const defaultPlan = [[1]];

  // Function to check if plan is a list of lists, where each sublist is nonempty and contains only a list of
  // integers between 1 and 66 inclusive
  function isPlanDataValid(data) {
    const min = 1;
    const max = 66;
    return Array.isArray(data) && data.length > 0 && data.every(sublist => isArrayValid(sublist, min, max));
  }

  // Function to set initial values from URL parameters
  function setInitialValues() {
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

  function reportStatus() {
    statusReport.innerHTML = 
    `You started the plan on ${startDate} <br />
    The offset is ${offsetValue}<br />
    So you are on day ${dayOfPlan + 1}`
  }

  // Set initial values on page load
  setInitialValues();

  populateList(listOfBooks, listOfBookIndexes, false);

  updatePlanListsDiv();

  var daysSinceStart, dayOfPlan;
  function updateDayOfPlan() {
    daysSinceStart = Math.ceil((new Date(today) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    dayOfPlan = daysSinceStart + offsetValue;  
  }

  updateDayOfPlan();
  reportStatus();
  
  function calculateReadings() {
    const readingsLists = plan.map(listOfInts => listOfInts.flatMap(integer => bibleData[integer]["chapters"]))
    const todaysReadings = readingsLists.map(listOfChapters => listOfChapters[mod(dayOfPlan, listOfChapters.length)]["title"])
    const link = `https://www.biblegateway.com/passage/?search=${todaysReadings.join(',')}&version=NIVUK`
    links.innerHTML = todaysReadings.join(', ') + '<br />' +
    `<a href="${link}">Read</a>`;
    return todaysReadings;
  }

  calculateReadings();
};