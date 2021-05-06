let transactions = [];
let myChart;

fetch("/api/transaction")
  .then((response) => {
    return response.json();
  })
  .then((data) => {
    // Save data globally
    transactions = data;

    populateTotal();
    populateTable();
    populateChart();
  });

function populateTotal() {
  // Single total
  let total = transactions.reduce((total, t) => {
    return total + parseInt(t.value);
  }, 0);

  let totalEl = document.querySelector("#total");
  totalEl.textContent = total;
}

function populateTable() {
  let tbody = document.querySelector("#tbody");
  tbody.innerHTML = "";

  transactions.forEach((transaction) => {
    // Create and populate a row in the table
    let tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${transaction.name}</td>
      <td>${transaction.value}</td>
    `;

    tbody.appendChild(tr);
  });
}

function populateChart() {
  // Copy and reverse the array
  let reversed = transactions.slice().reverse();
  let sum = 0;

  // Create labels
  let labels = reversed.map((t) => {
    let date = new Date(t.date);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  });

  // Increment values
  let data = reversed.map((t) => {
    sum += parseInt(t.value);
    return sum;
  });

  // If necessary remove old values
  if (myChart) {
    myChart.destroy();
  }

  let ctx = document.getElementById("myChart").getContext("2d");

  myChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Total Over Time",
          fill: true,
          backgroundColor: "#6666ff",
          data,
        },
      ],
    },
  });
}

function sendTransaction(isAdding) {
  let nameEl = document.querySelector("#t-name");
  let amountEl = document.querySelector("#t-amount");
  let errorEl = document.querySelector(".form .error");

  // Validate form
  if (nameEl.value === "" || amountEl.value === "") {
    errorEl.textContent = "Missing Information";
    return;
  } else {
    errorEl.textContent = "";
  }

  // Create a record
  let transaction = {
    name: nameEl.value,
    value: amountEl.value,
    date: new Date().toISOString(),
  };

  // When subtracting funds convert to a negative number
  if (!isAdding) {
    transaction.value *= -1;
  }

  // Add to beginning of array
  transactions.unshift(transaction);

  // Populate browser with new record
  populateChart();
  populateTable();
  populateTotal();

  // Send to server
  fetch("/api/transaction", {
    method: "POST",
    body: JSON.stringify(transaction),
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      if (data.errors) {
        errorEl.textContent = "Missing Information";
      } else {
        // clear form
        nameEl.value = "";
        amountEl.value = "";
      }
    })
    .catch((error) => {
      // Save in db
      storetransaction(transaction);

      // clear form
      nameEl.value = "";
      amountEl.value = "";
    });
}

document.querySelector("#add-btn").onclick = function () {
  sendTransaction(true);
};

document.querySelector("#sub-btn").onclick = function () {
  sendTransaction(false);
};
