/**
 * FitLife Tracker — Main App Logic
 */

let currentUser = null;
let weeklyChart = null;
let weightChart = null;
let timerInterval = null;
let timerSeconds = 0;
let timerRunning = false;

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    const token = getToken();
    if (token) {
        initApp();
    } else {
        showPage('page-login');
    }
    setupForms();
    setupFilters();
});

async function initApp() {
    try {
        currentUser = await API.get('/auth/me');
        document.getElementById('nav-username').textContent = currentUser.full_name;
        document.getElementById('app-layout').classList.remove('hidden');
        document.getElementById('page-login').classList.remove('active');
        document.getElementById('page-register').classList.remove('active');
        navigate('dashboard');
    } catch (e) {
        removeToken();
        showPage('page-login');
    }
}

// ==================== PAGE NAVIGATION ====================
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const page = document.getElementById(pageId);
    if (page) page.classList.add('active');
    document.getElementById('app-layout').classList.add('hidden');
}

function navigate(page) {
    // Hide all content pages
    document.querySelectorAll('.content-page').forEach(p => p.classList.add('hidden'));
    // Show selected
    const content = document.getElementById(`content-${page}`);
    if (content) {
        content.classList.remove('hidden');
    }
    // Update nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.nav === page);
    });
    // Close mobile sidebar
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.add('-translate-x-full');
    document.getElementById('sidebar-backdrop').classList.add('hidden');

    // Load page data
    switch (page) {
        case 'dashboard': loadDashboard(); break;
        case 'today': loadToday(); break;
        case 'exercises': loadExercises(); break;
        case 'plans': loadPlans(); break;
        case 'history': loadHistory(); break;
        case 'weight': loadWeight(); break;
        case 'profile': loadProfile(); break;
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    sidebar.classList.toggle('-translate-x-full');
    backdrop.classList.toggle('hidden');
}

// ==================== TOAST NOTIFICATION ====================
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500',
        warning: 'bg-yellow-500 text-gray-900'
    };
    const toast = document.createElement('div');
    toast.className = `toast ${colors[type] || colors.success} text-white px-4 py-3 rounded-lg shadow-lg text-sm`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ==================== AUTH FORMS ====================
function setupForms() {
    // Login
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const data = await API.post('/auth/login', {
                email: document.getElementById('login-email').value,
                password: document.getElementById('login-password').value
            });
            setToken(data.token);
            showToast('เข้าสู่ระบบสำเร็จ! 🎉');
            initApp();
        } catch (err) {
            showToast(err.message, 'error');
        }
    });

    // Register
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const data = await API.post('/auth/register', {
                email: document.getElementById('reg-email').value,
                password: document.getElementById('reg-password').value,
                full_name: document.getElementById('reg-name').value,
                gender: document.getElementById('reg-gender').value,
                birth_date: document.getElementById('reg-birthdate').value || null,
                height_cm: parseFloat(document.getElementById('reg-height').value) || null,
                weight_kg: parseFloat(document.getElementById('reg-weight').value) || null,
                fitness_goal: document.getElementById('reg-goal').value
            });
            setToken(data.token);
            showToast('สมัครสมาชิกสำเร็จ! 🎉');
            initApp();
        } catch (err) {
            showToast(err.message, 'error');
        }
    });

    // Profile
    document.getElementById('profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await API.put('/auth/profile', {
                full_name: document.getElementById('prof-name').value,
                gender: document.getElementById('prof-gender').value,
                birth_date: document.getElementById('prof-birthdate').value || null,
                height_cm: parseFloat(document.getElementById('prof-height').value) || null,
                weight_kg: parseFloat(document.getElementById('prof-weight').value) || null,
                fitness_goal: document.getElementById('prof-goal').value,
                activity_level: document.getElementById('prof-activity').value
            });
            currentUser = await API.get('/auth/me');
            document.getElementById('nav-username').textContent = currentUser.full_name;
            showToast('อัปเดตโปรไฟล์สำเร็จ!');
        } catch (err) {
            showToast(err.message, 'error');
        }
    });

    // Weight
    document.getElementById('weight-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const result = await API.post('/weight', {
                weight_kg: parseFloat(document.getElementById('wt-kg').value),
                log_date: document.getElementById('wt-date').value || undefined,
                notes: document.getElementById('wt-notes').value || undefined
            });
            showToast('บันทึกน้ำหนักสำเร็จ!');

            const bmiDiv = document.getElementById('weight-bmi-result');
            if (result.bmi) {
                bmiDiv.classList.remove('hidden');
                bmiDiv.innerHTML = `
                    <div class="text-center">
                        <div class="text-2xl font-bold" style="color: ${result.bmi_category?.color || '#333'}">${result.bmi}</div>
                        <div class="text-sm text-gray-600">BMI — ${result.bmi_category?.label || ''}</div>
                    </div>`;
            }
            loadWeight();
        } catch (err) {
            showToast(err.message, 'error');
        }
    });

    // Create Plan
    document.getElementById('create-plan-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            const days = daysOfWeek.map(d => ({ day_of_week: d, is_rest_day: false, exercises: [] }));

            await API.post('/plans', {
                name: document.getElementById('cp-name').value,
                description: document.getElementById('cp-desc').value || null,
                goal: document.getElementById('cp-goal').value,
                difficulty: document.getElementById('cp-diff').value,
                days
            });
            showToast('สร้างแผนสำเร็จ! 📋');
            closeCreatePlanModal();
            loadPlans();
        } catch (err) {
            showToast(err.message, 'error');
        }
    });

    // Set default date for weight
    document.getElementById('wt-date').value = new Date().toISOString().slice(0, 10);
}

// ==================== EXERCISES FILTER ====================
function setupFilters() {
    document.getElementById('ex-search').addEventListener('input', debounce(loadExercises, 300));
    document.getElementById('ex-category').addEventListener('change', loadExercises);
    document.getElementById('ex-difficulty').addEventListener('change', loadExercises);
}

function debounce(fn, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// ==================== DASHBOARD ====================
async function loadDashboard() {
    try {
        const [summary, weeklyStats, achievements] = await Promise.all([
            API.get('/dashboard/summary'),
            API.get('/dashboard/weekly-stats'),
            API.get('/dashboard/achievements')
        ]);

        // Cards
        document.getElementById('dash-calories').textContent = summary.today.calories_burned;
        document.getElementById('dash-exercises').textContent = `${summary.today.exercises_done}/${summary.today.total_exercises}`;
        document.getElementById('dash-streak').textContent = summary.streak;

        if (summary.weight.kg) {
            document.getElementById('dash-weight').textContent = `${summary.weight.kg} kg`;
            document.getElementById('dash-bmi').textContent = summary.weight.bmi
                ? `BMI: ${summary.weight.bmi} (${summary.weight.bmi_category?.label || ''})`
                : 'BMI: -';
        }

        // Body info
        const bodyInfo = document.getElementById('dash-body-info');
        const infoItems = [];
        if (summary.bmr) infoItems.push(`BMR: ${summary.bmr} kcal/วัน`);
        if (summary.tdee) infoItems.push(`TDEE: ${summary.tdee} kcal/วัน`);
        infoItems.push(`สัปดาห์นี้: ${summary.week_calories} kcal`);
        infoItems.push(`ออกกำลังกายทั้งหมด: ${summary.total_workout_days} วัน`);
        bodyInfo.innerHTML = infoItems.map(i => `<p>${i}</p>`).join('');

        // Achievements
        const earnedAch = achievements.filter(a => a.earned);
        const achDiv = document.getElementById('dash-achievements');
        if (earnedAch.length > 0) {
            achDiv.innerHTML = earnedAch.map(a =>
                `<span class="inline-flex items-center gap-1 bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-1 rounded-full text-sm">
                    ${a.icon} ${a.name}
                </span>`
            ).join('');
        } else {
            achDiv.innerHTML = '<span class="text-gray-400 text-sm">ยังไม่มีรางวัล — ออกกำลังกายเพื่อรับรางวัล!</span>';
        }

        // Weekly Chart
        renderWeeklyChart(weeklyStats);

    } catch (err) {
        showToast(err.message, 'error');
    }
}

function renderWeeklyChart(data) {
    const ctx = document.getElementById('weekly-chart')?.getContext('2d');
    if (!ctx) return;

    // Fill 7 days
    const labels = [];
    const values = [];
    const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        labels.push(dayNames[d.getDay()]);
        const found = data.find(r => {
            const rd = r.workout_date instanceof Date ? r.workout_date.toISOString().slice(0, 10) : String(r.workout_date).slice(0, 10);
            return rd === dateStr;
        });
        values.push(found ? Math.round(found.calories) : 0);
    }

    if (weeklyChart) weeklyChart.destroy();
    weeklyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'แคลอรี่',
                data: values,
                backgroundColor: 'rgba(99, 102, 241, 0.7)',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { callback: v => v + ' kcal' } } }
        }
    });
}

// ==================== TODAY'S WORKOUT ====================
async function loadToday() {
    try {
        const data = await API.get('/workouts/today');
        const container = document.getElementById('today-exercises');

        if (!data.plan || data.is_rest_day) {
            const msg = data.is_rest_day ? 'วันนี้เป็นวันพัก 🛌 พักผ่อนให้ดี!' : 'ยังไม่มีแผนที่ใช้งาน';
            container.innerHTML = `
                <div class="text-center py-12 text-gray-400">
                    <div class="text-5xl mb-3">${data.is_rest_day ? '🛌' : '📋'}</div>
                    <p class="text-lg">${msg}</p>
                    ${!data.plan ? '<button onclick="navigate(\'plans\')" class="mt-3 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">ไปเลือกแผน →</button>' : ''}
                </div>`;
            return;
        }

        document.getElementById('today-plan-name').textContent = `แผน: ${data.plan.name} — ${translateDay(data.day_of_week)}`;

        // Summary
        const summary = data.summary;
        document.getElementById('today-progress-text').textContent = `${summary.progress_percent}%`;
        document.getElementById('today-progress-bar').style.width = `${summary.progress_percent}%`;
        document.getElementById('today-cal-burned').textContent = summary.total_burned_calories;
        document.getElementById('today-cal-target').textContent = summary.total_estimated_calories;

        // Exercises
        container.innerHTML = data.exercises.map((ex, i) => `
            <div class="exercise-card bg-white rounded-xl shadow-sm p-4 border-l-4 ${ex.is_completed ? 'border-green-500 bg-green-50' : 'border-gray-300'}">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full flex items-center justify-center text-lg ${ex.is_completed ? 'checkbox-done text-white' : 'bg-gray-100 text-gray-500'}">
                            ${ex.is_completed ? '✓' : i + 1}
                        </div>
                        <div>
                            <h4 class="font-semibold text-gray-800">${ex.category_icon} ${ex.exercise_name}</h4>
                            <p class="text-xs text-gray-500">${ex.muscle_group || ''} • ${ex.difficulty}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-sm font-bold ${ex.is_completed ? 'text-green-600' : 'text-orange-500'}">
                            🔥 ${ex.is_completed ? Math.round(ex.actual_calories) : ex.estimated_calories} kcal
                        </div>
                        <div class="text-xs text-gray-400">
                            ${ex.duration_minutes ? ex.duration_minutes + ' นาที' : ex.sets + '×' + ex.reps}
                        </div>
                    </div>
                </div>
                ${!ex.is_completed ? `
                <div class="mt-3 pt-3 border-t flex items-center gap-2">
                    ${!ex.duration_minutes ? `
                        <input type="number" id="sets-${ex.id}" value="${ex.sets}" min="1" class="w-16 px-2 py-1 rounded border text-sm text-center" placeholder="Sets">
                        <span class="text-gray-400">×</span>
                        <input type="number" id="reps-${ex.id}" value="${ex.reps}" min="1" class="w-16 px-2 py-1 rounded border text-sm text-center" placeholder="Reps">
                    ` : `
                        <input type="number" id="dur-${ex.id}" value="${ex.duration_minutes}" min="1" class="w-20 px-2 py-1 rounded border text-sm text-center" placeholder="นาที">
                        <span class="text-xs text-gray-400">นาที</span>
                    `}
                    <button onclick="completeExercise(${ex.id}, ${ex.exercise_id}, ${!ex.duration_minutes})"
                            class="ml-auto bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-green-700 transition">
                        ✅ เสร็จ
                    </button>
                </div>` : `
                <div class="mt-2 flex items-center justify-between">
                    <span class="text-xs text-green-600 font-medium">✅ Completed — ${ex.actual_sets || ''}${ex.actual_sets ? '×' : ''}${ex.actual_reps || ''} ${ex.actual_duration ? Math.round(ex.actual_duration) + ' นาที' : ''}</span>
                    <button onclick="uncompleteExercise(${ex.id})" class="text-xs text-gray-400 hover:text-red-500">↩️ ยกเลิก</button>
                </div>`}
            </div>
        `).join('');

    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function completeExercise(planExId, exerciseId, isReps) {
    try {
        const body = {
            plan_exercise_id: planExId,
            exercise_id: exerciseId
        };

        if (isReps) {
            body.sets_completed = parseInt(document.getElementById(`sets-${planExId}`)?.value) || 3;
            body.reps_completed = parseInt(document.getElementById(`reps-${planExId}`)?.value) || 10;
        } else {
            body.duration_minutes = parseInt(document.getElementById(`dur-${planExId}`)?.value) || 10;
        }

        const result = await API.post('/workouts/complete', body);
        showToast(`${result.message} 🔥 ${result.calories_burned} kcal`);
        loadToday();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function uncompleteExercise(planExId) {
    try {
        await API.post('/workouts/uncomplete', { plan_exercise_id: planExId });
        showToast('ยกเลิกแล้ว', 'info');
        loadToday();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function translateDay(day) {
    const map = {
        monday: 'วันจันทร์', tuesday: 'วันอังคาร', wednesday: 'วันพุธ',
        thursday: 'วันพฤหัสบดี', friday: 'วันศุกร์', saturday: 'วันเสาร์', sunday: 'วันอาทิตย์'
    };
    return map[day] || day;
}

// ==================== TIMER ====================
function startTimer() {
    if (timerRunning) return;
    timerRunning = true;
    timerInterval = setInterval(() => {
        timerSeconds++;
        const min = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
        const sec = String(timerSeconds % 60).padStart(2, '0');
        document.getElementById('timer-display').textContent = `${min}:${sec}`;
    }, 1000);
}

function pauseTimer() {
    timerRunning = false;
    clearInterval(timerInterval);
}

function resetTimer() {
    pauseTimer();
    timerSeconds = 0;
    document.getElementById('timer-display').textContent = '00:00';
}

// ==================== EXERCISES ====================
async function loadExercises() {
    try {
        const search = document.getElementById('ex-search')?.value || '';
        const category = document.getElementById('ex-category')?.value || '';
        const difficulty = document.getElementById('ex-difficulty')?.value || '';

        let url = '/exercises?';
        if (search) url += `search=${encodeURIComponent(search)}&`;
        if (category) url += `category=${encodeURIComponent(category)}&`;
        if (difficulty) url += `difficulty=${difficulty}&`;

        const exercises = await API.get(url);

        // Load categories for filter if empty
        const catSelect = document.getElementById('ex-category');
        if (catSelect.options.length <= 1) {
            const cats = await API.get('/exercises/categories');
            cats.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.name;
                opt.textContent = `${c.icon} ${c.name}`;
                catSelect.appendChild(opt);
            });
        }

        const container = document.getElementById('exercises-list');
        if (exercises.length === 0) {
            container.innerHTML = '<p class="text-gray-400 col-span-full text-center py-8">ไม่พบท่าออกกำลังกาย</p>';
            return;
        }

        container.innerHTML = exercises.map(ex => `
            <div class="exercise-card bg-white rounded-xl shadow-sm p-4 cursor-pointer">
                <div class="flex items-center gap-2 mb-2">
                    <span class="text-lg">${ex.category_icon}</span>
                    <span class="text-xs px-2 py-0.5 rounded-full ${getDiffColor(ex.difficulty)}">${ex.difficulty}</span>
                </div>
                <h4 class="font-semibold text-gray-800 mb-1">${ex.name}</h4>
                <p class="text-xs text-gray-500 mb-2">${ex.muscle_group || ''}</p>
                <div class="flex items-center justify-between">
                    <span class="text-xs text-gray-400">${ex.category_name}</span>
                    <span class="text-xs font-bold text-orange-500">MET: ${ex.met_value}</span>
                </div>
                ${ex.equipment ? `<p class="text-xs text-gray-400 mt-1">🔧 ${ex.equipment}</p>` : ''}
            </div>
        `).join('');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function getDiffColor(diff) {
    switch (diff) {
        case 'beginner': return 'bg-green-100 text-green-700';
        case 'intermediate': return 'bg-yellow-100 text-yellow-700';
        case 'advanced': return 'bg-red-100 text-red-700';
        default: return 'bg-gray-100 text-gray-700';
    }
}

// ==================== PLANS ====================
async function loadPlans() {
    try {
        const [templates, myPlans] = await Promise.all([
            API.get('/plans/templates'),
            API.get('/plans')
        ]);

        // Templates
        const tplContainer = document.getElementById('plan-templates');
        tplContainer.innerHTML = templates.map(p => `
            <div class="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-sm p-4 border border-indigo-100">
                <h4 class="font-semibold text-gray-800 mb-1">${p.name}</h4>
                <p class="text-xs text-gray-500 mb-3 line-clamp-2">${p.description || ''}</p>
                <div class="flex items-center gap-2 mb-3">
                    <span class="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">${p.goal}</span>
                    <span class="text-xs px-2 py-0.5 rounded-full ${getDiffColor(p.difficulty)}">${p.difficulty}</span>
                </div>
                <div class="flex gap-2">
                    <button onclick="viewPlan(${p.id})" class="text-xs bg-white border px-3 py-1.5 rounded-lg hover:bg-gray-50">👁 ดูแผน</button>
                    <button onclick="clonePlan(${p.id})" class="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700">📋 ใช้แผนนี้</button>
                </div>
            </div>
        `).join('');

        // My Plans
        const myContainer = document.getElementById('my-plans');
        if (myPlans.length === 0) {
            myContainer.innerHTML = '<p class="text-gray-400 col-span-full text-center py-8">ยังไม่มีแผน — คัดลอกจาก Template หรือสร้างใหม่ได้เลย!</p>';
            return;
        }

        myContainer.innerHTML = myPlans.map(p => `
            <div class="bg-white rounded-xl shadow-sm p-4 ${p.is_active ? 'ring-2 ring-green-500' : ''}">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="font-semibold text-gray-800">${p.name}</h4>
                    ${p.is_active ? '<span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✅ Active</span>' : ''}
                </div>
                <p class="text-xs text-gray-500 mb-3 line-clamp-2">${p.description || 'ไม่มีคำอธิบาย'}</p>
                <div class="flex items-center gap-2 mb-3">
                    <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100">${p.goal}</span>
                    <span class="text-xs px-2 py-0.5 rounded-full ${getDiffColor(p.difficulty)}">${p.difficulty}</span>
                </div>
                <div class="flex gap-2">
                    <button onclick="viewPlan(${p.id})" class="text-xs bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200">👁 ดู</button>
                    ${!p.is_active ? `<button onclick="activatePlan(${p.id})" class="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">▶ ใช้แผนนี้</button>` : ''}
                    <button onclick="deletePlan(${p.id})" class="text-xs bg-red-100 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-200">🗑</button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// Cache for exercise list in picker
let _allExercises = null;

async function viewPlan(planId) {
    try {
        const plan = await API.get(`/plans/${planId}`);
        // Determine if the user owns this plan (not template)
        const isOwner = !plan.is_template && plan.user_id === currentUser?.id;
        window._currentViewPlanId = planId;
        window._currentViewPlanOwner = isOwner;

        document.getElementById('plan-modal-title').textContent = plan.name;

        const dayTH = { monday: 'จันทร์', tuesday: 'อังคาร', wednesday: 'พุธ', thursday: 'พฤหัสบดี', friday: 'ศุกร์', saturday: 'เสาร์', sunday: 'อาทิตย์' };

        let html = `<p class="text-sm text-gray-500 mb-2">${plan.description || ''}</p>`;
        html += `<div class="flex gap-2 mb-4">
            <span class="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">${plan.goal}</span>
            <span class="text-xs px-2 py-0.5 rounded-full ${getDiffColor(plan.difficulty)}">${plan.difficulty}</span>
        </div>`;

        if (plan.days && plan.days.length > 0) {
            plan.days.forEach(day => {
                const dayName = dayTH[day.day_of_week] || day.day_of_week;

                html += `<div class="mb-5 border rounded-xl p-3 ${day.is_rest_day ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'}">`;

                // Day header with rest day toggle
                html += `<div class="flex items-center justify-between mb-2">
                    <h4 class="font-semibold text-gray-700">${dayName}
                        ${day.is_rest_day ? ' <span class="text-xs text-gray-400">🛌 วันพัก</span>' : ''}
                    </h4>`;

                if (isOwner) {
                    html += `<label class="flex items-center gap-1.5 cursor-pointer text-xs text-gray-500">
                        <input type="checkbox" ${day.is_rest_day ? 'checked' : ''}
                               onchange="toggleRestDay(${planId}, ${day.id}, this.checked)"
                               class="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500">
                        วันพัก
                    </label>`;
                }
                html += '</div>';

                // Exercises list
                if (!day.is_rest_day) {
                    if (day.exercises && day.exercises.length > 0) {
                        html += '<div class="space-y-1.5">';
                        day.exercises.forEach(ex => {
                            html += `<div class="flex items-center justify-between bg-gray-50 p-2.5 rounded-lg text-sm group">
                                <div>
                                    <span>${ex.category_icon} ${ex.exercise_name}</span>
                                    <span class="text-gray-400 ml-1 text-xs">(${ex.muscle_group || ''})</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-gray-500 text-xs">${ex.duration_minutes ? ex.duration_minutes + ' นาที' : ex.sets + '×' + ex.reps}</span>
                                    ${isOwner ? `<button onclick="removeExerciseFromDay(${planId}, ${day.id}, ${ex.id})" class="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition text-xs" title="ลบท่านี้">✕</button>` : ''}
                                </div>
                            </div>`;
                        });
                        html += '</div>';
                    } else {
                        html += '<p class="text-xs text-gray-400 ml-1 mb-2">ยังไม่มีท่า</p>';
                    }

                    // Add exercise button (only for owner)
                    if (isOwner) {
                        html += `<div id="add-ex-area-${day.id}" class="mt-2">
                            <button onclick="showExercisePicker(${planId}, ${day.id})"
                                    class="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                                <span class="text-lg leading-none">+</span> เพิ่มท่า
                            </button>
                        </div>`;
                    }
                }

                html += '</div>'; // end day card
            });
        }

        document.getElementById('plan-modal-body').innerHTML = html;
        document.getElementById('plan-modal').classList.remove('hidden');
        document.getElementById('plan-modal').classList.add('flex');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// ------ Exercise Picker ------
async function showExercisePicker(planId, dayId) {
    const area = document.getElementById(`add-ex-area-${dayId}`);
    if (!area) return;

    // Check if picker is already open
    if (area.querySelector('.exercise-picker')) {
        area.querySelector('.exercise-picker').remove();
        return;
    }

    // Load exercises list (cache)
    if (!_allExercises) {
        try {
            _allExercises = await API.get('/exercises?limit=200');
        } catch (err) {
            showToast('โหลดรายการท่าไม่ได้', 'error');
            return;
        }
    }

    const exercises = _allExercises;

    // Group by category
    const categories = {};
    exercises.forEach(ex => {
        if (!categories[ex.category_name]) categories[ex.category_name] = [];
        categories[ex.category_name].push(ex);
    });

    let pickerHtml = `<div class="exercise-picker bg-indigo-50 border border-indigo-200 rounded-xl p-3 mt-2 space-y-3">
        <div class="flex items-center justify-between">
            <span class="text-sm font-semibold text-indigo-700">เลือกท่าออกกำลังกาย</span>
            <button onclick="this.closest('.exercise-picker').remove()" class="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
        </div>

        <!-- Search -->
        <input type="text" placeholder="🔍 ค้นหาท่า..."
               oninput="filterExercisePicker(this, ${dayId})"
               class="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:border-indigo-500">

        <!-- Exercise list -->
        <div id="picker-list-${dayId}" class="max-h-48 overflow-y-auto space-y-1">`;

    Object.entries(categories).forEach(([catName, exList]) => {
        pickerHtml += `<div class="picker-category" data-cat="${catName}">
            <div class="text-xs font-semibold text-gray-500 py-1 sticky top-0 bg-indigo-50">${catName}</div>`;
        exList.forEach(ex => {
            pickerHtml += `<div class="picker-item flex items-center justify-between bg-white hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg cursor-pointer transition text-sm"
                                data-name="${ex.name.toLowerCase()}"
                                onclick="selectExerciseForDay(${planId}, ${dayId}, ${ex.id}, this)">
                <span>${ex.category_icon || ''} ${ex.name}</span>
                <span class="text-xs text-gray-400">${ex.difficulty}</span>
            </div>`;
        });
        pickerHtml += '</div>';
    });

    pickerHtml += `</div>

        <!-- Sets / Reps / Duration -->
        <div id="picker-config-${dayId}" class="hidden">
            <div class="bg-white rounded-lg p-3 border border-indigo-200 space-y-2">
                <div class="flex items-center gap-2 text-sm">
                    <span id="picker-selected-name-${dayId}" class="font-medium text-indigo-700"></span>
                </div>
                <div class="grid grid-cols-3 gap-2">
                    <div>
                        <label class="text-xs text-gray-500">เซ็ต</label>
                        <input type="number" id="picker-sets-${dayId}" value="3" min="1" max="20"
                               class="w-full px-2 py-1.5 border rounded-lg text-sm text-center outline-none">
                    </div>
                    <div>
                        <label class="text-xs text-gray-500">ครั้ง</label>
                        <input type="number" id="picker-reps-${dayId}" value="10" min="1" max="100"
                               class="w-full px-2 py-1.5 border rounded-lg text-sm text-center outline-none">
                    </div>
                    <div>
                        <label class="text-xs text-gray-500">นาที (ถ้ามี)</label>
                        <input type="number" id="picker-duration-${dayId}" placeholder="-" min="1" max="120"
                               class="w-full px-2 py-1.5 border rounded-lg text-sm text-center outline-none">
                    </div>
                </div>
                <button onclick="confirmAddExercise(${planId}, ${dayId})"
                        class="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition">
                    ✓ เพิ่มท่านี้
                </button>
            </div>
        </div>
    </div>`;

    area.insertAdjacentHTML('beforeend', pickerHtml);
}

function filterExercisePicker(input, dayId) {
    const query = input.value.toLowerCase();
    const container = document.getElementById(`picker-list-${dayId}`);
    if (!container) return;
    container.querySelectorAll('.picker-item').forEach(item => {
        item.style.display = item.dataset.name.includes(query) ? '' : 'none';
    });
    // Hide empty categories
    container.querySelectorAll('.picker-category').forEach(cat => {
        const visibleItems = cat.querySelectorAll('.picker-item:not([style*="display: none"])');
        cat.style.display = visibleItems.length > 0 ? '' : 'none';
    });
}

let _selectedExerciseId = {};

function selectExerciseForDay(planId, dayId, exerciseId, el) {
    _selectedExerciseId[dayId] = exerciseId;

    // Highlight selected
    const picker = el.closest('.exercise-picker');
    picker.querySelectorAll('.picker-item').forEach(item => item.classList.remove('ring-2', 'ring-indigo-500'));
    el.classList.add('ring-2', 'ring-indigo-500');

    // Show config area
    const config = document.getElementById(`picker-config-${dayId}`);
    config.classList.remove('hidden');
    document.getElementById(`picker-selected-name-${dayId}`).textContent = el.querySelector('span').textContent;
}

async function confirmAddExercise(planId, dayId) {
    const exerciseId = _selectedExerciseId[dayId];
    if (!exerciseId) {
        showToast('กรุณาเลือกท่าก่อน', 'error');
        return;
    }

    const sets = parseInt(document.getElementById(`picker-sets-${dayId}`).value) || 3;
    const reps = parseInt(document.getElementById(`picker-reps-${dayId}`).value) || 10;
    const durationEl = document.getElementById(`picker-duration-${dayId}`);
    const duration_minutes = durationEl.value ? parseInt(durationEl.value) : null;

    try {
        await API.post(`/plans/${planId}/days/${dayId}/exercises`, {
            exercise_id: exerciseId,
            sets,
            reps,
            duration_minutes
        });
        showToast('เพิ่มท่าสำเร็จ! 💪');
        _allExercises = null; // clear cache to refresh
        viewPlan(planId); // reload plan view
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function removeExerciseFromDay(planId, dayId, exerciseRowId) {
    if (!confirm('ต้องการลบท่านี้ออกจากแผน?')) return;
    try {
        await API.delete(`/plans/${planId}/days/${dayId}/exercises/${exerciseRowId}`);
        showToast('ลบท่าแล้ว', 'info');
        viewPlan(planId); // reload
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function toggleRestDay(planId, dayId, isRest) {
    try {
        await API.put(`/plans/${planId}/days/${dayId}`, { is_rest_day: isRest });
        showToast(isRest ? 'ตั้งเป็นวันพักแล้ว 🛌' : 'ยกเลิกวันพักแล้ว', 'info');
        viewPlan(planId); // reload
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function closePlanModal() {
    document.getElementById('plan-modal').classList.add('hidden');
    document.getElementById('plan-modal').classList.remove('flex');
}

async function clonePlan(templateId) {
    try {
        await API.post(`/plans/${templateId}/clone`);
        showToast('คัดลอกแผนสำเร็จ! 📋');
        loadPlans();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function activatePlan(planId) {
    try {
        await API.post(`/plans/${planId}/activate`);
        showToast('เปิดใช้แผนสำเร็จ! ▶');
        loadPlans();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function deletePlan(planId) {
    if (!confirm('ต้องการลบแผนนี้?')) return;
    try {
        await API.delete(`/plans/${planId}`);
        showToast('ลบแผนแล้ว', 'info');
        loadPlans();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function showCreatePlanModal() {
    document.getElementById('create-plan-modal').classList.remove('hidden');
    document.getElementById('create-plan-modal').classList.add('flex');
}

function closeCreatePlanModal() {
    document.getElementById('create-plan-modal').classList.add('hidden');
    document.getElementById('create-plan-modal').classList.remove('flex');
}

// ==================== HISTORY ====================
async function loadHistory() {
    try {
        const from = document.getElementById('hist-from')?.value || '';
        const to = document.getElementById('hist-to')?.value || '';
        let url = '/workouts/history?';
        if (from) url += `from=${from}&`;
        if (to) url += `to=${to}&`;

        const data = await API.get(url);
        const container = document.getElementById('history-list');

        if (data.length === 0) {
            container.innerHTML = '<p class="text-gray-400 text-center py-8">ยังไม่มีประวัติ</p>';
            return;
        }

        container.innerHTML = data.map(day => `
            <div class="bg-white rounded-xl shadow-sm p-4">
                <div class="flex items-center justify-between mb-3">
                    <h4 class="font-semibold text-gray-800">📅 ${formatDate(day.date)}</h4>
                    <div class="text-right">
                        <span class="text-sm font-bold text-orange-500">🔥 ${Math.round(day.total_calories)} kcal</span>
                        <span class="text-xs text-gray-400 ml-2">${day.completed_count} ท่า</span>
                    </div>
                </div>
                <div class="space-y-1">
                    ${day.exercises.map(ex => `
                        <div class="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                            <span>${ex.category_icon} ${ex.exercise_name}</span>
                            <span class="text-gray-500">${Math.round(ex.calories_burned)} kcal</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    return `วัน${dayNames[d.getDay()]}ที่ ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}

// ==================== WEIGHT ====================
async function loadWeight() {
    try {
        const history = await API.get('/weight');

        // Render chart
        renderWeightChart(history);

        // Render table
        const table = document.getElementById('weight-history-table');
        if (history.length === 0) {
            table.innerHTML = '<p class="text-gray-400 text-center text-sm py-4">ยังไม่มีข้อมูล</p>';
            return;
        }

        table.innerHTML = `
            <table class="w-full text-sm">
                <thead><tr class="text-gray-500 border-b">
                    <th class="py-1 text-left">วันที่</th>
                    <th class="py-1 text-right">น้ำหนัก</th>
                    <th class="py-1 text-right">BMI</th>
                </tr></thead>
                <tbody>
                    ${history.slice(0, 30).map(w => `
                        <tr class="border-b border-gray-100">
                            <td class="py-1">${formatDate(w.log_date)}</td>
                            <td class="py-1 text-right font-medium">${w.weight_kg} kg</td>
                            <td class="py-1 text-right">${w.bmi || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`;
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function renderWeightChart(data) {
    const ctx = document.getElementById('weight-chart')?.getContext('2d');
    if (!ctx) return;

    const sorted = [...data].reverse().slice(-30);
    const labels = sorted.map(w => {
        const d = new Date(w.log_date);
        return `${d.getDate()}/${d.getMonth() + 1}`;
    });
    const values = sorted.map(w => parseFloat(w.weight_kg));

    if (weightChart) weightChart.destroy();
    weightChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'น้ำหนัก (kg)',
                data: values,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99,102,241,0.1)',
                fill: true,
                tension: 0.3,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: false } }
        }
    });
}

// ==================== PROFILE ====================
async function loadProfile() {
    if (!currentUser) return;
    document.getElementById('prof-name').value = currentUser.full_name || '';
    document.getElementById('prof-gender').value = currentUser.gender || 'M';
    document.getElementById('prof-birthdate').value = currentUser.birth_date ? currentUser.birth_date.slice(0, 10) : '';
    document.getElementById('prof-height').value = currentUser.height_cm || '';
    document.getElementById('prof-weight').value = currentUser.weight_kg || '';
    document.getElementById('prof-goal').value = currentUser.fitness_goal || 'maintain';
    document.getElementById('prof-activity').value = currentUser.activity_level || 'moderate';
}

// ==================== LOGOUT ====================
function logout() {
    removeToken();
    currentUser = null;
    document.getElementById('app-layout').classList.add('hidden');
    showPage('page-login');
    showToast('ออกจากระบบแล้ว', 'info');
}
