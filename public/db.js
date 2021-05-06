let db;
// create request
const request = indexedDB.open("trackBudget", 1);

request.onupgradeneeded = (event) => {
  db = event.target.result;
  db.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = (event) => {
  db = event.target.result;
  // checks if the app is online
  if (navigator.onLine) {
    readDB();
  }
};

request.onerror = (event) => {
  console.log("error" + event.target.error);
};

function storetransaction(activity) {
  // Saves a transaction
  const transaction = db.transaction(["pending"], "readwrite");
  const store = transaction.objectStore("pending");
  store.add(activity);
}

function readDB() {
  // Access transactions
  const transaction = db.transaction(["pending"], "readwrite");
  const save = transaction.objectStore("pending");
  const pendingActivity = save.getAll();

  pendingActivity.onsuccess = function () {
    //   Pending transactions post
    if (pendingActivity.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(pendingActivity.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then(() => {
          // Post transactions and clear them
          const transaction = db.transaction(["pending"], "readwrite");
          const record = transaction.objectStore("pending");
          record.clear();
        });
    }
  };
}
