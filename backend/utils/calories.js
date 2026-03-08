/**
 * Calorie Calculation Utilities
 * สูตรคำนวณแคลอรี่, BMR, TDEE, BMI
 */

// BMR (Basal Metabolic Rate) - Harris-Benedict Equation
function calculateBMR(gender, weightKg, heightCm, age) {
    if (gender === 'M') {
        return 88.362 + (13.397 * weightKg) + (4.799 * heightCm) - (5.677 * age);
    } else {
        return 447.593 + (9.247 * weightKg) + (3.098 * heightCm) - (4.330 * age);
    }
}

// TDEE (Total Daily Energy Expenditure)
function calculateTDEE(bmr, activityLevel) {
    const factors = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9
    };
    return bmr * (factors[activityLevel] || 1.55);
}

// Exercise Calories: MET × Weight(kg) × Duration(hours)
function calculateExerciseCalories(metValue, weightKg, durationMinutes) {
    const durationHours = durationMinutes / 60;
    return Math.round(metValue * weightKg * durationHours * 100) / 100;
}

// BMI (Body Mass Index)
function calculateBMI(weightKg, heightCm) {
    const heightM = heightCm / 100;
    return Math.round((weightKg / (heightM * heightM)) * 100) / 100;
}

// BMI Category (มาตรฐานเอเชีย)
function getBMICategory(bmi) {
    if (bmi < 18.5) return { category: 'Underweight', label: 'น้ำหนักต่ำกว่าเกณฑ์', color: '#3498db' };
    if (bmi < 23.0) return { category: 'Normal', label: 'ปกติ', color: '#2ecc71' };
    if (bmi < 25.0) return { category: 'Overweight', label: 'เริ่มอ้วน', color: '#f39c12' };
    if (bmi < 30.0) return { category: 'Obese I', label: 'อ้วน', color: '#e74c3c' };
    return { category: 'Obese II+', label: 'อ้วนมาก', color: '#c0392b' };
}

// Calculate age from birth date
function calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

// Estimate duration for rep-based exercises (if no duration given)
// Rough: 1 rep ≈ 3-4 seconds, so sets×reps×3.5/60 = minutes
function estimateDuration(sets, reps, restSeconds) {
    const repTime = 3.5; // seconds per rep
    const exerciseTime = sets * reps * repTime;
    const restTime = (sets - 1) * (restSeconds || 60);
    return (exerciseTime + restTime) / 60; // minutes
}

module.exports = {
    calculateBMR,
    calculateTDEE,
    calculateExerciseCalories,
    calculateBMI,
    getBMICategory,
    calculateAge,
    estimateDuration
};
