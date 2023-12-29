// Specify the path to the JSON file
const filePaths = [
  '/data/bibledata.json',
  '/data/bibletranslations.json',
  '/data/presets.json'
]

let bibleData = {}
var listOfBooksSortable;
var listOfSortableLists;
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

const fetchJSON = (filePath) => {
  return fetch(filePath)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to fetch ${filePath}: ${response.status} ${response.statusText}`)
      }
      return response.json();
    });
};

Promise.all(filePaths.map(filePath => fetchJSON(filePath)))
  .then(jsonFiles => {
    jsonFiles[0].forEach(function(record) {
      addDataToBook(bibleData, record.book_index, record)
  })
  bibleTranslations = jsonFiles[1];
  presets = jsonFiles[2];
  pageLogic();
})
