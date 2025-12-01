// Hårdkodad data från CSV-filer
let kurser = [
  {
    kurs_id: 1,
    kurskod: "AI180U",
    namn: "Juridisk översiktskurs",
    poang_hp: 15.0,
    avdelning: "AIJ",
  },
  {
    kurs_id: 2,
    kurskod: "AI188U",
    namn: "Marknadsanalys och marknadsföring",
    poang_hp: 7.5,
    avdelning: "AIJ",
  },
  {
    kurs_id: 3,
    kurskod: "AI183U",
    namn: "Husbyggnadsteknik",
    poang_hp: 7.5,
    avdelning: "AIJ",
  },
  {
    kurs_id: 4,
    kurskod: "AI184U",
    namn: "Fastighetsförmedling introduktion",
    poang_hp: 15.0,
    avdelning: "AIJ",
  },
  {
    kurs_id: 5,
    kurskod: "AI190U",
    namn: "Fastighetsvärdering för fastighetsmäklare",
    poang_hp: 7.5,
    avdelning: "AIE",
  },
  {
    kurs_id: 6,
    kurskod: "AI192U",
    namn: "Allmän fastighetsrätt",
    poang_hp: 7.5,
    avdelning: "AIJ",
  },
  {
    kurs_id: 7,
    kurskod: "AI191U",
    namn: "Bostadsrätt för fastighetsmäklare",
    poang_hp: 7.5,
    avdelning: "AIE",
  },
  {
    kurs_id: 8,
    kurskod: "Fastighetsförmedling - kommunikation",
    namn: "Fastighetsförmedling - kommunikation",
    poang_hp: 7.5,
    avdelning: "Okänd",
  },
  {
    kurs_id: 9,
    kurskod: "AI181U",
    namn: "Extern redovisning för fastighetsmäklare",
    poang_hp: 7.5,
    avdelning: "AIJ",
  },
  {
    kurs_id: 10,
    kurskod: "AI185U",
    namn: "Ekonomistyrning för fastighetsmäklare",
    poang_hp: 7.5,
    avdelning: "AIJ",
  },
  {
    kurs_id: 11,
    kurskod: "AI186U",
    namn: "Beskattningsrätt för fastighetsmäklare",
    poang_hp: 7.5,
    avdelning: "AIE",
  },
  {
    kurs_id: 12,
    kurskod: "AI182U",
    namn: "Speciell fastighetsrätt för fastighetsförmedlare",
    poang_hp: 7.5,
    avdelning: "AIE",
  },
  {
    kurs_id: 13,
    kurskod: "AI189U",
    namn: "Kvalificerad fastighetsmäklarjuridik",
    poang_hp: 7.5,
    avdelning: "AIE",
  },
  {
    kurs_id: 14,
    kurskod: "AI187U",
    namn: "Arbetsmarknad och företagande",
    poang_hp: 7.5,
    avdelning: "AIE",
  },
  {
    kurs_id: 15,
    kurskod: "AI107U",
    namn: "Examensarbete",
    poang_hp: 15.0,
    avdelning: "AF",
  },
];

let grupper = [
  { grupp_id: 1, namn: "Start 1", start_ar: 2024 },
  { grupp_id: 2, namn: "Start 2", start_ar: 2025 },
  { grupp_id: 3, namn: "Start 3", start_ar: 2025 },
  { grupp_id: 4, namn: "Start 4", start_ar: 2026 },
];

let personal = [
  { personal_id: 1, fornamn: "Annina", efternamn: "Persson", titel: "Adjunkt" },
  { personal_id: 2, fornamn: "Jonny", efternamn: "Flodin", titel: "Adjunkt" },
  {
    personal_id: 3,
    fornamn: "Ulrika",
    efternamn: "Myslinski",
    titel: "Adjunkt",
  },
  { personal_id: 4, fornamn: "Jenny", efternamn: "Paulsson", titel: "Adjunkt" },
  { personal_id: 5, fornamn: "Anna", efternamn: "Broback", titel: "Adjunkt" },
  {
    personal_id: 6,
    fornamn: "Inga-Lill",
    efternamn: "Söderberg",
    titel: "Lektor",
  },
  {
    personal_id: 7,
    fornamn: "Rickard",
    efternamn: "Engström",
    titel: "Adjunkt",
  },
  { personal_id: 8, fornamn: "Annika", efternamn: "Gram", titel: "Adjunkt" },
  { personal_id: 9, fornamn: "Torun", efternamn: "Widström", titel: "Adjunkt" },
  { personal_id: 10, fornamn: "Henry", efternamn: "Muyingo", titel: "Adjunkt" },
  {
    personal_id: 11,
    fornamn: "Vakant",
    efternamn: "Ny Adjunkt",
    titel: "Okänd",
  },
];

let kurstillfallen = [
  {
    tillfalle_id: 1,
    kurs_id: 1,
    grupp_id: 1,
    personal_id: 1,
    startdatum: "2024-06-10",
    slutdatum: "2024-09-06",
  },
  {
    tillfalle_id: 2,
    kurs_id: 2,
    grupp_id: 1,
    personal_id: 1,
    startdatum: "2024-09-09",
    slutdatum: "2024-10-04",
  },
  {
    tillfalle_id: 3,
    kurs_id: 3,
    grupp_id: 1,
    personal_id: 2,
    startdatum: "2024-10-07",
    slutdatum: "2024-11-01",
  },
  {
    tillfalle_id: 4,
    kurs_id: 4,
    grupp_id: 1,
    personal_id: 4,
    startdatum: "2024-11-04",
    slutdatum: "2025-01-10",
  },
  {
    tillfalle_id: 5,
    kurs_id: 5,
    grupp_id: 1,
    personal_id: 5,
    startdatum: "2025-01-13",
    slutdatum: "2025-02-07",
  },
  {
    tilfalle_id: 6,
    kurs_id: 6,
    grupp_id: 1,
    personal_id: 1,
    startdatum: "2025-02-10",
    slutdatum: "2025-03-07",
  },
  {
    tillfalle_id: 7,
    kurs_id: 7,
    grupp_id: 1,
    personal_id: 5,
    startdatum: "2025-03-10",
    slutdatum: "2025-04-04",
  },
  {
    tillfalle_id: 8,
    kurs_id: 8,
    grupp_id: 1,
    personal_id: 11,
    startdatum: "2025-04-07",
    slutdatum: "2025-05-02",
  },
  {
    tilfalle_id: 9,
    kurs_id: 9,
    grupp_id: 1,
    personal_id: 1,
    startdatum: "2025-05-05",
    slutdatum: "2025-05-30",
  },
  {
    tilfalle_id: 10,
    kurs_id: 10,
    grupp_id: 1,
    personal_id: 2,
    startdatum: "2025-06-02",
    slutdatum: "2025-06-27",
  },
  {
    tilfalle_id: 11,
    kurs_id: 11,
    grupp_id: 1,
    personal_id: 5,
    startdatum: "2025-08-18",
    slutdatum: "2025-09-12",
  },
  {
    tilfalle_id: 12,
    kurs_id: 12,
    grupp_id: 1,
    personal_id: 11,
    startdatum: "2025-08-18",
    slutdatum: "2025-09-12",
  },
  {
    tilfalle_id: 13,
    kurs_id: 13,
    grupp_id: 1,
    personal_id: 11,
    startdatum: "2025-10-13",
    slutdatum: "2025-11-07",
  },
  {
    tilfalle_id: 14,
    kurs_id: 14,
    grupp_id: 1,
    personal_id: 10,
    startdatum: "2025-11-10",
    slutdatum: "2025-12-05",
  },
  {
    tilfalle_id: 15,
    kurs_id: 1,
    grupp_id: 2,
    personal_id: 1,
    startdatum: "2025-02-10",
    slutdatum: "2025-04-04",
  },
  {
    tilfalle_id: 16,
    kurs_id: 2,
    grupp_id: 2,
    personal_id: 1,
    startdatum: "2026-02-16",
    slutdatum: "2026-03-13",
  },
  {
    tilfalle_id: 17,
    kurs_id: 3,
    grupp_id: 2,
    personal_id: 2,
    startdatum: "2025-04-07",
    slutdatum: "",
  },
  {
    tilfalle_id: 18,
    kurs_id: 4,
    grupp_id: 2,
    personal_id: 4,
    startdatum: "2025-05-05",
    slutdatum: "2025-06-27",
  },
  {
    tilfalle_id: 19,
    kurs_id: 5,
    grupp_id: 2,
    personal_id: 5,
    startdatum: "2026-06-08",
    slutdatum: "2026-07-03",
  },
  {
    tilfalle_id: 20,
    kurs_id: 6,
    grupp_id: 2,
    personal_id: 1,
    startdatum: "2025-08-18",
    slutdatum: "2025-09-12",
  },
];

// Ladda från localStorage om finns
if (localStorage.getItem("kurser"))
  kurser = JSON.parse(localStorage.getItem("kurser"));
if (localStorage.getItem("grupper"))
  grupper = JSON.parse(localStorage.getItem("grupper"));
if (localStorage.getItem("personal"))
  personal = JSON.parse(localStorage.getItem("personal"));
if (localStorage.getItem("kurstillfallen"))
  kurstillfallen = JSON.parse(localStorage.getItem("kurstillfallen"));

// Funktioner för att spara till localStorage
function saveData() {
  localStorage.setItem("kurser", JSON.stringify(kurser));
  localStorage.setItem("grupper", JSON.stringify(grupper));
  localStorage.setItem("personal", JSON.stringify(personal));
  localStorage.setItem("kurstillfallen", JSON.stringify(kurstillfallen));
}

// Populera selects
function populateSelects() {
  const kursSelect = document.getElementById("kursSelect");
  const gruppSelect = document.getElementById("gruppSelect");
  const personalSelect = document.getElementById("personalSelect");

  kursSelect.innerHTML = "";
  kurser.forEach((k) => {
    const option = document.createElement("option");
    option.value = k.kurs_id;
    option.textContent = `${k.kurskod} - ${k.namn}`;
    kursSelect.appendChild(option);
  });

  gruppSelect.innerHTML = "";
  grupper.forEach((g) => {
    const option = document.createElement("option");
    option.value = g.grupp_id;
    option.textContent = g.namn;
    gruppSelect.appendChild(option);
  });

  personalSelect.innerHTML = "";
  personal.forEach((p) => {
    const option = document.createElement("option");
    option.value = p.personal_id;
    option.textContent = `${p.fornamn} ${p.efternamn}`;
    personalSelect.appendChild(option);
  });
}

// Populera filter selects
function populateFilters() {
  const filterKurs = document.getElementById("filterKurs");
  const filterGrupp = document.getElementById("filterGrupp");
  const filterPersonal = document.getElementById("filterPersonal");

  kurser.forEach((k) => {
    const option = document.createElement("option");
    option.value = k.kurs_id;
    option.textContent = k.namn;
    filterKurs.appendChild(option);
  });

  grupper.forEach((g) => {
    const option = document.createElement("option");
    option.value = g.grupp_id;
    option.textContent = g.namn;
    filterGrupp.appendChild(option);
  });

  personal.forEach((p) => {
    const option = document.createElement("option");
    option.value = p.personal_id;
    option.textContent = `${p.fornamn} ${p.efternamn}`;
    filterPersonal.appendChild(option);
  });
}

// Visa kurstillfallen i tabellen
function displayKurstillfallen(filtered = kurstillfallen) {
  const tbody = document.querySelector("#courseTable tbody");
  tbody.innerHTML = "";
  filtered.forEach((t) => {
    const kurs = kurser.find((k) => k.kurs_id == t.kurs_id);
    const grupp = grupper.find((g) => g.grupp_id == t.grupp_id);
    const pers = personal.find((p) => p.personal_id == t.personal_id);
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${kurs ? kurs.kurskod : ""}</td>
            <td>${kurs ? kurs.namn : ""}</td>
            <td>${grupp ? grupp.namn : ""}</td>
            <td>${pers ? `${pers.fornamn} ${pers.efternamn}` : ""}</td>
            <td>${t.startdatum}</td>
            <td>${t.slutdatum}</td>
        `;
    tbody.appendChild(row);
  });
}

// Event listeners
document.getElementById("adminBtn").addEventListener("click", () => {
  document.getElementById("adminView").style.display = "block";
  document.getElementById("presentationView").style.display = "none";
  populateSelects();
});

document.getElementById("presentationBtn").addEventListener("click", () => {
  document.getElementById("adminView").style.display = "none";
  document.getElementById("presentationView").style.display = "block";
  populateFilters();
  displayKurstillfallen();
});

// Lägg till nya
document.getElementById("addKursBtn").addEventListener("click", () => {
  document.getElementById("addForms").style.display = "block";
  document.getElementById("addKursForm").style.display = "block";
  document.getElementById("addGruppForm").style.display = "none";
  document.getElementById("addPersonalForm").style.display = "none";
});

document.getElementById("addGruppBtn").addEventListener("click", () => {
  document.getElementById("addForms").style.display = "block";
  document.getElementById("addKursForm").style.display = "none";
  document.getElementById("addGruppForm").style.display = "block";
  document.getElementById("addPersonalForm").style.display = "none";
});

document.getElementById("addPersonalBtn").addEventListener("click", () => {
  document.getElementById("addForms").style.display = "block";
  document.getElementById("addKursForm").style.display = "none";
  document.getElementById("addGruppForm").style.display = "none";
  document.getElementById("addPersonalForm").style.display = "block";
});

// Spara nya
document.getElementById("saveKursBtn").addEventListener("click", () => {
  const kod = document.getElementById("newKursKod").value;
  const namn = document.getElementById("newKursNamn").value;
  const poang = parseFloat(document.getElementById("newKursPoang").value);
  const avd = document.getElementById("newKursAvdelning").value;
  if (kod && namn && poang && avd) {
    const newId = Math.max(...kurser.map((k) => k.kurs_id)) + 1;
    kurser.push({
      kurs_id: newId,
      kurskod: kod,
      namn,
      poang_hp: poang,
      avdelning: avd,
    });
    saveData();
    populateSelects();
    document.getElementById("addForms").style.display = "none";
    // Clear inputs
    document.getElementById("newKursKod").value = "";
    document.getElementById("newKursNamn").value = "";
    document.getElementById("newKursPoang").value = "";
    document.getElementById("newKursAvdelning").value = "";
  }
});

document.getElementById("saveGruppBtn").addEventListener("click", () => {
  const namn = document.getElementById("newGruppNamn").value;
  const ar = parseInt(document.getElementById("newGruppStartAr").value);
  if (namn && ar) {
    const newId = Math.max(...grupper.map((g) => g.grupp_id)) + 1;
    grupper.push({ grupp_id: newId, namn, start_ar: ar });
    saveData();
    populateSelects();
    document.getElementById("addForms").style.display = "none";
    document.getElementById("newGruppNamn").value = "";
    document.getElementById("newGruppStartAr").value = "";
  }
});

document.getElementById("savePersonalBtn").addEventListener("click", () => {
  const fornamn = document.getElementById("newPersonalFornamn").value;
  const efternamn = document.getElementById("newPersonalEfternamn").value;
  const titel = document.getElementById("newPersonalTitel").value;
  if (fornamn && efternamn && titel) {
    const newId = Math.max(...personal.map((p) => p.personal_id)) + 1;
    personal.push({ personal_id: newId, fornamn, efternamn, titel });
    saveData();
    populateSelects();
    document.getElementById("addForms").style.display = "none";
    document.getElementById("newPersonalFornamn").value = "";
    document.getElementById("newPersonalEfternamn").value = "";
    document.getElementById("newPersonalTitel").value = "";
  }
});

// Cancel
document.getElementById("cancelKursBtn").addEventListener("click", () => {
  document.getElementById("addForms").style.display = "none";
});
document.getElementById("cancelGruppBtn").addEventListener("click", () => {
  document.getElementById("addForms").style.display = "none";
});
document.getElementById("cancelPersonalBtn").addEventListener("click", () => {
  document.getElementById("addForms").style.display = "none";
});

// Skapa kursomgång
document.getElementById("courseForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const kursId = document.getElementById("kursSelect").value;
  const gruppId = document.getElementById("gruppSelect").value;
  const personalId = document.getElementById("personalSelect").value;
  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;
  if (kursId && gruppId && personalId && start) {
    const newId = Math.max(...kurstillfallen.map((t) => t.tillfalle_id)) + 1;
    kurstillfallen.push({
      tillfalle_id: newId,
      kurs_id: parseInt(kursId),
      grupp_id: parseInt(gruppId),
      personal_id: parseInt(personalId),
      startdatum: start,
      slutdatum: end,
    });
    saveData();
    alert("Kursomgång skapad!");
    // Clear form
    document.getElementById("courseForm").reset();
  }
});

// Filtrering
document.getElementById("filterKurs").addEventListener("change", filterTable);
document.getElementById("filterGrupp").addEventListener("change", filterTable);
document
  .getElementById("filterPersonal")
  .addEventListener("change", filterTable);

function filterTable() {
  const kursFilter = document.getElementById("filterKurs").value;
  const gruppFilter = document.getElementById("filterGrupp").value;
  const personalFilter = document.getElementById("filterPersonal").value;

  let filtered = kurstillfallen;
  if (kursFilter) filtered = filtered.filter((t) => t.kurs_id == kursFilter);
  if (gruppFilter) filtered = filtered.filter((t) => t.grupp_id == gruppFilter);
  if (personalFilter)
    filtered = filtered.filter((t) => t.personal_id == personalFilter);

  displayKurstillfallen(filtered);
}

// Initiera
populateSelects();
