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

        if (target === 'calendar') showTodayOnly();
        if (target === 'plan') updatePlanView();
    });
});

// 📊 بيانات الخطة والمراحل
const workoutStages = {
    1: {
        title: "المرحلة الأولى - الشهر الأول",
        goal: "🎯 الهدف: تهيئة الجسم، رفع اللياقة، وتقوية العضلات الأساسية",
        exercises: [
            { name: "الضغط المائل", sets: "3", reps: "12", note: "يداك على حافة سرير" },
            { name: "سكوات على كرسي", sets: "3", reps: "12", note: "آمن تماماً للركبة" },
            { name: "البلانك", sets: "3", reps: "30-40 ثانية", note: "حافظ على استقامة الجسم" },
            { name: "جسر الحوض", sets: "3", reps: "15", note: "يقوي أسفل الظهر والأرداف" },
            { name: "تسلق الجبال", sets: "3", reps: "30 ثانية", note: "بوتيرة معتدلة" }
        ]
    },
    2: {
        title: "المرحلة الثانية - الشهر الثاني",
        goal: "🎯 الهدف: زيادة الكثافة، حرق الدهون، وتحسين التحمل",
        exercises: [
            { name: "الضغط الأرضي", sets: "3", reps: "12-15", note: "حافظ على استقامة الجسم" },
            { name: "الطعن الخلفي", sets: "3", reps: "10 لكل ساق", note: "حافظ على توازنك" },
            { name: "رفع الأرجل", sets: "3", reps: "12", note: "لا ترفع بسرعة" },
            { name: "البلانك الجانبي", sets: "3", reps: "30 ثانية لكل جانب", note: "حافظ على استقامة الجسم" }
        ]
    },
    3: {
        title: "المرحلة الثالثة - الشهر الثالث",
        goal: "🎯 الهدف: نحت الجسم، رفع مستوى الحرق، وتثبيت العادات",
        exercises: [
            { name: "الضغط الضيق", sets: "3", reps: "12", note: "يركز على عضلات الذراع" },
            { name: "الجلوس على الحائط", sets: "3", reps: "45 ثانية", note: "آمن للركبة" },
            { name: "طحن البطن", sets: "3", reps: "15", note: "يركز على عضلات البطن" },
            { name: "رفرفة الأرجل", sets: "3", reps: "30 ثانية", note: "حركة مستمرة" }
        ]
    }
};

// حالة التقدم
let currentStage = parseInt(localStorage.getItem('currentStage')) || 1;
let daysCompletedInStage = parseInt(localStorage.getItem('daysCompletedInStage')) || 0;
let workoutProgress = JSON.parse(localStorage.getItem('workoutProgress')) || {
    currentExercise: 0,
    currentRound: 1,
    completed: false
};

// تحديث عرض الخطة بناءً على اليوم والمرحلة
function updatePlanView() {
    const todayType = getTodayType();
    const workoutSection = document.getElementById('workoutSection');
    const runMsg = document.getElementById('runDayMessage');
    const restMsg = document.getElementById('restDayMessage');
    const stageData = workoutStages[currentStage];

    // تحديث معلومات المرحلة
    document.getElementById('currentStageBadge').textContent = currentStage;
    document.getElementById('currentStageTitle').textContent = stageData.title;
    document.getElementById('currentStageGoal').textContent = stageData.goal;
    document.getElementById('monthProgress').textContent = `${daysCompletedInStage} / 30 يوم`;
    document.getElementById('monthProgressFill').style.width = `${(daysCompletedInStage / 30) * 100}%`;

    // إظهار القسم المناسب
    workoutSection.style.display = 'none';
    runMsg.style.display = 'none';
    restMsg.style.display = 'none';

    if (todayType === 'exercise') {
        workoutSection.style.display = 'block';
        updateCurrentExerciseDisplay();
    } else if (todayType === 'run') {
        runMsg.style.display = 'block';
    } else {
        restMsg.style.display = 'block';
    }
}

// تحديث عرض التمرين الحالي
function updateCurrentExerciseDisplay() {
    const stageData = workoutStages[currentStage];
    const exercises = stageData.exercises;
    const totalExercises = exercises.length;
    
    document.getElementById('totalExercises').textContent = totalExercises;
    document.getElementById('currentExerciseIndex').textContent = workoutProgress.currentExercise + 1;
    document.getElementById('currentRound').textContent = workoutProgress.currentRound;

    const current = exercises[workoutProgress.currentExercise];
    document.getElementById('currentExerciseName').textContent = current.name;
    document.getElementById('currentExerciseDetails').textContent = `${current.sets} × ${current.reps}`;
    document.getElementById('currentExerciseNote').textContent = current.note;
}

// إكمال التمرين والانتقال للتالي
document.getElementById('completeExerciseBtn').addEventListener('click', () => {
    const stageData = workoutStages[currentStage];
    const totalExercises = stageData.exercises.length;

    if (workoutProgress.completed) return;

    if (workoutProgress.currentExercise < totalExercises - 1) {
        workoutProgress.currentExercise++;
    } else {
        if (workoutProgress.currentRound < 3) {
            workoutProgress.currentRound++;
            workoutProgress.currentExercise = 0;
        } else {
            workoutProgress.completed = true;
            alert('🎉 تم إكمال جميع التمارين لهذا اليوم!');
            completeDay();
            return;
        }
    }

    saveWorkoutProgress();
    updateCurrentExerciseDisplay();
});

// حفظ حالة التمرين
function saveWorkoutProgress() {
    localStorage.setItem('workoutProgress', JSON.stringify(workoutProgress));
}

// إكمال يوم تدريب
function completeDay() {
    daysCompletedInStage++;
    localStorage.setItem('daysCompletedInStage', daysCompletedInStage);
    
    // التحقق من إكمال الشهر
    if (daysCompletedInStage >= 30 && currentStage < 3) {
        currentStage++;
        daysCompletedInStage = 0;
        localStorage.setItem('currentStage', currentStage);
        localStorage.setItem('daysCompletedInStage', daysCompletedInStage);
        alert(`✅ تهانينا! انتقلت إلى المرحلة ${currentStage} الجديدة!`);
    }

    // إعادة تعيين تقدم التمارين لليوم القادم
    workoutProgress = { currentExercise: 0, currentRound: 1, completed: false };
