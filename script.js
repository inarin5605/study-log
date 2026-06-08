const dateInput = document.getElementById("date");
const subjectInput = document.getElementById("subject");
const manualStartTimeInput = document.getElementById("manualStartTime");
const manualEndTimeInput = document.getElementById("manualEndTime");
const subjectSuggestions = document.getElementById("subjectSuggestions");
const addButton = document.getElementById("addButton");

const recordList = document.getElementById("recordList");
const recordListTitle = document.getElementById("recordListTitle");
const totalTime = document.getElementById("totalTime");

const periodTitle = document.getElementById("periodTitle");
const periodTime = document.getElementById("periodTime");
const dailyGoalSection = document.getElementById("dailyGoalSection");
const editGoalButton = document.getElementById("editGoalButton");
const goalForm = document.getElementById("goalForm");
const dailyGoalInput = document.getElementById("dailyGoalInput");
const saveGoalButton = document.getElementById("saveGoalButton");
const goalProgressText = document.getElementById("goalProgressText");
const goalRemainingText = document.getElementById("goalRemainingText");
const goalBarFill = document.getElementById("goalBarFill");
const periodButtons = document.querySelectorAll(".period-button");
const periodBreakdownList = document.getElementById("periodBreakdownList");
const subjectSummaryList = document.getElementById("subjectSummaryList");
const prevPeriodButton = document.getElementById("prevPeriodButton");
const nextPeriodButton = document.getElementById("nextPeriodButton");
const currentPeriodLabel = document.getElementById("currentPeriodLabel");

const timerMinutesInput = document.getElementById("timerMinutes");
const showTimerMinutesButton = document.getElementById("showTimerMinutesButton");
const startTimerButton = document.getElementById("startTimerButton");
const pauseTimerButton = document.getElementById("pauseTimerButton");
const stopTimerButton = document.getElementById("stopTimerButton");
const timerDisplay = document.getElementById("timerDisplay");
const timerStatus = document.getElementById("timerStatus");
const timerSubjectInput = document.getElementById("timerSubject");
const subjectPresetList = document.getElementById("subjectPresetList");
const addSubjectButton = document.getElementById("addSubjectButton");
const presetButtons = document.querySelectorAll(".preset-button");

const timerTabButton = document.getElementById("timerTabButton");
const recordTabButton = document.getElementById("recordTabButton");
const settingsTabButton = document.getElementById("settingsTabButton");

const timerTab = document.getElementById("timerTab");
const recordTab = document.getElementById("recordTab");
const settingsTab = document.getElementById("settingsTab");

const showManualFormButton = document.getElementById("showManualFormButton");
const manualForm = document.getElementById("manualForm");

const themeToggleButton = document.getElementById("themeToggleButton");

const backupButton = document.getElementById("backupButton");
const restoreButton = document.getElementById("restoreButton");
const exportCsvButton = document.getElementById("exportCsvButton");
const clearDataButton = document.getElementById("clearDataButton");
const restoreFileInput = document.getElementById("restoreFileInput");

let currentPeriod = "day";
let selectedDate = new Date();

let timerId = null;
let remainingSeconds = 0;
let originalMinutes = 0;
let originalSeconds = 0;
let overtimeSeconds = 0;
let isPaused = false;
let isOvertime = false;
let timerStartDate = null;
let fixedSubjects = [];
let dailyGoalMinutes = Number(localStorage.getItem("dailyGoalMinutes")) || 0;
let editingRecordIndex = null;

let records = [];

// 保存済みデータを読み込む
const savedRecords = localStorage.getItem("studyRecords");

if (savedRecords) {
  records = JSON.parse(savedRecords);
}

displayRecords();

const savedFixedSubjects = localStorage.getItem("fixedSubjects");

if (savedFixedSubjects) {
  fixedSubjects = JSON.parse(savedFixedSubjects);
}

displaySubjectPresets();

updateSubjectSuggestions();

// 手動追加・編集保存
addButton.addEventListener("click", () => {
  const date = dateInput.value;
  const subject = subjectInput.value;
  const startTime = manualStartTimeInput.value;
  const endTime = manualEndTimeInput.value;

  if (!date || !subject || !startTime || !endTime) {
    alert("日付・科目・開始時刻・終了時刻を入力してください");
    return;
  }

  const time = calculateMinutesFromTimeRange(startTime, endTime);

  if (time <= 0) {
    alert("終了時刻は開始時刻より後にしてください");
    return;
  }

  const record = {
    date: date,
    subject: subject,
    time: time,
    memo: "",
    startTime: startTime,
    endTime: endTime
  };

  if (editingRecordIndex !== null) {
    records[editingRecordIndex] = record;
  } else {
    records.push(record);
  }

  saveRecords();
  displayRecords();
  updateSubjectSuggestions();
  resetManualForm();
});

// 記録一覧を表示
function displayRecords() {
  displaySelectedDayRecords();

  let totalMinutes = 0;

  records.forEach((record) => {
    totalMinutes += record.time;
  });

  totalTime.textContent = `全体の合計：${formatMinutes(totalMinutes)}`;

  updatePeriodStats();
}

// 選択中の日付の記録だけ表示
function displaySelectedDayRecords() {
  recordList.innerHTML = "";

  const selectedDateString = formatDateString(selectedDate);
  recordListTitle.textContent = `${formatDisplayDate(selectedDate)} の記録`;

  const selectedRecords = records.filter((record) => {
    return record.date === selectedDateString;
  });

  if (selectedRecords.length === 0) {
    const li = document.createElement("li");
    li.className = "empty-record";
    li.textContent = "この日の記録はありません";
    recordList.appendChild(li);
    return;
  }

  selectedRecords
    .slice()
    .reverse()
    .forEach((record) => {
      const originalIndex = records.indexOf(record);

      const li = document.createElement("li");
      li.className = "simple-record-card";

      const recordInfo = document.createElement("div");
      recordInfo.className = "record-info";

      const recordTop = document.createElement("div");
      recordTop.className = "record-top";

      const subjectText = document.createElement("strong");
      subjectText.textContent = record.subject;

      const timeText = document.createElement("span");
      timeText.className = "record-time";
      timeText.textContent = formatMinutes(record.time);

      recordTop.appendChild(subjectText);
      recordTop.appendChild(timeText);

      recordInfo.appendChild(recordTop);
      
      if (record.startTime && record.endTime) {
       const timeRangeText = document.createElement("div");
       timeRangeText.className = "record-time-range";
       timeRangeText.textContent = `${record.startTime}〜${record.endTime}`;
       recordInfo.appendChild(timeRangeText);
      }

      const actions = document.createElement("div");
actions.className = "record-actions";

const editButton = document.createElement("button");
editButton.textContent = "編集";
editButton.className = "edit-record-button";

editButton.addEventListener("click", () => {
  editingRecordIndex = originalIndex;

  dateInput.value = record.date;
  subjectInput.value = record.subject;
  manualStartTimeInput.value = record.startTime || "";
  manualEndTimeInput.value = record.endTime || "";

  manualForm.classList.remove("hidden");
  showManualFormButton.textContent = "×";
  showManualFormButton.classList.add("open");
  addButton.textContent = "保存";

  recordTab.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
});

const deleteButton = document.createElement("button");
deleteButton.textContent = "削除";
deleteButton.className = "delete-record-button";

deleteButton.addEventListener("click", () => {
  const shouldDelete = confirm("この記録を削除しますか？");

  if (!shouldDelete) {
    return;
  }

  records.splice(originalIndex, 1);
  saveRecords();
  displayRecords();
});

actions.appendChild(editButton);
actions.appendChild(deleteButton);

li.appendChild(recordInfo);
li.appendChild(actions);
recordList.appendChild(li);
    });
}

function saveRecords() {
  localStorage.setItem("studyRecords", JSON.stringify(records));
}

function resetManualForm() {
  editingRecordIndex = null;

  dateInput.value = "";
  subjectInput.value = "";
  manualStartTimeInput.value = "";
  manualEndTimeInput.value = "";

  addButton.textContent = "追加";
  showManualFormButton.textContent = "＋";
  showManualFormButton.classList.remove("open");
  manualForm.classList.add("hidden");
}

function saveFixedSubjects() {
  localStorage.setItem("fixedSubjects", JSON.stringify(fixedSubjects));
}

function displaySubjectPresets() {
  subjectPresetList.innerHTML = "";

  if (fixedSubjects.length === 0) {
    const emptyText = document.createElement("p");
    emptyText.className = "subject-preset-empty";
    emptyText.textContent = "よく使う科目を追加できます";
    subjectPresetList.appendChild(emptyText);
    return;
  }

  fixedSubjects.forEach((subject, index) => {
    const subjectButton = document.createElement("button");
    subjectButton.className = "subject-preset-button";
    subjectButton.textContent = subject;

    subjectButton.addEventListener("click", () => {
      timerSubjectInput.value = subject;
      subjectInput.value = subject;
    });

    subjectButton.addEventListener("contextmenu", (event) => {
      event.preventDefault();

      const shouldDelete = confirm(`${subject} を固定リストから削除しますか？`);

      if (shouldDelete) {
        fixedSubjects.splice(index, 1);
        saveFixedSubjects();
        displaySubjectPresets();
      }
    });

    subjectPresetList.appendChild(subjectButton);
  });
}

function updateSubjectSuggestions() {
  subjectSuggestions.innerHTML = "";

  const subjects = records.map((record) => record.subject);
  const uniqueSubjects = [...new Set(subjects)];

  uniqueSubjects.forEach((subject) => {
    const option = document.createElement("option");
    option.value = subject;
    subjectSuggestions.appendChild(option);
  });
}

// タイマー開始
startTimerButton.addEventListener("click", () => {
  const minutes = Number(timerMinutesInput.value);

  if (timerId !== null) {
    alert("タイマーはすでに動いています");
    return;
  }

  if (isPaused && remainingSeconds > 0 && !isOvertime) {
    startCountdown();
    isPaused = false;
    pauseTimerButton.textContent = "一時停止";

    timerStatus.textContent = "FOCUS";
    timerStatus.className = "timer-status running";
    return;
  }

  if (isPaused && isOvertime) {
    startOvertimeCount();
    isPaused = false;
    pauseTimerButton.textContent = "一時停止";

    timerStatus.textContent = "EXTRA";
    timerStatus.className = "timer-status running";
    return;
  }

  if (minutes <= 0) {
    alert("タイマー時間を入力してください");
    return;
  }

  originalMinutes = minutes;
  originalSeconds = minutes * 60;
  remainingSeconds = minutes * 60;
  overtimeSeconds = 0;
  isPaused = false;
  isOvertime = false;
  timerStartDate = new Date();

  updateTimerDisplay();

  timerStatus.textContent = "FOCUS";
  timerStatus.className = "timer-status running";

  startCountdown();
});

// カウントダウン開始
function startCountdown() {
  timerId = setInterval(() => {
    remainingSeconds--;

    updateTimerDisplay();

    if (remainingSeconds <= 0) {
      clearInterval(timerId);
      timerId = null;

      // ここではまだ記録しない
      // バイブして、そのまま延長計測に入る
      vibrateOnFinish();

      remainingSeconds = 0;
      overtimeSeconds = 0;
      isOvertime = true;
      isPaused = false;

      timerStatus.textContent = "EXTRA";
      timerStatus.className = "timer-status done";

      stopTimerButton.textContent = "記録";
      updateTimerDisplay();

      startOvertimeCount();
    }
  }, 1000);
}

// 延長時間を計測
function startOvertimeCount() {
  timerId = setInterval(() => {
    overtimeSeconds++;
    updateTimerDisplay();
  }, 1000);
}

// 一時停止・再開
pauseTimerButton.addEventListener("click", () => {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
    isPaused = true;
    pauseTimerButton.textContent = "再開";

    timerStatus.textContent = "PAUSED";
    timerStatus.className = "timer-status paused";

    return;
  }

  if (isPaused && remainingSeconds > 0 && !isOvertime) {
    startCountdown();
    isPaused = false;
    pauseTimerButton.textContent = "一時停止";

    timerStatus.textContent = "FOCUS";
    timerStatus.className = "timer-status running";
    return;
  }

  if (isPaused && isOvertime) {
    startOvertimeCount();
    isPaused = false;
    pauseTimerButton.textContent = "一時停止";

    timerStatus.textContent = "EXTRA";
    timerStatus.className = "timer-status done";
  }
});

// 中断・記録
stopTimerButton.addEventListener("click", () => {
  if (timerId === null && !isPaused && !isOvertime) {
    return;
  }

  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }

  // タイマー終了後の延長中なら、タイマー時間 + 延長時間で記録
  if (isOvertime) {
    const totalSeconds = originalSeconds + overtimeSeconds;
    const totalMinutes = Math.ceil(totalSeconds / 60);

    addTimerRecord(totalMinutes, "タイマーで記録");
    resetTimerState();
    return;
  }

  // タイマー途中で中断した場合
  const elapsedSeconds = originalSeconds - remainingSeconds;
  const elapsedMinutes = Math.ceil(elapsedSeconds / 60);

  if (elapsedMinutes > 0) {
    const shouldRecord = confirm(`${elapsedMinutes}分を記録して中断しますか？`);

    if (shouldRecord) {
      addTimerRecord(elapsedMinutes, "タイマー中断で記録");
    }
  }

  resetTimerState();
});

// タイマー状態をリセット
function resetTimerState() {
  timerId = null;
  remainingSeconds = 0;
  originalMinutes = 0;
  originalSeconds = 0;
  overtimeSeconds = 0;
  isPaused = false;
  isOvertime = false;
  timerStartDate = null;

  pauseTimerButton.textContent = "一時停止";
  stopTimerButton.textContent = "中断";

  timerStatus.textContent = "READY";
  timerStatus.className = "timer-status";

  updateTimerDisplay();
}
// タイマー表示
function updateTimerDisplay() {
  if (isOvertime) {
    timerDisplay.textContent = `+${formatTimerSeconds(overtimeSeconds)}`;
    return;
  }

  timerDisplay.textContent = formatTimerSeconds(remainingSeconds);
}

function formatTimerSeconds(seconds) {
  const minutes = Math.floor(seconds / 60);
  const restSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(restSeconds).padStart(2, "0")}`;
}

// タイマー記録を追加
function addTimerRecord(minutes, defaultMemo = "タイマーで記録") {
  const endDate = new Date();
  const today = formatDateString(endDate);

  const subject = timerSubjectInput.value || "未設定";
  const memo = defaultMemo;

  const startTime = timerStartDate ? formatTimeString(timerStartDate) : "";
  const endTime = formatTimeString(endDate);

  const record = {
    date: today,
    subject: subject,
    time: minutes,
    memo: memo,
    startTime: startTime,
    endTime: endTime
  };

  records.push(record);
  saveRecords();
  displayRecords();
  updateSubjectSuggestions();

  timerMinutesInput.value = "";
  timerSubjectInput.value = "";

  subjectInput.value = "";
  manualStartTimeInput.value = "";
  manualEndTimeInput.value = "";
}
// プリセットボタン
presetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const minutes = button.dataset.minutes;

    timerMinutesInput.value = minutes;
    remainingSeconds = Number(minutes) * 60;

    timerMinutesInput.classList.add("hidden");
    showTimerMinutesButton.textContent = "＋";

    updateTimerDisplay();
  });
});

// メインタブ切り替え
function switchMainTab(tabName) {
  timerTab.classList.add("hidden");
  recordTab.classList.add("hidden");
  settingsTab.classList.add("hidden");

  timerTabButton.classList.remove("active-tab");
  recordTabButton.classList.remove("active-tab");
  settingsTabButton.classList.remove("active-tab");

  if (tabName === "timer") {
    timerTab.classList.remove("hidden");
    timerTabButton.classList.add("active-tab");
  }

  if (tabName === "record") {
    recordTab.classList.remove("hidden");
    recordTabButton.classList.add("active-tab");
  }

  if (tabName === "settings") {
    settingsTab.classList.remove("hidden");
    settingsTabButton.classList.add("active-tab");
  }
}

timerTabButton.addEventListener("click", () => {
  switchMainTab("timer");
});

recordTabButton.addEventListener("click", () => {
  switchMainTab("record");
});

settingsTabButton.addEventListener("click", () => {
  switchMainTab("settings");
});

// 手動追加フォーム開閉
showManualFormButton.addEventListener("click", () => {
  manualForm.classList.toggle("hidden");

  if (manualForm.classList.contains("hidden")) {
    resetManualForm();
  } else {
    editingRecordIndex = null;
    addButton.textContent = "追加";
    showManualFormButton.textContent = "×";
    showManualFormButton.classList.add("open");
  }
});

// 期間タブ切り替え
periodButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentPeriod = button.dataset.period;

    periodButtons.forEach((btn) => {
      btn.classList.remove("active-period");
    });

    button.classList.add("active-period");

    selectedDate = new Date();

    displayRecords();
  });
});

// 前へ・次へ
prevPeriodButton.addEventListener("click", () => {
  movePeriod(-1);
});

nextPeriodButton.addEventListener("click", () => {
  movePeriod(1);
});

function movePeriod(direction) {
  if (currentPeriod === "day") {
    selectedDate.setDate(selectedDate.getDate() + direction);
  } else if (currentPeriod === "week") {
    selectedDate.setDate(selectedDate.getDate() + direction * 7);
  } else if (currentPeriod === "month") {
    selectedDate.setMonth(selectedDate.getMonth() + direction);
  } else if (currentPeriod === "year") {
    selectedDate.setFullYear(selectedDate.getFullYear() + direction);
  }

  displayRecords();
}

// 集計表示を更新
function updatePeriodStats() {
  periodBreakdownList.innerHTML = "";

  if (currentPeriod === "day") {
    showDayStats();
  } else if (currentPeriod === "week") {
    showWeekStats();
  } else if (currentPeriod === "month") {
    showMonthStats();
  } else if (currentPeriod === "year") {
    showYearStats();
  }

  updateSubjectSummary();
  updateDailyGoalDisplay();
}

// 日：選択日の科目ごとの勉強時間を縦棒グラフ表示
function showDayStats() {
  const targetDateString = formatDateString(selectedDate);

  periodTitle.textContent = "選択日の科目ごとの勉強時間";
  currentPeriodLabel.textContent = formatDisplayDate(selectedDate);

  const dayRecords = records.filter((record) => {
    return record.date === targetDateString;
  });

  const subjectTotals = {};

  dayRecords.forEach((record) => {
    if (!subjectTotals[record.subject]) {
      subjectTotals[record.subject] = 0;
    }

    subjectTotals[record.subject] += record.time;
  });

  const graphData = Object.entries(subjectTotals).map(([subject, minutes]) => {
    return {
      label: subject,
      minutes: minutes
    };
  });

  graphData.sort((a, b) => {
    return b.minutes - a.minutes;
  });

  const total = graphData.reduce((sum, item) => {
    return sum + item.minutes;
  }, 0);

  if (graphData.length === 0) {
    showEmptyMessage("この日の記録はありません");
    periodTime.textContent = "0分";
    return;
  }

  renderVerticalGraph(graphData);
  periodTime.textContent = formatMinutes(total);
}

// 週：月〜日を縦棒グラフ表示
function showWeekStats() {
  periodTitle.textContent = "選択週の日ごとの勉強時間";

  const startOfWeek = new Date(selectedDate);
  const day = selectedDate.getDay();
  const diff = day === 0 ? 6 : day - 1;

  startOfWeek.setDate(selectedDate.getDate() - diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  currentPeriodLabel.textContent =
    `${formatDisplayDate(startOfWeek)}〜${formatDisplayDate(endOfWeek)}`;

  const weekLabels = ["月", "火", "水", "木", "金", "土", "日"];
  const graphData = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);

    const dateString = formatDateString(date);

    let dayTotal = 0;

    records.forEach((record) => {
      if (record.date === dateString) {
        dayTotal += record.time;
      }
    });

    graphData.push({
      label: `${weekLabels[i]}`,
      minutes: dayTotal
    });
  }

  const total = graphData.reduce((sum, item) => sum + item.minutes, 0);

  renderVerticalGraph(graphData);
  periodTime.textContent = formatMinutes(total);
}

// 月：1日〜末日を縦棒グラフ表示
function showMonthStats() {
  periodTitle.textContent = "選択月の日ごとの勉強時間";

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();

  currentPeriodLabel.textContent = `${year}年${month + 1}月`;

  const lastDay = new Date(year, month + 1, 0).getDate();
  const graphData = [];

  for (let day = 1; day <= lastDay; day++) {
    const date = new Date(year, month, day);
    const dateString = formatDateString(date);

    let dayTotal = 0;

    records.forEach((record) => {
      if (record.date === dateString) {
        dayTotal += record.time;
      }
    });

    graphData.push({
      label: `${day}`,
      minutes: dayTotal
    });
  }

  const total = graphData.reduce((sum, item) => sum + item.minutes, 0);

  renderVerticalGraph(graphData);
  periodTime.textContent = formatMinutes(total);
}

// 年：1月〜12月を縦棒グラフ表示
function showYearStats() {
  periodTitle.textContent = "選択年の月ごとの勉強時間";

  const year = selectedDate.getFullYear();

  currentPeriodLabel.textContent = `${year}年`;

  const graphData = [];

  for (let month = 0; month < 12; month++) {
    let monthTotal = 0;

    records.forEach((record) => {
      const recordDate = parseDate(record.date);

      if (
        recordDate.getFullYear() === year &&
        recordDate.getMonth() === month
      ) {
        monthTotal += record.time;
      }
    });

    graphData.push({
      label: `${month + 1}月`,
      minutes: monthTotal
    });
  }

  const total = graphData.reduce((sum, item) => sum + item.minutes, 0);

  renderVerticalGraph(graphData);
  periodTime.textContent = formatMinutes(total);
}

// 縦棒グラフを描画
function renderVerticalGraph(graphData) {
  periodBreakdownList.innerHTML = "";

  const maxMinutes = Math.max(...graphData.map((item) => item.minutes));
  const graphMax = maxMinutes > 0 ? Math.ceil(maxMinutes / 60) * 60 : 60;
  const halfMax = graphMax / 2;

  const graphOuter = document.createElement("div");
  graphOuter.className = "vertical-graph-outer";

  if (graphData.length <= 8) {
    graphOuter.classList.add("graph-sparse");
  } else if (graphData.length <= 16) {
    graphOuter.classList.add("graph-medium");
  } else {
    graphOuter.classList.add("graph-dense");
  }

  const yAxis = document.createElement("div");
  yAxis.className = "vertical-y-axis";

  const yTop = document.createElement("div");
  yTop.textContent = formatAxisTime(graphMax);

  const yMiddle = document.createElement("div");
  yMiddle.textContent = formatAxisTime(halfMax);

  const yBottom = document.createElement("div");
  yBottom.textContent = "0";

  yAxis.appendChild(yTop);
  yAxis.appendChild(yMiddle);
  yAxis.appendChild(yBottom);

  const graph = document.createElement("div");
  graph.className = "vertical-graph";

  const gridLines = document.createElement("div");
  gridLines.className = "graph-grid-lines";

  const gridTop = document.createElement("div");
  gridTop.className = "graph-grid-line top";

  const gridMiddle = document.createElement("div");
  gridMiddle.className = "graph-grid-line middle";

  const gridBottom = document.createElement("div");
  gridBottom.className = "graph-grid-line bottom";

  gridLines.appendChild(gridTop);
  gridLines.appendChild(gridMiddle);
  gridLines.appendChild(gridBottom);

  graph.appendChild(gridLines);

  graphData.forEach((item) => {
    const barWrapper = document.createElement("div");
    barWrapper.className = "vertical-bar-wrapper";

    const barArea = document.createElement("div");
    barArea.className = "vertical-bar-area";

    const bar = document.createElement("div");
    bar.className = "vertical-bar";

    if (item.minutes <= 0) {
      bar.classList.add("zero-bar");
      bar.style.height = "0";
    } else {
      const percent = graphMax > 0 ? (item.minutes / graphMax) * 100 : 0;
      bar.style.height = `${percent}%`;
    }

    barArea.appendChild(bar);

    const labelText = document.createElement("div");
    labelText.className = "vertical-bar-label";

    if (graphData.length > 20) {
      const labelNumber = Number(item.label);

      if ([1, 5, 10, 15, 20, 25, 30].includes(labelNumber)) {
        labelText.textContent = item.label;
      } else {
        labelText.textContent = "";
      }
    } else {
      labelText.textContent = item.label;
    }

    barWrapper.appendChild(barArea);
    barWrapper.appendChild(labelText);

    graph.appendChild(barWrapper);
  });

  graphOuter.appendChild(yAxis);
  graphOuter.appendChild(graph);

  periodBreakdownList.appendChild(graphOuter);
}

function showEmptyMessage(message) {
  periodBreakdownList.innerHTML = "";

  const li = document.createElement("li");
  li.className = "breakdown-item";
  li.textContent = message;

  periodBreakdownList.appendChild(li);
}

// 日付系
function formatDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${year}/${month}/${day}`;
}

function formatTimeString(date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

function calculateMinutesFromTimeRange(startTime, endTime) {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;

  return endTotalMinutes - startTotalMinutes;
}

function parseDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// 分を「時間＋分」で表示
function formatMinutes(minutes) {
  if (minutes < 60) {
    return `${minutes}分`;
  }

  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;

  if (restMinutes === 0) {
    return `${hours}時間`;
  }

  return `${hours}時間${restMinutes}分`;
}

function updateDailyGoalDisplay() {
  if (currentPeriod !== "day") {
    dailyGoalSection.classList.add("hidden");
    return;
  }

  dailyGoalSection.classList.remove("hidden");

  const selectedDateString = formatDateString(selectedDate);

  let dayTotal = 0;

  records.forEach((record) => {
    if (record.date === selectedDateString) {
      dayTotal += record.time;
    }
  });

  if (dailyGoalMinutes <= 0) {
    goalProgressText.textContent = `${formatMinutes(dayTotal)} / 未設定`;
    goalRemainingText.textContent = "目標時間を設定してください";
    goalBarFill.style.width = "0%";
    return;
  }

  const remaining = dailyGoalMinutes - dayTotal;
  const achievementRate = Math.min((dayTotal / dailyGoalMinutes) * 100, 100);

  goalProgressText.textContent =
    `${formatMinutes(dayTotal)} / ${formatMinutes(dailyGoalMinutes)}`;

  if (remaining > 0) {
    goalRemainingText.textContent = `あと ${formatMinutes(remaining)}`;
  } else {
    goalRemainingText.textContent = "目標達成";
  }

  goalBarFill.style.width = `${achievementRate}%`;
}

function vibrateOnFinish() {
  if ("vibrate" in navigator) {
    navigator.vibrate([300, 100, 300]);
  }
}

function updateSubjectSummary() {
  subjectSummaryList.innerHTML = "";

  const targetRecords = getRecordsInCurrentPeriod();

  if (targetRecords.length === 0) {
    const li = document.createElement("li");
    li.className = "subject-summary-empty";
    li.textContent = "この期間の記録はありません";
    subjectSummaryList.appendChild(li);
    return;
  }

  const subjectTotals = {};

  targetRecords.forEach((record) => {
    if (!subjectTotals[record.subject]) {
      subjectTotals[record.subject] = 0;
    }

    subjectTotals[record.subject] += record.time;
  });

  const subjectData = Object.entries(subjectTotals)
    .map(([subject, minutes]) => {
      return {
        subject: subject,
        minutes: minutes
      };
    })
    .sort((a, b) => b.minutes - a.minutes);

  subjectData.forEach((item) => {
    const li = document.createElement("li");
    li.className = "subject-summary-item";

    const subjectName = document.createElement("span");
    subjectName.textContent = item.subject;

    const subjectTime = document.createElement("strong");
    subjectTime.textContent = formatMinutes(item.minutes);

    li.appendChild(subjectName);
    li.appendChild(subjectTime);

    subjectSummaryList.appendChild(li);
  });
}

function getRecordsInCurrentPeriod() {
  if (currentPeriod === "day") {
    const selectedDateString = formatDateString(selectedDate);

    return records.filter((record) => {
      return record.date === selectedDateString;
    });
  }

  if (currentPeriod === "week") {
    const startOfWeek = new Date(selectedDate);
    const day = selectedDate.getDay();
    const diff = day === 0 ? 6 : day - 1;

    startOfWeek.setDate(selectedDate.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return records.filter((record) => {
      const recordDate = parseDate(record.date);
      return recordDate >= startOfWeek && recordDate <= endOfWeek;
    });
  }

  if (currentPeriod === "month") {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();

    return records.filter((record) => {
      const recordDate = parseDate(record.date);

      return (
        recordDate.getFullYear() === year &&
        recordDate.getMonth() === month
      );
    });
  }

  if (currentPeriod === "year") {
    const year = selectedDate.getFullYear();

    return records.filter((record) => {
      const recordDate = parseDate(record.date);
      return recordDate.getFullYear() === year;
    });
  }

  return [];
}

function formatAxisTime(minutes) {
  if (minutes < 60) {
    return `${minutes}分`;
  }

  const hours = minutes / 60;

  return `${hours}h`;
}

// ブラックモード切り替え
themeToggleButton.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");

  if (document.body.classList.contains("dark-mode")) {
    themeToggleButton.textContent = "☀️";
    localStorage.setItem("theme", "dark");
  } else {
    themeToggleButton.textContent = "🌙";
    localStorage.setItem("theme", "light");
  }
});

// 前回のテーマを読み込む
const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
  document.body.classList.add("dark-mode");
  themeToggleButton.textContent = "☀️";
} else {
  themeToggleButton.textContent = "🌙";
}

addSubjectButton.addEventListener("click", () => {
  const newSubject = timerSubjectInput.value.trim();

  if (!newSubject) {
    alert("科目名を入力してください");
    return;
  }

  if (fixedSubjects.includes(newSubject)) {
    alert("この科目はすでに追加されています");
    return;
  }

  fixedSubjects.push(newSubject);
  saveFixedSubjects();
  displaySubjectPresets();
});

editGoalButton.addEventListener("click", () => {
  goalForm.classList.toggle("hidden");

  if (dailyGoalMinutes > 0) {
    dailyGoalInput.value = dailyGoalMinutes;
  }
});

saveGoalButton.addEventListener("click", () => {
  const goal = Number(dailyGoalInput.value);

  if (goal <= 0) {
    alert("目標時間を入力してください");
    return;
  }

  dailyGoalMinutes = goal;
  localStorage.setItem("dailyGoalMinutes", String(dailyGoalMinutes));

  goalForm.classList.add("hidden");
  updateDailyGoalDisplay();
});

// バックアップ
backupButton.addEventListener("click", () => {
  const backupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    records: records,
    fixedSubjects: fixedSubjects,
    dailyGoalMinutes: dailyGoalMinutes,
    theme: localStorage.getItem("theme") || "light"
  };

  const jsonText = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonText], { type: "application/json" });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `study-log-backup-${formatDateString(new Date())}.json`;
  a.click();

  URL.revokeObjectURL(url);
});

// 復元ボタン
restoreButton.addEventListener("click", () => {
  restoreFileInput.click();
});

// 復元ファイル読み込み
restoreFileInput.addEventListener("change", () => {
  const file = restoreFileInput.files[0];

  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const backupData = JSON.parse(reader.result);

      if (!backupData.records || !Array.isArray(backupData.records)) {
        alert("バックアップファイルの形式が正しくありません");
        return;
      }

      const shouldRestore = confirm(
        "現在のデータをバックアップデータで上書きします。復元しますか？"
      );

      if (!shouldRestore) {
        return;
      }

      records = backupData.records;
      fixedSubjects = backupData.fixedSubjects || [];
      dailyGoalMinutes = Number(backupData.dailyGoalMinutes) || 0;

      localStorage.setItem("studyRecords", JSON.stringify(records));
      localStorage.setItem("fixedSubjects", JSON.stringify(fixedSubjects));
      localStorage.setItem("dailyGoalMinutes", String(dailyGoalMinutes));

      if (backupData.theme) {
        localStorage.setItem("theme", backupData.theme);
      }

      displayRecords();
      displaySubjectPresets();
      updateSubjectSuggestions();
      updateDailyGoalDisplay();

      alert("復元しました");
    } catch (error) {
      alert("復元に失敗しました");
    }

    restoreFileInput.value = "";
  };

  reader.readAsText(file);
});

// 全データ削除
clearDataButton.addEventListener("click", () => {
  const firstConfirm = confirm("すべての勉強記録を削除しますか？");

  if (!firstConfirm) {
    return;
  }

  const secondConfirm = confirm("本当に削除しますか？この操作は元に戻せません。");

  if (!secondConfirm) {
    return;
  }

  records = [];
  fixedSubjects = [];
  dailyGoalMinutes = 0;

  localStorage.removeItem("studyRecords");
  localStorage.removeItem("fixedSubjects");
  localStorage.removeItem("dailyGoalMinutes");

  displayRecords();
  displaySubjectPresets();
  updateSubjectSuggestions();
  updateDailyGoalDisplay();

  alert("すべてのデータを削除しました");
});

showTimerMinutesButton.addEventListener("click", () => {
  timerMinutesInput.classList.toggle("hidden");

  if (timerMinutesInput.classList.contains("hidden")) {
    showTimerMinutesButton.textContent = "＋";
  } else {
    showTimerMinutesButton.textContent = "×";
    timerMinutesInput.focus();
  }
});

// CSVエクスポート
exportCsvButton.addEventListener("click", () => {
  if (records.length === 0) {
    alert("出力する記録がありません");
    return;
  }

  const header = ["日付", "科目", "勉強時間（分）", "開始時刻", "終了時刻"];

  const rows = records.map((record) => {
    return [
      record.date || "",
      record.subject || "",
      record.time || 0,
      record.startTime || "",
      record.endTime || ""
    ];
  });

  const csvContent = [header, ...rows]
    .map((row) => {
      return row.map(escapeCsvValue).join(",");
    })
    .join("\n");

  const bom = "\uFEFF";
  const blob = new Blob([bom + csvContent], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `study-log-${formatDateString(new Date())}.csv`;
  a.click();

  URL.revokeObjectURL(url);
});

function escapeCsvValue(value) {
  const text = String(value);

  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}