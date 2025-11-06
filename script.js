let seconds = 0, timerActive = false, timerInterval;
const timerDisplay = document.getElementById('timer');
const calendarDiv = document.getElementById('calendar');
let data = JSON.parse(localStorage.getItem('teaData')) || [];

const monthSelect = document.getElementById('month');
const yearSelect = document.createElement('select');
yearSelect.id = 'year';
document.querySelector('.month-selector').prepend(yearSelect);

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

monthNames.forEach((name, index) => {
  const option = document.createElement('option');
  option.value = index;
  option.textContent = name;
  monthSelect.appendChild(option);
});

const today = new Date();
for (let y = today.getFullYear() - 5; y <= today.getFullYear() + 5; y++) {
  const option = document.createElement('option');
  option.value = y;
  option.textContent = y;
  yearSelect.appendChild(option);
}

monthSelect.value = today.getMonth();
yearSelect.value = today.getFullYear();

monthSelect.onchange = updateCalendar;
yearSelect.onchange = updateCalendar;

setInterval(() => {
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0 && now.getSeconds() === 0) {
    seconds = 0;
    updateCalendar();
    updateTeaDisplay();
    updateChart();
  }
}, 1000);

function saveData() { localStorage.setItem('teaData', JSON.stringify(data)); }
function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

document.getElementById('startTimer').onclick = () => {
  if (!timerActive) {
    timerActive = true;
    timerInterval = setInterval(() => {
      seconds++;
      const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
      const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
      const s = String(seconds % 60).padStart(2, '0');
      timerDisplay.textContent = `${h}:${m}:${s}`;
    }, 1000);
  }
};

document.getElementById('pauseTimer')?.remove();
document.getElementById('resetTimer')?.remove();

document.getElementById('logTime').textContent = "Stop";
document.getElementById('logTime').onclick = () => {
  if (timerActive) clearInterval(timerInterval);
  timerActive = false;

  const date = getToday();
  const hoursToAdd = Math.min(seconds / 3600, 24);
  let entry = data.find(d => d.date === date);
  if (!entry) { entry = { date, hours: 0, tea: 0 }; data.push(entry); }
  if (entry.hours + hoursToAdd > 24) { alert("Max 24h/day"); return; }
  entry.hours += hoursToAdd;

  saveData();
  seconds = 0;
  timerDisplay.textContent = '00:00:00';
  updateChart();
  updateCalendar();
  updateTeaDisplay();
};

const teaCount = document.getElementById('tea-count');
document.getElementById('plusTea').onclick = () => adjustTea(1);
document.getElementById('minusTea').onclick = () => adjustTea(-1);
function adjustTea(delta) {
  const date = getToday();
  let entry = data.find(d => d.date === date);
  if (!entry) { entry = { date, hours: 0, tea: 0 }; data.push(entry); }
  entry.tea = Math.max(0, entry.tea + delta);
  saveData(); updateTeaDisplay(); updateChart(); updateCalendar();
}
function updateTeaDisplay() {
  const entry = data.find(d => d.date === getToday());
  teaCount.textContent = `${entry ? entry.tea : 0} cups today`;
}

const ctx = document.getElementById('trendChart');
const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: data.map(d => d.date),
    datasets: [
      { label: 'Coding hours', data: data.map(d => d.hours), borderColor: '#fff', backgroundColor: '#fff', fill: false, tension: 0.2 },
      { label: 'Cups of tea', data: data.map(d => d.tea), borderColor: '#ffc0cb', backgroundColor: '#ffc0cb', fill: false, tension: 0.2 }
    ]
  },
  options: {
    scales: { 
      y: { beginAtZero: true, ticks: { color: '#fff' } }, 
      x: { ticks: { color: '#fff' } } 
    },
    plugins: { legend: { labels: { color: '#fff' } } }
  }
});
function updateChart() {
  chart.data.labels = data.map(d => d.date);
  chart.data.datasets[0].data = data.map(d => d.hours);
  chart.data.datasets[1].data = data.map(d => d.tea);
  chart.update();
}

function updateCalendar() {
  calendarDiv.innerHTML = '';
  const selectedYear = parseInt(yearSelect.value);
  const selectedMonth = parseInt(monthSelect.value);
  const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
  const lastDate = new Date(selectedYear, selectedMonth + 1, 0).getDate();

  const todayDate = new Date();
  const todayStr = getToday();

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'day';
    calendarDiv.appendChild(empty);
  }

  for (let day = 1; day <= lastDate; day++) {
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const dayDiv = document.createElement('div');
    dayDiv.className = 'day';

    if (dateStr === todayStr) dayDiv.classList.add('today');

    const dayLabel = document.createElement('span');
    dayLabel.textContent = day;
    dayDiv.appendChild(dayLabel);

    const entry = data.find(d => d.date === dateStr);
    const totalHours = entry ? entry.hours : 0;
    const totalTea = entry ? entry.tea : 0;

    const info = document.createElement('div');
    info.innerHTML = `💻 ${formatHours(totalHours)}<br>🍵 ${totalTea}`;
    info.title = `${formatHours(totalHours)} hours coded\n${totalTea} cups of tea`;
    dayDiv.appendChild(info);

    const thisDate = new Date(selectedYear, selectedMonth, day);
    if (thisDate > todayDate) {
      dayDiv.style.opacity = '0.5';
    } else {
      dayDiv.style.cursor = 'pointer';
      dayDiv.onclick = () => editDay(dateStr, entry);
    }

    calendarDiv.appendChild(dayDiv);
  }

  const cells = document.querySelectorAll('.day');
  cells.forEach((c, i) => setTimeout(() => c.style.opacity = '1', i * 50));
  document.querySelector('.weekdays').style.opacity = '1';
}

function editDay(dateStr, entry) {
  let validHours = false;
  let h;
  while (!validHours) {
    const input = prompt(
      "Enter coding time:",
      entry ? formatHours(entry.hours) : "0:00"
    );
    if (input === null) return;

    const match = input.match(/^(\d{1,2}):([0-5]\d)$/);
    if (!match) {
      alert("Invalid format. Use (H:MM).");
      continue;
    }
    const hoursPart = parseInt(match[1]);
    const minutesPart = parseInt(match[2]);
    if (hoursPart > 24 || (hoursPart === 24 && minutesPart > 0)) {
      alert("Total time cannot exceed 24 hours.");
      continue;
    }

    h = hoursPart + minutesPart / 60;
    validHours = true;
  }

  let validTea = false;
  let t;
  while (!validTea) {
    const tea = prompt("Enter cups of tea:", entry ? entry.tea : 0);
    if (tea === null) return;
    t = parseInt(tea);
    if (isNaN(t) || t < 0) {
      alert("Tea cups must be 0 or more");
    } else {
      validTea = true;
    }
  }

  let dayEntry = data.find(d => d.date === dateStr);
  if (!dayEntry) { dayEntry = { date: dateStr, hours: 0, tea: 0 }; data.push(dayEntry); }
  dayEntry.hours = h;
  dayEntry.tea = t;
  saveData();
  updateTeaDisplay();
  updateChart();
  updateCalendar();
}

function formatHours(decimalHours) {
  const h = Math.floor(decimalHours);
  const m = Math.round((decimalHours - h) * 60);
  return `${h}:${String(m).padStart(2,'0')}`;
}

const resetBtn = document.createElement('button');
resetBtn.textContent = "Reset all data";
resetBtn.style.marginTop = "1rem";
resetBtn.style.backgroundColor = "#ffc0cb";
resetBtn.style.color = "#2e2e2e";
resetBtn.style.border = "none";
resetBtn.style.borderRadius = "6px";
resetBtn.style.padding = "0.5rem 0.8rem";
resetBtn.style.cursor = "pointer";
resetBtn.onclick = () => {
  if(confirm("Are you sure you want to wipe all data? This cannot be undone.")) {
    data = [];
    saveData();
    seconds = 0;
    timerDisplay.textContent = '00:00:00';
    updateTeaDisplay();
    updateChart();
    updateCalendar();
  }
};
document.querySelector('.container').appendChild(resetBtn);

updateTeaDisplay();
updateChart();
updateCalendar();