// ==============================================
// الوضع الداكن
// ==============================================
const themeToggle = document.getElementById('themeToggle');
const htmlEl = document.documentElement;

if (localStorage.getItem('theme') === 'dark' || 
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    htmlEl.classList.add('dark');
} else {
    htmlEl.classList.add('light');
}

themeToggle.addEventListener('click', () => {
    htmlEl.classList.toggle('dark');
    htmlEl.classList.toggle('light');
    localStorage.setItem('theme', htmlEl.classList.contains('dark') ? 'dark' : 'light');
});

// ==============================================
// تبديل التبويبات
// ==============================================
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(target).classList.add('active');

        if (target === 'calendar') renderCalendar();
        if (target === 'tools') initTools();
        if (target === 'progress') initProgress();
    });
});

// ==============================================
// بيانات الخطة
// ==============================================
const workoutStages = {
    1: {
        title: "المرحلة الأولى - الشهر الأول",
        goal: "تهيئة الجسم ورفع اللياقة",
        exercises: [
            { name: "الضغط المائل", sets: "3", reps: "12", note: "يداك على حافة سرير" },
            { name: "سكوات على كرسي", sets: "3", reps: "12", note: "آمن للركبة" },
            { name: "البلانك", sets: "3", reps: "30-40 ثانية", note: "استقامة الجسم" },
            { name: "جسر الحوض", sets: "3", reps: "15", note: "تقوية الظهر" },
            { name: "تسلق الجبال", sets: "3", reps: "30 ثانية", note: "بوتيرة معتدلة" }
        ]
    }
};

// ==============================================
// بيانات المتابعة المحفوظة
// ==============================================
let currentStage = parseInt(localStorage.getItem('currentStage')) || 1;
let daysCompleted = JSON.parse(localStorage.getItem('daysCompleted')) || [];
let workoutProgress = JSON.parse(localStorage.getItem('workoutProgress')) || {
    currentExercise: 0,
    currentRound: 1,
    completed: false
};
let weightRecords = JSON.parse(localStorage.getItem('weightRecords')) || [];

// ==============================================
// وظائف مساعدة
// ==============================================
function getTodayName() {
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return days[new Date().getDay()];
}

function getTodayType() {
    const today = getTodayName();
    if (['السبت', 'الإثنين', 'الأربعاء'].includes(today)) return 'run';
    if (['الأحد', 'الثلاثاء', 'الخميس'].includes(today)) return 'exercise';
    return 'rest';
}

// ==============================================
// التقويم
// ==============================================
function renderCalendar() {
    const today = getTodayName();
    const todayType = getTodayType();
    const todayContainer = document.getElementById('todayContainer');
    const allDaysContainer = document.getElementById('allDaysContainer');
    const showAllBtn = document.getElementById('showAllDaysBtn');
    const completedCountEl = document.getElementById('completedCount');

    const icons = { run: 'fa-running', exercise: 'fa-dumbbell', rest: 'fa-bed' };
    const labels = { run: 'ركض', exercise: 'تمارين', rest: 'راحة' };
    const isCompleted = daysCompleted.includes(today);

    todayContainer.innerHTML = `
        <div class="today-card stage-card" style="border-color: var(--primary);">
            <h3 class="today-title">اليوم: ${today}</h3>
            <i class="fa ${icons[todayType]} today-icon"></i>
            <p class="today-type">${labels[todayType]}</p>
            ${todayType !== 'rest' ? 
                `<button class="today-check ${isCompleted ? 'completed' : ''}" id="markTodayBtn">
                    ${isCompleted ? '✓ مكتمل' : 'تحديد كمكتمل'}
                </button>` : 
                `<p class="rest-text">يوم راحة</p>`
            }
        </div>
    `;

    const markTodayBtn = document.getElementById('markTodayBtn');
    if (markTodayBtn) {
        markTodayBtn.addEventListener('click', () => {
            if (!daysCompleted.includes(today)) {
                daysCompleted.push(today);
                localStorage.setItem('daysCompleted', JSON.stringify(daysCompleted));
                markTodayBtn.classList.add('completed');
                markTodayBtn.textContent = '✓ مكتمل';
                updateCompletedCount();
            }
        });
    }

    showAllBtn.onclick = () => allDaysContainer.classList.toggle('hidden');
    updateCompletedCount();

    document.getElementById('resetWeek').onclick = () => {
        if (confirm('هل تريد إعادة تعيين تقدم الأسبوع؟')) {
            daysCompleted = [];
            localStorage.removeItem('daysCompleted');
            renderCalendar();
        }
    };
}

function updateCompletedCount() {
    document.getElementById('completedCount').textContent = daysCompleted.length;
}

// ==============================================
// قسم الأدوات - مؤقت قابل للتعديل يدوياً
// ==============================================
let timerInterval = null;
let timerSeconds = 0;

function initTools() {
    const todayType = getTodayType();
    const workoutSection = document.getElementById('workoutSequenceSection');

    if (todayType === 'exercise') {
        workoutSection.style.display = 'block';
        updateExerciseDisplay();
    } else {
        workoutSection.style.display = 'none';
    }

    initTimer();
    initNotes();

    document.getElementById('completeExerciseBtn').onclick = () => {
        const exercises = workoutStages[currentStage].exercises;
        const total = exercises.length;

        if (workoutProgress.completed) return;

        if (workoutProgress.currentExercise < total - 1) {
            workoutProgress.currentExercise++;
        } else {
            if (workoutProgress.currentRound < 3) {
                workoutProgress.currentRound++;
                workoutProgress.currentExercise = 0;
            } else {
                workoutProgress.completed = true;
                alert('🎉 تم إكمال جميع التمارين!');
                completeWorkoutDay();
                return;
            }
        }
        saveProgress();
        updateExerciseDisplay();
    };
}

function updateExerciseDisplay() {
    const exercises = workoutStages[currentStage].exercises;
    const current = exercises[workoutProgress.currentExercise];
    document.getElementById('totalExercises').textContent = exercises.length;
    document.getElementById('currentExerciseIndex').textContent = workoutProgress.currentExercise + 1;
    document.getElementById('currentRound').textContent = workoutProgress.currentRound;
    document.getElementById('currentExerciseName').textContent = current.name;
    document.getElementById('currentExerciseDetails').textContent = `${current.sets} × ${current.reps}`;
    document.getElementById('currentExerciseNote').textContent = current.note;
}

function saveProgress() {
    localStorage.setItem('workoutProgress', JSON.stringify(workoutProgress));
}

function completeWorkoutDay() {
    const today = getTodayName();
    if (!daysCompleted.includes(today)) {
        daysCompleted.push(today);
        localStorage.setItem('daysCompleted', JSON.stringify(daysCompleted));
    }
}

function initTimer() {
    const display = document.getElementById('timerDisplay');
    const startBtn = document.getElementById('startTimer');
    const pauseBtn = document.getElementById('pauseTimer');
    const resetBtn = document.getElementById('resetTimer');
    const presets = document.querySelectorAll('.preset-btn');

    function formatTime(sec) {
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    function parseTimeToSeconds(timeStr) {
        const parts = timeStr.split(':');
        if (parts.length === 2) {
            const m = parseInt(parts[0]) || 0;
            const s = parseInt(parts[1]) || 0;
            return Math.max(0, m * 60 + s);
        }
        return 0;
    }

    function updateDisplay() {
        display.textContent = formatTime(timerSeconds);
    }

    // ✅ إمكانية التعديل اليدوي
    display.addEventListener('click', () => {
        clearInterval(timerInterval);
        display.contentEditable = true;
        display.focus();
        display.select();
    });

    display.addEventListener('blur', () => {
        display.contentEditable = false;
        const inputText = display.textContent.trim();
        timerSeconds = parseTimeToSeconds(inputText);
        updateDisplay();
    });

    display.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            display.blur();
        }
    });

    presets.forEach(btn => {
        btn.onclick = () => {
            clearInterval(timerInterval);
            timerSeconds = parseInt(btn.dataset.time);
            updateDisplay();
        };
    });

    startBtn.onclick = () => {
        if (timerInterval) return;
        timerInterval = setInterval(() => {
            if (timerSeconds > 0) {
                timerSeconds--;
                updateDisplay();
            } else {
                clearInterval(timerInterval);
                timerInterval = null;
                alert('انتهى الوقت!');
            }
        }, 1000);
    };

    pauseBtn.onclick = () => {
        clearInterval(timerInterval);
        timerInterval = null;
    };

    resetBtn.onclick = () => {
        clearInterval(timerInterval);
        timerInterval = null;
        timerSeconds = 0;
        updateDisplay();
    };
}

function initNotes() {
    const notesArea = document.getElementById('notesArea');
    const saveNotesBtn = document.getElementById('saveNotes');
    const savedNotes = localStorage.getItem('personalNotes') || '';
    notesArea.value = savedNotes;

    saveNotesBtn.onclick = () => {
        localStorage.setItem('personalNotes', notesArea.value.trim());
        alert('تم حفظ الملاحظات بنجاح!');
    };
}

// ==============================================
// ✅ قسم التقدم - حفظ الوزن يعمل الآن
// ==============================================
function initProgress() {
    const weightInput = document.getElementById('weightInput');
    const saveWeightBtn = document.getElementById('saveWeight');
    let weightChart = null;

    saveWeightBtn.onclick = () => {
        const weightVal = parseFloat(weightInput.value);
        if (!weightVal || weightVal < 30 || weightVal > 200) {
            alert('يرجى إدخال وزن صالح بين 30 و 200 كجم');
            return;
        }

        const today = new Date().toLocaleDateString('ar-IQ');
        weightRecords.push({ date: today, weight: weightVal });
        localStorage.setItem('weightRecords', JSON.stringify(weightRecords));
        
        weightInput.value = '';
        alert('تم حفظ الوزن بنجاح!');
        renderWeightChart();
    };

    function renderWeightChart() {
        const ctx = document.getElementById('weightChart').getContext('2d');
        if (weightChart) weightChart.destroy();

        if (weightRecords.length === 0) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.font = '16px Arial';
            ctx.fillStyle = 'var(--gray-700)';
            ctx.textAlign = 'center';
            ctx.fillText('لا توجد بيانات وزن مسجلة بعد', ctx.canvas.width / 2, ctx.canvas.height / 2);
            return;
        }

        const labels = weightRecords.map(r => r.date);
        const data = weightRecords.map(r => r.weight);

        weightChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'الوزن (كجم)',
                    data: data,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    tension: 0.3,
                    fill: true,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: false }
                }
            }
        });
    }

    renderWeightChart();
}

// ==============================================
// تشغيل أولي عند التحميل
// ==============================================
window.addEventListener('load', () => {
    updatePlanView();
});

function updatePlanView() {
    const todayType = getTodayType();
    document.getElementById('runDayMessage').style.display = todayType === 'run' ? 'block' : 'none';
    document.getElementById('restDayMessage').style.display = todayType === 'rest' ? 'block' : 'none';
}
