// Specify the path to the JSON file
const filePath = '/data/bibledata.json';

let bibleData = {}
var listOfBooksSortable;
var listOfSortableLists;
var plan;
var selectedBooks = [];

function addDataToBook(obj, key, value) {
    // Check if the key already exists in the object
    if (obj.hasOwnProperty(key)) {
      // Key exists, append the value to the existing array
      obj[key]["chapters"].push(value);
      obj[key]["num_chapters"] += 1
    } else {
      // Key doesn't exist, create a new array with the value
      obj[key] = {}
      obj[key]["chapters"] = [value];
      obj[key]["num_chapters"] = 1
      obj[key]["book"] = value.book
    }
  }
  
// Fetch the JSON file
fetch(filePath)
    .then(response => {
        if (!response.ok) {
            throw new Error(`Failed to fetch ${filePath}: ${response.status} ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        // Do something with the loaded JSON data
        data.forEach(function(record) {
            addDataToBook(bibleData, record.book_index, record)
        })
        pageLogic();
    })
    .catch(error => {
        console.error(`Error loading ${filePath}:`, error);
    });
