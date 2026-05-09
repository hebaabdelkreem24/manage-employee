let employees = [];
let nextId = 1;
let editingId = null;

// ── Salary Calculation ──────────────────────────────────────
function calcSalary(emp) {
    const totalMonthlyHours = emp.dailyHours * emp.weeklyDays * emp.monthlyWeeks;
    const hourlyRate = emp.salary / totalMonthlyHours;
    const multiplier = emp.role === 'Salesman' ? 1.5 : emp.role === 'Admin' ? 2 : 1;
    const extraValue = emp.extraHours * hourlyRate * multiplier;
    const gross = emp.salary + emp.bonus - emp.penalties + extraValue;
    const taxes = gross * (emp.taxRate / 100);
    const net = gross - taxes;
    return {
        totalMonthlyHours: Math.round(totalMonthlyHours),
        hourlyRate: hourlyRate.toFixed(2),
        extraValue: extraValue.toFixed(2),
        gross: gross.toFixed(2),
        taxes: taxes.toFixed(2),
        net: net.toFixed(2),
    };
}

// ── Toast ───────────────────────────────────────────────────
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.className = `toast toast-${type} show`;
    const icons = { success: '✅', error: '⚠️', info: 'ℹ️' };
    toast.innerHTML = `${icons[type] || ''} ${message}`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── Add / Update ────────────────────────────────────────────
function addEmployee() {
    const name         = document.getElementById("empName").value.trim();
    const dept         = document.getElementById("empdept").value.trim();
    const role         = document.getElementById("empRole").value;
    const salary       = parseFloat(document.getElementById("empsalary").value) || 0;
    const dailyHours   = parseFloat(document.getElementById("dailyHours").value) || 8;
    const weeklyDays   = parseFloat(document.getElementById("weeklyDays").value) || 5;
    const monthlyWeeks = parseFloat(document.getElementById("monthlyWeeks").value) || 4;
    const extraHours   = parseFloat(document.getElementById("empExtra").value) || 0;
    const bonus        = parseFloat(document.getElementById("empBonus").value) || 0;
    const penalties    = parseFloat(document.getElementById("empPenalties").value) || 0;
    const taxRate      = parseFloat(document.getElementById("empTax").value) || 0;

    if (!name || !dept || !role || !salary) {
        showToast("Please fill in Name, Department, Role & Salary!", "error");
        return;
    }

    const data = { name, dept, role, salary, dailyHours, weeklyDays, monthlyWeeks, extraHours, bonus, penalties, taxRate };

    if (editingId !== null) {
        const idx = employees.findIndex(e => e.id === editingId);
        employees[idx] = { id: editingId, ...data };
        editingId = null;
        resetForm();
        showToast("Employee updated successfully!", "info");
    } else {
        employees.push({ id: nextId, ...data });
        nextId++;
        resetForm();
        showToast("Employee added successfully!");
    }

    saveToStorage();
    renderTable();
}

function resetForm() {
    ["empName","empdept","empsalary","empExtra","empBonus","empPenalties","empTax"].forEach(id => document.getElementById(id).value = "");
    document.getElementById("empRole").value = "";
    document.getElementById("dailyHours").value = 8;
    document.getElementById("weeklyDays").value = 5;
    document.getElementById("monthlyWeeks").value = 4;
    document.getElementById("btnText").textContent = "Add Employee";
    document.getElementById("btnIcon").textContent = "➕";
    document.getElementById("formTitle").textContent = "Add Employee";
    document.getElementById("cancelBtn").classList.add("hidden");
}

function cancelEdit() { editingId = null; resetForm(); }

// ── Avatar ──────────────────────────────────────────────────
function getAvatarColor(name) {
    const colors = [
        'from-amber-400 to-orange-500','from-emerald-400 to-teal-500',
        'from-blue-400 to-indigo-500','from-pink-400 to-rose-500',
        'from-purple-400 to-violet-500','from-cyan-400 to-sky-500'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}
function getInitials(name) { return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2); }

// ── Render ──────────────────────────────────────────────────
function renderTable() {
    const tbody      = document.getElementById("tableBody");
    const mobileCards = document.getElementById("mobileCards");
    const search     = document.getElementById("searchInput").value.trim().toLowerCase();

    const filtered = employees.filter(e =>
        e.name.toLowerCase().includes(search) ||
        e.dept.toLowerCase().includes(search) ||
        e.role.toLowerCase().includes(search)
    );

    if (filtered.length === 0) {
        const emptyHTML = `
            <div class="empty-state">
                <div class="text-6xl mb-4 opacity-30">📭</div>
                <p class="text-lg font-semibold text-white/30">No employees found</p>
                <p class="text-sm text-white/20 mt-1">${employees.length === 0 ? 'Add your first employee using the form' : 'Try a different search term'}</p>
            </div>`;
        tbody.innerHTML = `<tr><td colspan="7">${emptyHTML}</td></tr>`;
        mobileCards.innerHTML = emptyHTML;
        updateStats([]);
        return;
    }

    tbody.innerHTML = filtered.map((emp, i) => {
        const av  = getAvatarColor(emp.name);
        const ini = getInitials(emp.name);
        const c   = calcSalary(emp);
        return `<tr class="border-b border-white/5" style="animation:fadeInUp 0.3s ease forwards;animation-delay:${i * 0.05}s;opacity:0">
            <td class="px-4 py-3.5"><span class="text-white/30 text-sm font-mono">#${emp.id}</span></td>
            <td class="px-4 py-3.5">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full bg-gradient-to-br ${av} flex items-center justify-center text-white text-xs font-bold shrink-0">${ini}</div>
                    <span class="font-semibold text-sm">${emp.name}</span>
                </div>
            </td>
            <td class="px-4 py-3.5"><span class="px-3 py-1 rounded-full bg-white/5 text-white/70 text-xs font-medium">${emp.dept}</span></td>
            <td class="px-4 py-3.5"><span class="role-badge role-${emp.role}">${emp.role}</span></td>
            <td class="px-4 py-3.5"><span class="text-white/60 text-sm">$${emp.salary.toLocaleString()}</span></td>
            <td class="px-4 py-3.5"><span class="text-emerald-400 font-bold text-sm">$${Number(c.net).toLocaleString()}</span></td>
            <td class="px-4 py-3.5 text-center">
                <div class="flex items-center justify-center gap-1.5">
                    <button class="btn-view" onclick="viewDetails(${emp.id})">📄 Details</button>
                    <button class="btn-edit" onclick="editEmployee(${emp.id})">✏️</button>
                    <button class="btn-delete" onclick="deleteEmployee(${emp.id})">🗑️</button>
                </div>
            </td>
        </tr>`;
    }).join("");

    mobileCards.innerHTML = filtered.map((emp, i) => {
        const av  = getAvatarColor(emp.name);
        const ini = getInitials(emp.name);
        const c   = calcSalary(emp);
        return `<div class="mobile-card" style="animation:fadeInUp 0.3s ease forwards;animation-delay:${i * 0.05}s;opacity:0">
            <div class="flex items-center gap-3 mb-3 pb-3 border-b border-white/10">
                <div class="w-10 h-10 rounded-full bg-gradient-to-br ${av} flex items-center justify-center text-white text-sm font-bold">${ini}</div>
                <div>
                    <div class="font-bold text-sm">${emp.name}</div>
                    <div class="text-white/40 text-xs">#${emp.id} · <span class="role-badge role-${emp.role}">${emp.role}</span></div>
                </div>
            </div>
            <div class="mobile-card-row"><span class="mobile-card-label">Department</span><span class="mobile-card-value">${emp.dept}</span></div>
            <div class="mobile-card-row"><span class="mobile-card-label">Basic Salary</span><span class="mobile-card-value text-white/60">$${emp.salary.toLocaleString()}</span></div>
            <div class="mobile-card-row"><span class="mobile-card-label">Net Salary</span><span class="mobile-card-value text-emerald-400">$${Number(c.net).toLocaleString()}</span></div>
            <div class="flex gap-2 mt-3 pt-3 border-t border-white/10">
                <button class="btn-view flex-1 justify-center" onclick="viewDetails(${emp.id})">📄 Details</button>
                <button class="btn-edit flex-1 justify-center" onclick="editEmployee(${emp.id})">✏️ Edit</button>
                <button class="btn-delete flex-1 justify-center" onclick="deleteEmployee(${emp.id})">🗑️ Del</button>
            </div>
        </div>`;
    }).join("");

    updateStats(filtered);
}

// ── Details Modal ───────────────────────────────────────────
function viewDetails(id) {
    const emp = employees.find(e => e.id === id);
    if (!emp) return;
    const c   = calcSalary(emp);
    const av  = getAvatarColor(emp.name);
    const ini = getInitials(emp.name);

    document.getElementById("modalAvatar").className = `w-12 h-12 rounded-full bg-gradient-to-br ${av} flex items-center justify-center text-white font-bold text-lg`;
    document.getElementById("modalAvatar").textContent = ini;
    document.getElementById("modalName").textContent = emp.name;
    document.getElementById("modalDept").textContent = `${emp.dept} · ${emp.role}`;

    document.getElementById("modalContent").innerHTML = `
        <div class="space-y-1 mb-4">
            <div class="salary-row"><span class="salary-label">Basic Salary</span><span class="salary-value">$${emp.salary.toLocaleString()}</span></div>
            <div class="salary-row"><span class="salary-label">Monthly Hours</span><span class="salary-value">${c.totalMonthlyHours} hrs</span></div>
            <div class="salary-row"><span class="salary-label">Hourly Rate</span><span class="salary-value">$${c.hourlyRate}/hr</span></div>
            <div class="salary-row"><span class="salary-label">Extra Hours (${emp.extraHours}h × ${emp.role === 'Salesman' ? '1.5×' : emp.role === 'Admin' ? '2×' : '1×'})</span><span class="salary-value text-amber-400">+$${Number(c.extraValue).toLocaleString()}</span></div>
            <div class="salary-row"><span class="salary-label">Bonus</span><span class="salary-value text-emerald-400">+$${emp.bonus.toLocaleString()}</span></div>
            <div class="salary-row"><span class="salary-label">Penalties</span><span class="salary-value text-red-400">-$${emp.penalties.toLocaleString()}</span></div>
        </div>
        <div class="bg-white/5 rounded-xl p-4 space-y-2">
            <div class="salary-row"><span class="salary-label font-semibold">Gross Salary</span><span class="salary-value text-lg">$${Number(c.gross).toLocaleString()}</span></div>
            <div class="salary-row"><span class="salary-label">Tax (${emp.taxRate}%)</span><span class="salary-value text-red-400">-$${Number(c.taxes).toLocaleString()}</span></div>
            <div class="flex justify-between items-center pt-2 border-t border-white/10">
                <span class="text-white font-bold text-base">Net Salary</span>
                <span class="text-emerald-400 font-extrabold text-2xl">$${Number(c.net).toLocaleString()}</span>
            </div>
        </div>`;

    document.getElementById("detailModal").classList.add("open");
}

function closeModal() { document.getElementById("detailModal").classList.remove("open"); }

document.getElementById("detailModal").addEventListener("click", e => {
    if (e.target === e.currentTarget) closeModal();
});

// ── Delete ──────────────────────────────────────────────────
function deleteEmployee(id) {
    const emp = employees.find(e => e.id === id);
    if (confirm(`Delete "${emp.name}"?`)) {
        employees.splice(employees.findIndex(e => e.id === id), 1);
        saveToStorage();
        renderTable();
        showToast("Employee deleted!", "error");
    }
}

// ── Edit ────────────────────────────────────────────────────
function editEmployee(id) {
    const emp = employees.find(e => e.id === id);
    document.getElementById("empName").value        = emp.name;
    document.getElementById("empdept").value        = emp.dept;
    document.getElementById("empRole").value        = emp.role;
    document.getElementById("empsalary").value      = emp.salary;
    document.getElementById("dailyHours").value     = emp.dailyHours;
    document.getElementById("weeklyDays").value     = emp.weeklyDays;
    document.getElementById("monthlyWeeks").value   = emp.monthlyWeeks;
    document.getElementById("empExtra").value       = emp.extraHours;
    document.getElementById("empBonus").value       = emp.bonus;
    document.getElementById("empPenalties").value   = emp.penalties;
    document.getElementById("empTax").value         = emp.taxRate;

    editingId = id;
    document.getElementById("btnText").textContent = "Save Changes";
    document.getElementById("btnIcon").textContent = "💾";
    document.getElementById("formTitle").textContent = "Edit Employee";
    document.getElementById("cancelBtn").classList.remove("hidden");
    document.getElementById("formsection").scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Storage ─────────────────────────────────────────────────
function saveToStorage() {
    localStorage.setItem("employees_v2", JSON.stringify({ employees, nextId }));
}
function loadFromStorage() {
    const data = localStorage.getItem("employees_v2");
    if (data) { const parsed = JSON.parse(data); employees = parsed.employees; nextId = parsed.nextId; }
    renderTable();
}

// ── Stats ───────────────────────────────────────────────────
function updateStats(data) {
    const nets  = data.map(e => parseFloat(calcSalary(e).net));
    const total = nets.reduce((s, v) => s + v, 0);
    const avg   = data.length > 0 ? Math.round(total / data.length) : 0;
    animateNumber("statCount", data.length);
    document.getElementById("statTotal").textContent = "$" + Math.round(total).toLocaleString();
    document.getElementById("statAvg").textContent   = "$" + avg.toLocaleString();
}

function animateNumber(id, target) {
    const el      = document.getElementById(id);
    const current = parseInt(el.textContent) || 0;
    if (current === target) { el.textContent = target; return; }
    const diff = target - current, steps = 15;
    let step = 0;
    const timer = setInterval(() => {
        step++;
        el.textContent = Math.round(current + (diff * step / steps));
        if (step >= steps) { el.textContent = target; clearInterval(timer); }
    }, 20);
}

// ── Keyboard ────────────────────────────────────────────────
document.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        const a = document.activeElement;
        if (a && ['empName','empdept','empsalary','empExtra','empBonus','empPenalties','empTax'].includes(a.id)) addEmployee();
    }
    if (e.key === 'Escape') closeModal();
});

// ── Init ─────────────────────────────────────────────────────
loadFromStorage();
