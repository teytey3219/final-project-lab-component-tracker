const API_URL = "/api/records";

const form = document.getElementById("recordForm");
const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");
const recordsBody = document.getElementById("recordsBody");
const emptyMessage = document.getElementById("emptyMessage");
const filterBorrowed = document.getElementById("filterBorrowed");

let editingId = null; // null = adding, otherwise = the record being edited

// Today's date as YYYY-MM-DD (local time)
function today() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

// Turn a database date into YYYY-MM-DD
function toInputDate(value) {
  return value ? value.slice(0, 10) : "";
}

// Load records from the server, update the summary and the table
async function loadRecords() {
  const allRes = await fetch(API_URL);
  const allRecords = await allRes.json();
  updateSummary(allRecords);

  let records = allRecords;
  if (filterBorrowed.checked) {
    const res = await fetch(API_URL + "?status=borrowed");
    records = await res.json();
  }
  renderTable(records);
}

function updateSummary(records) {
  const returnedCount = records.filter((r) => r.returned).length;
  document.getElementById("totalCount").textContent = records.length;
  document.getElementById("borrowedCount").textContent = records.length - returnedCount;
  document.getElementById("returnedCount").textContent = returnedCount;
}

function addCell(row, text) {
  const td = document.createElement("td");
  td.textContent = text;
  row.appendChild(td);
  return td;
}

function makeButton(label, className, onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = label;
  btn.className = className;
  btn.addEventListener("click", onClick);
  return btn;
}

function renderTable(records) {
  recordsBody.innerHTML = "";
  emptyMessage.classList.toggle("hidden", records.length > 0);

  records.forEach((record) => {
    const row = document.createElement("tr");

    addCell(row, record.componentName);
    addCell(row, record.borrowerName);
    addCell(row, toInputDate(record.dateBorrowed));

    const statusCell = addCell(row, "");
    const badge = document.createElement("span");
    badge.textContent = record.returned ? "Returned" : "Borrowed";
    badge.className = record.returned ? "badge returned" : "badge borrowed";
    statusCell.appendChild(badge);

    addCell(row, toInputDate(record.dateReturned) || "—");

    const actions = addCell(row, "");
    if (!record.returned) {
      actions.appendChild(makeButton("Mark Returned", "link", () => markReturned(record._id)));
    }
    actions.appendChild(makeButton("Edit", "link", () => startEdit(record)));
    actions.appendChild(makeButton("Delete", "link danger", () => deleteRecord(record._id)));

    recordsBody.appendChild(row);
  });
}

// Add or save a record
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const returned = document.getElementById("returned").checked;
  const data = {
    componentName: document.getElementById("componentName").value.trim(),
    borrowerName: document.getElementById("borrowerName").value.trim(),
    dateBorrowed: document.getElementById("dateBorrowed").value,
    returned: returned,
    dateReturned: returned ? document.getElementById("dateReturned").value || today() : null
  };

  const url = editingId ? `${API_URL}/${editingId}` : API_URL;
  const method = editingId ? "PUT" : "POST";

  const res = await fetch(url, {
    method: method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    const err = await res.json();
    alert("Could not save: " + err.error);
    return;
  }

  resetForm();
  loadRecords();
});

async function markReturned(id) {
  await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ returned: true, dateReturned: today() })
  });
  loadRecords();
}

async function deleteRecord(id) {
  if (!confirm("Delete this record?")) return;
  await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  loadRecords();
}

// Fill the form with a record so it can be edited
function startEdit(record) {
  editingId = record._id;
  document.getElementById("componentName").value = record.componentName;
  document.getElementById("borrowerName").value = record.borrowerName;
  document.getElementById("dateBorrowed").value = toInputDate(record.dateBorrowed);
  document.getElementById("returned").checked = record.returned;
  document.getElementById("dateReturned").value = toInputDate(record.dateReturned);

  formTitle.textContent = "Edit Borrow Record";
  submitBtn.textContent = "Save Changes";
  cancelBtn.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetForm() {
  form.reset();
  editingId = null;
  formTitle.textContent = "Add Borrow Record";
  submitBtn.textContent = "Add Record";
  cancelBtn.classList.add("hidden");
  document.getElementById("dateBorrowed").value = today();
}

cancelBtn.addEventListener("click", resetForm);
filterBorrowed.addEventListener("change", loadRecords);

// Start
resetForm();
loadRecords();