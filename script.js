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

    // عرض اليوم الحالي
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

    // حدث زر تحديد اليوم
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

    // عرض باقي الأيام
    showAllBtn.onclick = () => allDaysContainer.classList.toggle('hidden');

    // تحديث عداد الأيام
    updateCompletedCount();

    // إعادة تعيين الأسبوع
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
// قسم الأدوات والمؤقت
// ==============================================
let timerInterval = null;
let timerSeconds = 0;

function initTools() {
    const todayType = getTodayType();
    const workoutSection = document.getElementById('workoutSequenceSection');

    // إظهار التمارين فقط في أيام التمرين
    if (todayType === 'exercise') {
        workoutSection.style.display = 'block';
        updateExerciseDisplay();
    } else {
        workoutSection.style.display = 'none';
    }

    // إعداد المؤقت
    initTimer();

    // زر إكمال التمرين
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

    function updateDisplay() {
        display.textContent = formatTime(timerSeconds);
    }

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
