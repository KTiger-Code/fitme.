-- ============================================================================
-- FitLife Tracker - Database Schema
-- MySQL 8.0
-- ============================================================================

CREATE DATABASE IF NOT EXISTS fitlife_tracker
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE fitlife_tracker;

-- ============================================================================
-- 1. users (ข้อมูลสมาชิก)
-- ============================================================================
CREATE TABLE users (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(100) NOT NULL,
    gender          ENUM('M', 'F') DEFAULT NULL,
    birth_date      DATE DEFAULT NULL,
    height_cm       DECIMAL(5,2) DEFAULT NULL,
    weight_kg       DECIMAL(5,2) DEFAULT NULL,
    fitness_goal    ENUM('lose', 'gain', 'maintain') DEFAULT 'maintain',
    activity_level  ENUM('sedentary', 'light', 'moderate', 'active', 'very_active') DEFAULT 'moderate',
    profile_image   VARCHAR(500) DEFAULT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================================
-- 2. exercise_categories (หมวดหมู่ท่าออกกำลังกาย)
-- ============================================================================
CREATE TABLE exercise_categories (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(50) NOT NULL UNIQUE,
    description     TEXT,
    icon            VARCHAR(50) DEFAULT NULL
);

-- ============================================================================
-- 3. exercises (ท่าออกกำลังกาย)
-- ============================================================================
CREATE TABLE exercises (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    category_id     INT NOT NULL,
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    muscle_group    VARCHAR(100),
    met_value       DECIMAL(4,2) NOT NULL DEFAULT 3.0,
    difficulty      ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
    equipment       VARCHAR(200) DEFAULT NULL,
    image_url       VARCHAR(500) DEFAULT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES exercise_categories(id)
);

-- ============================================================================
-- 4. workout_plans (แผนออกกำลังกาย)
-- ============================================================================
CREATE TABLE workout_plans (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT DEFAULT NULL,
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    goal            ENUM('lose', 'gain', 'maintain', 'endurance') DEFAULT 'maintain',
    difficulty      ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
    is_template     BOOLEAN DEFAULT FALSE,
    is_active       BOOLEAN DEFAULT FALSE,
    start_date      DATE DEFAULT NULL,
    end_date        DATE DEFAULT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- 5. workout_plan_days (รายละเอียดแผนแต่ละวัน)
-- ============================================================================
CREATE TABLE workout_plan_days (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    plan_id         INT NOT NULL,
    day_of_week     ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
    is_rest_day     BOOLEAN DEFAULT FALSE,
    notes           TEXT,
    order_index     INT DEFAULT 0,
    FOREIGN KEY (plan_id) REFERENCES workout_plans(id) ON DELETE CASCADE,
    UNIQUE KEY unique_plan_day (plan_id, day_of_week)
);

-- ============================================================================
-- 6. workout_plan_exercises (ท่าในแต่ละวันของแผน)
-- ============================================================================
CREATE TABLE workout_plan_exercises (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    plan_day_id     INT NOT NULL,
    exercise_id     INT NOT NULL,
    sets            INT DEFAULT 3,
    reps            INT DEFAULT 10,
    duration_minutes INT DEFAULT NULL,
    rest_seconds    INT DEFAULT 60,
    order_index     INT DEFAULT 0,
    notes           TEXT,
    FOREIGN KEY (plan_day_id) REFERENCES workout_plan_days(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id)
);

-- ============================================================================
-- 7. workout_logs (บันทึกการออกกำลังกายจริง)
-- ============================================================================
CREATE TABLE workout_logs (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    plan_exercise_id INT DEFAULT NULL,
    exercise_id     INT NOT NULL,
    workout_date    DATE NOT NULL,
    sets_completed  INT DEFAULT 0,
    reps_completed  INT DEFAULT 0,
    duration_minutes DECIMAL(6,2) DEFAULT 0,
    calories_burned DECIMAL(8,2) DEFAULT 0,
    is_completed    BOOLEAN DEFAULT FALSE,
    notes           TEXT,
    completed_at    TIMESTAMP NULL DEFAULT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_exercise_id) REFERENCES workout_plan_exercises(id) ON DELETE SET NULL,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id),
    INDEX idx_user_date (user_id, workout_date)
);

-- ============================================================================
-- 8. weight_logs (บันทึกน้ำหนัก)
-- ============================================================================
CREATE TABLE weight_logs (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    weight_kg       DECIMAL(5,2) NOT NULL,
    body_fat_pct    DECIMAL(4,2) DEFAULT NULL,
    bmi             DECIMAL(4,2) DEFAULT NULL,
    log_date        DATE NOT NULL,
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_date (user_id, log_date)
);

-- ============================================================================
-- 9. achievements (รางวัล)
-- ============================================================================
CREATE TABLE achievements (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    icon            VARCHAR(50) DEFAULT '🏆',
    condition_type  VARCHAR(50) NOT NULL,
    condition_value INT NOT NULL
);

-- ============================================================================
-- 10. user_achievements (รางวัลที่ผู้ใช้ได้รับ)
-- ============================================================================
CREATE TABLE user_achievements (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    achievement_id  INT NOT NULL,
    earned_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id),
    UNIQUE KEY unique_user_achievement (user_id, achievement_id)
);
