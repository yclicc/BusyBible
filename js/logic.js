// Function to update URL parameters
function updateURL() {
  const startDate = document.getElementById('dateSelector').value;
  const offsetValue = document.getElementById('offsetSelector').value;

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
  var planListsDiv = document.getElementById("planListsDiv")
  // Get rid of everything currently in the div
  planListsDiv.innerHTML = "";
  plan.forEach(function (sublist, index) {
    var sublistUl = document.createElement("ul");
    populateList(sublistUl, sublist, true, index)
    planListsDiv.append(sublistUl);
    var sortableForSublist = new Sortable(sublistUl, {
      group: 'shared',
      animation: 150,
      onEnd: updatePlanListsDiv,
      store: {
        // get: function (sortable) {
        //   var temp = plan[index].map(String)
        //   console.log(temp);
        //   return temp;
        // },
        set: function (sortable) {
          var order = sortable.toArray().map(Number);
          plan[index] = order;
        }
      }
    });
    listOfSortableLists.push(sortableForSublist);
    updateURL();
  });
}

function populateList(list, listOfIndexes, canDelete, sublistIndex) {
  listOfIndexes.forEach(function (i) {
    var listItem = document.createElement("li");

    listItem.setAttribute("data-id", i);
    listItem.textContent = bibleData[i]["book"] + " ";
    if (canDelete) {
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
    }
    list.appendChild(listItem);
  });
}


function increment() {
  plan.push([]);
  updatePlanListsDiv();
  document.getElementById("numLists").value = plan.length;
}

function decrement() {
  if (plan.length > 1) {
    plan.pop();
  }
  updatePlanListsDiv();
  document.getElementById("numLists").value = plan.length;
}

function pageLogic() {
  // Event listeners for input changes
  document.getElementById('dateSelector').addEventListener('input', updateURL);
  document.getElementById('offsetSelector').addEventListener('input', updateURL);

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
    const startDate = urlParams.get('start');
    const offsetValue = urlParams.get('offset');
    const encodedPlan = urlParams.get("plan");

    // Set default values if not provided in the URL
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!startDate || !dateRegex.test(startDate)) {
      document.getElementById('dateSelector').value = today;
    } else {
      document.getElementById('dateSelector').value = startDate;
    }

    const offsetInt = parseInt(offsetValue);
    if (!offsetValue || isNaN(offsetInt)) {
      document.getElementById('offsetSelector').value = 0;
    } else {
      document.getElementById('offsetSelector').value = offsetValue;
    }

    if (!encodedPlan) {
      plan = defaultPlan;
    } else {
      const decodedPlan = atob(encodedPlan);
      plan = JSON.parse(decodedPlan);
      if (!isPlanDataValid(plan)) {
        plan = defaultPlan;
      }
    }

    // Update URL with default values
    updateURL();
  }

  // Set initial values on page load
  setInitialValues();

  let listOfBookIndexes = []
  for (let i = 1; i <= 66; i++) {
    listOfBookIndexes.push(i)
  }

  var listOfBooks = document.getElementById("listOfBooks");
  populateList(listOfBooks, listOfBookIndexes, false, 0);

  listOfBooksSortable = new Sortable(listOfBooks, {
    group: {
      name: 'shared',
      pull: 'clone',
      put: false
    },
    animation: 150,
    sort: false,
    onEnd: updatePlanListsDiv
  });

  updatePlanListsDiv();


};