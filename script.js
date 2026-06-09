// إدارة الوضع الداكن
const themeToggle = document.getElementById('themeToggle');
const htmlEl = document.documentElement;

if (localStorage.getItem('theme') === 'dark' || 
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    htmlEl.classList.add('dark');
}

themeToggle.addEventListener('click', () => {
    htmlEl.classList.toggle('dark');
    localStorage.setItem('theme', htmlEl.classList.contains('dark') ? 'dark' : 'light');
});

// تبديل التبويبات
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        
        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(target).classList.add('active');

        // تحديث عرض اليوم عند فتح تبويب التقويم
        if (target === 'calendar') {
            showTodayOnly();
        }
    });
});

// 📅 وظائف عرض اليوم الحالي
const todayContainer = document.getElementById('todayContainer');
const allDaysContainer = document.getElementById('allDaysContainer');
const showAllDaysBtn = document.getElementById('showAllDaysBtn');

// ترجمة رقم اليوم إلى اسم بالعربية
function getTodayName() {
    const daysNames = [
        'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'
    ];
    const todayNum = new Date().getDay();
    return daysNames[todayNum];
}

// عرض اليوم الحالي فقط
function showTodayOnly() {
    const todayName = getTodayName();
    const todayCard = document.querySelector(`.day-card[data-day="${todayName}"]`);
    
    if (!todayCard) return;

    // نسخ محتوى اليوم الحالي وعرضه بشكل كبير
    todayContainer.innerHTML = `
        <div class="today-card ${todayCard.classList.contains('day-run') ? 'day-run' : todayCard.classList.contains('day-exercise') ? 'day-exercise' : 'day-rest'}">
            <h3 class="today-title">اليوم: ${todayName}</h3>
            <i class="fa ${todayCard.querySelector('i').className} today-icon"></i>
            <span class="today-type">${todayCard.querySelector('.day-type').textContent}</span>
            ${todayCard.classList.contains('day-rest') 
                ? '<p class="rest-text">يوم راحة واستشفاء</p>' 
                : `<button class="check-btn today-check" data-day="${todayName}">
                    <i class="fa fa-check"></i> ${completedDays.includes(todayName) ? 'مكتمل' : 'تسجيل الإنجاز'}
                   </button>`
            }
        </div>
    `;

    // ربط زر التحديد بالحفظ
    const todayCheckBtn = todayContainer.querySelector('.today-check');
    if (todayCheckBtn) {
        todayCheckBtn.addEventListener('click', () => toggleDayCompletion(todayName, todayCheckBtn));
    }
}

// تبديل حالة إكمال اليوم
function toggleDayCompletion(dayName, buttonElement) {
    if (completedDays.includes(dayName)) {
        completedDays = completedDays.filter(d => d !== dayName);
        buttonElement.innerHTML = '<i class="fa fa-check"></i> تسجيل الإنجاز';
        buttonElement.classList.remove('completed');
    } else {
        completedDays.push(dayName);
        buttonElement.innerHTML = '<i class="fa fa-check"></i> مكتمل ✅';
        buttonElement.classList.add('completed');
    }
    
    localStorage.setItem('completedDays', JSON.stringify(completedDays));
    updateCalendarDisplay();
    updateStats();
}

// زر عرض باقي الأيام
showAllDaysBtn.addEventListener('click', () => {
    const isHidden = allDaysContainer.classList.contains('hidden');
    allDaysContainer.classList.toggle('hidden');
    showAllDaysBtn.textContent = isHidden ? 'إخفاء باقي الأيام' : 'عرض باقي أيام الأسبوع';
});

// إدارة التقويم الكامل
const dayCards = document.querySelectorAll('.day-card:not(.day-rest)');
const completedCountEl = document.getElementById('completedCount');
const resetWeekBtn = document.getElementById('resetWeek');

// تحميل الحالة المحفوظة
let completedDays = JSON.parse(localStorage.getItem('completedDays')) || [];

dayCards.forEach(card => {
    const checkBtn = card.querySelector('.check-btn');
    checkBtn.addEventListener('click', () => {
        const day = card.dataset.day;
        toggleDayCompletion(day, checkBtn);
    });
});

function updateCalendarDisplay() {
    dayCards.forEach(card => {
        const day = card.dataset.day;
        const checkBtn = card.querySelector('.check-btn');
        if (completedDays.includes(day)) {
            card.classList.add('completed');
            checkBtn.classList.add('completed');
        } else {
            card.classList.remove('completed');
            checkBtn.classList.remove('completed');
        }
    });
    showTodayOnly(); // تحديث عرض اليوم الحالي أيضاً
}

function updateStats() {
    completedCountEl.textContent = completedDays.length;
}

resetWeekBtn.addEventListener('click', () => {
    if (confirm('هل أنت متأكد من إعادة تعيين جميع أيام الأسبوع؟')) {
        completedDays = [];
        localStorage.removeItem('completedDays');
        updateCalendarDisplay();
        updateStats();
    }
});

// تهيئة العرض عند التحميل
showTodayOnly();
updateCalendarDisplay();
updateStats();

// إدارة المؤقت
let timerInterval;
let timerSeconds = 0;
const timerDisplay = document.getElementById('timerDisplay');
const presetButtons = document.querySelectorAll('.preset-btn');
const startTimerBtn = document.getElementById('startTimer');
const pauseTimerBtn = document.getElementById('pauseTimer');
const resetTimerBtn = document.getElementById('resetTimer');

presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        clearInterval(timerInterval);
        timerSeconds = parseInt(btn.dataset.time);
        updateTimer();
    });
});

function updateTimer() {
    const min = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
    const sec = (timerSeconds % 60).toString().padStart(2, '0');
    timerDisplay.textContent = `${min}:${sec}`;
}

startTimerBtn.addEventListener('click', () => {
    if (timerSeconds <= 0) return;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timerSeconds--;
        updateTimer();
        if (timerSeconds <= 0) {
            clearInterval(timerInterval);
            alert('انتهى الوقت!');
        }
    }, 1000);
});

pauseTimerBtn.addEventListener('click', () => clearInterval(timerInterval));
resetTimerBtn.addEventListener('click', () => {
    clearInterval(timerInterval);
    timerSeconds = 0;
    updateTimer();
});

// إدارة الملاحظات
const notesArea = document.getElementById('notesArea');
const saveNotesBtn = document.getElementById('saveNotes');
const savedNotesList = document.getElementById('savedNotesList');

loadNotes();

saveNotesBtn.addEventListener('click', () => {
    const text = notesArea.value.trim();
    if (!text) return;
    
    const notes = JSON.parse(localStorage.getItem('personalNotes')) || [];
    const today = new Date().toLocaleDateString('ar-EG');
    
    notes.unshift({ date: today, text: text });
    localStorage.setItem('personalNotes', JSON.stringify(notes.slice(0, 10)));
    
    notesArea.value = '';
    loadNotes();
    alert('تم حفظ الملاحظة بنجاح');
});

function loadNotes() {
    const notes = JSON.parse(localStorage.getItem('personalNotes')) || [];
    savedNotesList.innerHTML = notes.length 
        ? notes.map(n => `<div class="note-item"><strong>${n.date}:</strong> ${n.text}</div>`).join('')
        : '<p class="text-gray-500">لا توجد ملاحظات محفوظة</p>';
}

// تتبع الوزن والرسم البياني
const weightInput = document.getElementById('weightInput');
const saveWeightBtn = document.getElementById('saveWeight');
const weightChartCtx = document.getElementById('weightChart');
let weightChart;

saveWeightBtn.addEventListener('click', () => {
    const weight = parseFloat(weightInput.value);
    if (!weight || weight < 30 || weight > 200) {
        alert('يرجى إدخال وزن صالح بين 30 و 200 كغم');
        return;
    }
    
    const history = JSON.parse(localStorage.getItem('weightHistory')) || [];
    const today = new Date().toLocaleDateString('ar-EG');
    
    const existingIndex = history.findIndex(e => e.date === today);
    if (existingIndex !== -1) history.splice(existingIndex, 1);
    
    history.push({ date: today, weight: weight });
    localStorage.setItem('weightHistory', JSON.stringify(history));
    
    weightInput.value = '';
    initWeightChart();
    updateSummary();
    alert('تم حفظ الوزن بنجاح');
});

function initWeightChart() {
    const history = JSON.parse(localStorage.getItem('weightHistory')) || [];
    const labels = history.map(e => e.date);
    const data = history.map(e => e.weight);
    
    if (weightChart) weightChart.destroy();
    
    weightChart = new Chart(weightChartCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'الوزن (كغم)',
                data: data,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            rtl: true,
            scales: {
                y: { beginAtZero: false }
            }
        }
    });
}

function updateSummary() {
    const summaryEl = document.getElementById('progressSummary');
    const history = JSON.parse(localStorage.getItem('weightHistory')) || [];
    const days = completedDays.length;
    
    let html = `<p>✅ عدد الأيام المكتملة: <strong>${days}</strong></p>`;
    
    if (history.length >= 2) {
        const first = history[0].weight;
        const last = history[history.length - 1].weight;
        const diff = (first - last).toFixed(1);
        html += `<p>⚖️ التغير في الوزن: <strong>${diff} كغم</strong></p>`;
    }
    
    if (days >= 12) {
        html += `<p>🎉 ممتاز! لقد أكملت أكثر من 4 أسابيع، استمر في التقدم!</p>`;
    }
    
    summaryEl.innerHTML = html;
}

// تهيئة البيانات عند التحميل
window.addEventListener('load', () => {
    initWeightChart();
    updateSummary();
});
