import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
  import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

  const firebaseConfig = {
  apiKey: "AIzaSyA_3vceMVF-XsHl95_GH2at4D0HBsAErTQ",
  authDomain: "epickavoda.firebaseapp.com",
  projectId: "epickavoda",
  storageBucket: "epickavoda.firebasestorage.app",
  messagingSenderId: "956814995041",
  appId: "1:956814995041:web:bbbb140718da4dfbef8420",
  measurementId: "G-EN6MSW2PZJ",
  databaseURL: "https://epickavoda-default-rtdb.europe-west1.firebasedatabase.app"
};

  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);

  const endDate = new Date("2025-08-31"); // Konec srpna 2025
  const weeksDiv = document.getElementById("weeks");
  const summaryDiv = document.getElementById("summary");

  const weekLabels = [];

  function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  function generateWeeks() {
    let current = new Date(); // Začneme od dnešního data (20. 6. 2025)
    current.setHours(0, 0, 0, 0);
    
    // Najdeme předchozí pondělí (od 16. 6. 2025)
    while (current.getDay() !== 1) { // 1 = Pondělí
      current.setDate(current.getDate() - 1);
    }

    weeksDiv.innerHTML = ""; // Vymaže předchozí obsah
    while (current <= endDate) {
      const week = getWeekNumber(current);
      const label = `Týden ${week} (${current.toLocaleDateString("cs-CZ")})`;
      weekLabels.push(label);

      const div = document.createElement("div");
      div.className = "week-row";
      div.innerHTML = `<label><input type="checkbox" id="week-${week}"> ${label}</label>`;
      weeksDiv.appendChild(div);

      current.setDate(current.getDate() + 7); // Přesun na další pondělí
    }
    console.log("Vygenerované týdny:", weekLabels); // Ladění
  }

  function getWeekNumberFromLabel(label) {
    const match = label.match(/Týden (\d+)/);
    if (!match) {
      console.error("Chyba při parsování čísla týdne z:", label);
      return null;
    }
    return match[1];
  }

  async function saveData() {
    const name = document.getElementById("username").value.trim();
    console.log("Zadané jméno:", name); // Ladění
    if (!name) {
      alert("Zadej své jméno");
      return;
    }

    const data = {};
    weekLabels.forEach(label => {
      const weekNo = getWeekNumberFromLabel(label);
      if (weekNo) {
        const checkbox = document.getElementById(`week-${weekNo}`);
        if (checkbox) {
          data[`week-${weekNo}`] = checkbox.checked;
        } else {
          console.warn(`Checkbox week-${weekNo} nenalezen`);
        }
      }
    });

    try {
      await set(ref(db, 'users/' + name), data);
      alert("Uloženo!");
    } catch (error) {
      console.error("Chyba při ukládání:", error);
      alert("Chyba při ukládání: " + error.message);
    }
  }

  async function showSummary() {
    try {
      const snapshot = await get(child(ref(db), 'users'));
      const users = snapshot.exists() ? snapshot.val() : {};
      if (!users) {
        summaryDiv.innerHTML = "<p>Žádná data k zobrazení.</p>";
        return;
      }

      const weekAvailability = {};
      for (let label of weekLabels) {
        const weekNo = getWeekNumberFromLabel(label);
        if (weekNo) {
          weekAvailability[weekNo] = { total: 0, available: 0 };
        }
      }

      for (let user in users) {
        const weeks = users[user];
        for (let key in weeks) {
          const weekNo = key.split("-")[1];
          if (weekAvailability[weekNo]) {
            weekAvailability[weekNo].total++;
            if (weeks[key]) weekAvailability[weekNo].available++;
          }
        }
      }

      summaryDiv.innerHTML = "";
      for (let label of weekLabels) {
        const weekNo = getWeekNumberFromLabel(label);
        if (weekNo) {
          const info = weekAvailability[weekNo] || { total: 0, available: 0 };
          const color = info.total > 0 && info.total === info.available ? "green" : "red";
          const div = document.createElement("div");
          div.className = `week-row ${color}`;
          div.textContent = `${label} – ${info.available}/${info.total} má volno`;
          summaryDiv.appendChild(div);
        }
      }
    } catch (error) {
      console.error("Chyba při načítání souhrnu:", error);
      alert("Chyba při načítání souhrnu: " + error.message);
    }
  }

  document.getElementById("saveBtn").addEventListener("click", () => {
    console.log("Kliknuto na Uložit");
    saveData();
  });
  document.getElementById("summaryBtn").addEventListener("click", () => {
    console.log("Kliknuto na Souhrn");
    showSummary();
  });

  generateWeeks();