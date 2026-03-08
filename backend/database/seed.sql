-- ============================================================================
-- FitLife Tracker - Seed Data
-- ข้อมูลเริ่มต้น: หมวดหมู่, ท่าออกกำลังกาย, แผนสำเร็จรูป, รางวัล
-- ============================================================================

USE fitlife_tracker;

-- ============================================================================
-- 1. Exercise Categories (หมวดหมู่)
-- ============================================================================
INSERT INTO exercise_categories (name, description, icon) VALUES
('Cardio',      'ท่าคาร์ดิโอ เน้นเพิ่มอัตราการเต้นหัวใจและเผาผลาญไขมัน', '🏃'),
('Strength',    'ท่าเสริมสร้างกล้ามเนื้อ เน้นความแข็งแรง', '💪'),
('HIIT',        'High Intensity Interval Training ออกกำลังกายหนักสลับเบา', '🔥'),
('Flexibility', 'ท่ายืดเหยียด เพิ่มความยืดหยุ่นร่างกาย', '🤸'),
('Yoga',        'โยคะ เน้นสมดุลกายใจ ความยืดหยุ่นและสมาธิ', '🧘');

-- ============================================================================
-- 2. Exercises (ท่าออกกำลังกาย 50+ ท่า)
-- ============================================================================

-- === CARDIO (category_id = 1) ===
INSERT INTO exercises (category_id, name, description, muscle_group, met_value, difficulty, equipment) VALUES
(1, 'Walking (เดินเร็ว)',           'เดินเร็วด้วยความเร็วประมาณ 5 km/h เพื่อเผาผลาญพลังงาน', 'Legs, Cardiovascular', 3.50, 'beginner', 'ไม่ต้องใช้อุปกรณ์'),
(1, 'Jogging (วิ่งเหยาะ)',          'วิ่งเหยาะด้วยความเร็วปานกลาง 7-8 km/h', 'Legs, Cardiovascular', 7.00, 'beginner', 'ไม่ต้องใช้อุปกรณ์'),
(1, 'Running (วิ่งเร็ว)',           'วิ่งเร็วด้วยความเร็ว 10+ km/h', 'Legs, Cardiovascular', 9.80, 'intermediate', 'ไม่ต้องใช้อุปกรณ์'),
(1, 'Cycling (ปั่นจักรยาน)',         'ปั่นจักรยานด้วยความเร็วปานกลาง', 'Legs, Cardiovascular', 6.80, 'beginner', 'จักรยาน'),
(1, 'Swimming (ว่ายน้ำ)',            'ว่ายน้ำท่าฟรีสไตล์ด้วยความเร็วปานกลาง', 'Full Body', 6.00, 'intermediate', 'สระว่ายน้ำ'),
(1, 'Jump Rope (กระโดดเชือก)',       'กระโดดเชือกต่อเนื่อง เผาผลาญไขมันได้ดีมาก', 'Full Body, Calves', 12.30, 'intermediate', 'เชือกกระโดด'),
(1, 'Jumping Jacks (กระโดดตบ)',      'กระโดดแยกขาพร้อมยกแขนเหนือศีรษะ', 'Full Body', 8.00, 'beginner', 'ไม่ต้องใช้อุปกรณ์'),
(1, 'Stair Climbing (ขึ้นบันได)',    'ขึ้นลงบันไดต่อเนื่อง', 'Legs, Glutes', 9.00, 'intermediate', 'บันได'),
(1, 'Elliptical Trainer',           'ใช้เครื่อง Elliptical เพื่อออกกำลังกายแบบ Low Impact', 'Full Body', 5.00, 'beginner', 'เครื่อง Elliptical'),
(1, 'Rowing Machine (เครื่องพาย)',   'ใช้เครื่องพายเรือเพื่อออกกำลังกายทั้งตัว', 'Back, Arms, Legs', 7.00, 'intermediate', 'เครื่อง Rowing');

-- === STRENGTH (category_id = 2) ===
INSERT INTO exercises (category_id, name, description, muscle_group, met_value, difficulty, equipment) VALUES
(2, 'Push-up (วิดพื้น)',             'วิดพื้นท่ามาตรฐาน เน้นกล้ามเนื้ออก แขน ไหล่', 'Chest, Shoulders, Triceps', 3.80, 'beginner', 'ไม่ต้องใช้อุปกรณ์'),
(2, 'Squat (สควอท)',                 'สควอทมาตรฐาน ย่อตัวลงจนต้นขาขนานกับพื้น', 'Quadriceps, Glutes, Hamstrings', 5.00, 'beginner', 'ไม่ต้องใช้อุปกรณ์'),
(2, 'Plank (แพลงก์)',                'ค้างในท่าวิดพื้น เน้นแกนกลางลำตัว', 'Core, Abs, Shoulders', 3.00, 'beginner', 'ไม่ต้องใช้อุปกรณ์'),
(2, 'Lunges (ลันจ์)',                'ก้าวขาไปข้างหน้าแล้วย่อตัวลง สลับขา', 'Legs, Glutes', 4.00, 'beginner', 'ไม่ต้องใช้อุปกรณ์'),
(2, 'Deadlift (เดดลิฟท์)',           'ยกบาร์เบลจากพื้นด้วยท่าที่ถูกต้อง', 'Back, Hamstrings, Glutes', 6.00, 'intermediate', 'บาร์เบล'),
(2, 'Bench Press (เบนช์เพรส)',       'นอนบนม้ายกบาร์เบลขึ้นลง', 'Chest, Triceps, Shoulders', 5.00, 'intermediate', 'บาร์เบล, ม้านอน'),
(2, 'Pull-up (พูลอัพ)',              'ดึงตัวขึ้นบนบาร์ เน้นหลังและแขน', 'Back, Biceps, Forearms', 3.80, 'advanced', 'บาร์ดึงข้อ'),
(2, 'Dumbbell Curl (ยกดัมเบลล์)',    'ยกดัมเบลล์ขึ้นงอข้อศอก เน้นกล้ามเนื้อต้นแขน', 'Biceps', 3.00, 'beginner', 'ดัมเบลล์'),
(2, 'Shoulder Press (เพรสไหล่)',     'ยกน้ำหนักเหนือศีรษะจากระดับไหล่', 'Shoulders, Triceps', 3.50, 'intermediate', 'ดัมเบลล์'),
(2, 'Leg Press (เลกเพรส)',           'ใช้เครื่องเลกเพรสดันน้ำหนักด้วยขา', 'Quadriceps, Glutes', 5.00, 'beginner', 'เครื่อง Leg Press'),
(2, 'Sit-ups (ซิทอัพ)',              'นอนหงายงอเข่า ยกลำตัวขึ้น', 'Abs, Core', 3.80, 'beginner', 'ไม่ต้องใช้อุปกรณ์'),
(2, 'Bicycle Crunches',             'นอนหงายปั่นจักรยานในอากาศ เน้นกล้ามเนื้อเฉียง', 'Abs, Obliques', 3.50, 'beginner', 'ไม่ต้องใช้อุปกรณ์'),
(2, 'Russian Twist',                'นั่งเอนตัวหลัง บิดลำตัวซ้ายขวา', 'Abs, Obliques', 3.00, 'beginner', 'ดัมเบลล์ (ถ้าต้องการ)'),
(2, 'Dumbbell Row',                 'ก้มตัวยกดัมเบลล์ขึ้น เน้นกล้ามเนื้อหลัง', 'Back, Biceps', 3.50, 'intermediate', 'ดัมเบลล์'),
(2, 'Dumbbell Fly',                 'นอนบนม้า กางแขนถือดัมเบลล์ขึ้นมาชิดกัน', 'Chest', 3.00, 'intermediate', 'ดัมเบลล์, ม้านอน'),
(2, 'Lateral Raise',                'ยกดัมเบลล์กางแขนออกข้าง เน้นไหล่ด้านข้าง', 'Shoulders', 3.00, 'beginner', 'ดัมเบลล์'),
(2, 'Front Raise',                  'ยกดัมเบลล์ไปข้างหน้า เน้นไหล่ด้านหน้า', 'Shoulders', 3.00, 'beginner', 'ดัมเบลล์'),
(2, 'Tricep Dips',                  'จับม้าด้านหลัง ดันตัวขึ้นลง เน้น Tricep', 'Triceps, Shoulders', 3.50, 'intermediate', 'ม้านั่ง/ราวจับ'),
(2, 'Hammer Curl',                  'ยกดัมเบลล์ท่าค้อน เน้น Brachialis', 'Biceps, Forearms', 3.00, 'beginner', 'ดัมเบลล์'),
(2, 'Calf Raises (ยกส้นเท้า)',       'ยืนยกส้นเท้าขึ้นลง เน้นน่อง', 'Calves', 2.50, 'beginner', 'ไม่ต้องใช้อุปกรณ์'),
(2, 'Wall Sit (นั่งพิงกำแพง)',       'นั่งพิงกำแพงท่าเก้าอี้ค้างไว้', 'Quadriceps, Glutes', 2.50, 'beginner', 'กำแพง'),
(2, 'Glute Bridge',                 'นอนหงาย ยกสะโพกขึ้น เน้นก้นและต้นขาหลัง', 'Glutes, Hamstrings', 3.50, 'beginner', 'ไม่ต้องใช้อุปกรณ์'),
(2, 'Superman Hold',                'นอนคว่ำ ยกแขนและขาขึ้นพร้อมกัน ค้างไว้', 'Lower Back, Glutes', 2.50, 'beginner', 'ไม่ต้องใช้อุปกรณ์');

-- === HIIT (category_id = 3) ===
INSERT INTO exercises (category_id, name, description, muscle_group, met_value, difficulty, equipment) VALUES
(3, 'Burpees (เบอร์พี)',             'กระโดดลงวิดพื้นแล้วกระโดดขึ้น ท่าเผาผลาญสูง', 'Full Body', 8.00, 'advanced', 'ไม่ต้องใช้อุปกรณ์'),
(3, 'Mountain Climbers',            'ท่าวิดพื้นวิ่งสลับเข่าเข้าหาอก', 'Core, Shoulders, Cardio', 8.00, 'intermediate', 'ไม่ต้องใช้อุปกรณ์'),
(3, 'Box Jumps (กระโดดขึ้นกล่อง)',    'กระโดดขึ้นบนกล่องแล้วลง ซ้ำ', 'Legs, Glutes', 8.00, 'intermediate', 'กล่องกระโดด'),
(3, 'Kettlebell Swing',             'แกว่ง Kettlebell จากระหว่างขาขึ้นระดับอก', 'Full Body', 9.00, 'intermediate', 'Kettlebell'),
(3, 'Battle Ropes',                 'ฟาดเชือกขึ้นลงต่อเนื่อง', 'Arms, Core, Shoulders', 10.30, 'advanced', 'Battle Ropes'),
(3, 'High Knees (ยกเข่าสูง)',        'วิ่งอยู่กับที่ยกเข่าสูงระดับสะโพก', 'Legs, Core, Cardio', 8.00, 'beginner', 'ไม่ต้องใช้อุปกรณ์'),
(3, 'Squat Jumps',                  'สควอทแล้วกระโดดขึ้น ซ้ำต่อเนื่อง', 'Legs, Glutes', 8.00, 'intermediate', 'ไม่ต้องใช้อุปกรณ์'),
(3, 'Tuck Jumps',                   'กระโดดงอเข่าชิดอกในอากาศ', 'Legs, Core', 10.00, 'advanced', 'ไม่ต้องใช้อุปกรณ์'),
(3, 'Sprint Intervals (วิ่งสปรินท์)', 'วิ่งเร็วสุดสลับเดิน เป็นรอบ', 'Legs, Cardiovascular', 11.00, 'advanced', 'ไม่ต้องใช้อุปกรณ์'),
(3, 'Plyo Push-ups',                'วิดพื้นดันตัวให้มือลอยจากพื้น', 'Chest, Shoulders, Core', 8.00, 'advanced', 'ไม่ต้องใช้อุปกรณ์');

-- === FLEXIBILITY (category_id = 4) ===
INSERT INTO exercises (category_id, name, description, muscle_group, met_value, difficulty, equipment) VALUES
(4, 'Stretching (ยืดเหยียด)',        'ยืดเหยียดกล้ามเนื้อทั่วร่างกาย', 'Full Body', 2.30, 'beginner', 'ไม่ต้องใช้อุปกรณ์'),
(4, 'Foam Rolling',                 'นวดกล้ามเนื้อด้วย Foam Roller', 'Full Body', 2.00, 'beginner', 'Foam Roller'),
(4, 'Hamstring Stretch',            'ยืดกล้ามเนื้อต้นขาหลัง', 'Hamstrings', 2.30, 'beginner', 'ไม่ต้องใช้อุปกรณ์'),
(4, 'Hip Flexor Stretch',           'ยืดกล้ามเนื้อสะโพกด้านหน้า', 'Hip Flexors', 2.30, 'beginner', 'ไม่ต้องใช้อุปกรณ์'),
(4, 'Shoulder Stretch',             'ยืดกล้ามเนื้อไหล่และหลังส่วนบน', 'Shoulders, Upper Back', 2.00, 'beginner', 'ไม่ต้องใช้อุปกรณ์');

-- === YOGA (category_id = 5) ===
INSERT INTO exercises (category_id, name, description, muscle_group, met_value, difficulty, equipment) VALUES
(5, 'Sun Salutation (สุริยนมัสการ)',  'ท่าโยคะต่อเนื่อง 12 จังหวะ', 'Full Body', 2.50, 'beginner', 'เสื่อโยคะ'),
(5, 'Warrior Pose (ท่านักรบ)',       'ยืนกางขากว้าง งอเข่าหน้า ยกแขนเหนือศีรษะ', 'Legs, Core', 2.50, 'beginner', 'เสื่อโยคะ'),
(5, 'Downward Dog',                 'ท่าสุนัขก้มหน้า เน้นยืดหลังและขา', 'Back, Hamstrings, Shoulders', 2.50, 'beginner', 'เสื่อโยคะ'),
(5, 'Tree Pose (ท่าต้นไม้)',         'ยืนขาเดียว วางเท้าอีกข้างที่ต้นขา ทรงตัว', 'Legs, Core, Balance', 2.50, 'beginner', 'เสื่อโยคะ'),
(5, 'Child''s Pose',                'คุกเข่า ยืดตัวไปข้างหน้า พักผ่อนร่างกาย', 'Back, Shoulders', 2.00, 'beginner', 'เสื่อโยคะ');

-- ============================================================================
-- 3. Workout Plan Templates (แผนออกกำลังกายสำเร็จรูป)
-- ============================================================================

-- Template 1: แผนลดน้ำหนัก 30 วัน
INSERT INTO workout_plans (user_id, name, description, goal, difficulty, is_template, is_active) VALUES
(NULL, 'แผนลดน้ำหนัก 30 วัน (Fat Burn)', 'แผนออกกำลังกายสำหรับผู้เริ่มต้นที่ต้องการลดน้ำหนัก เน้น Cardio + HIIT 5 วัน/สัปดาห์ พัก 2 วัน ประมาณ 250-350 kcal/วัน', 'lose', 'beginner', TRUE, FALSE);

-- Days for Template 1 (plan_id = 1)
INSERT INTO workout_plan_days (plan_id, day_of_week, is_rest_day, order_index) VALUES
(1, 'monday', FALSE, 1),
(1, 'tuesday', FALSE, 2),
(1, 'wednesday', TRUE, 3),
(1, 'thursday', FALSE, 4),
(1, 'friday', FALSE, 5),
(1, 'saturday', FALSE, 6),
(1, 'sunday', TRUE, 7);

-- Monday exercises (plan_day_id = 1): Jumping Jacks + Squats + Plank + Burpees
INSERT INTO workout_plan_exercises (plan_day_id, exercise_id, sets, reps, duration_minutes, rest_seconds, order_index) VALUES
(1, 7, 3, 30, NULL, 45, 1),    -- Jumping Jacks 3×30
(1, 12, 3, 15, NULL, 60, 2),   -- Squat 3×15
(1, 13, 3, NULL, 1, 30, 3),    -- Plank 3×30s (1 min duration)
(1, 31, 2, 10, NULL, 60, 4);   -- Burpees 2×10

-- Tuesday exercises (plan_day_id = 2): Running + Sit-ups + Push-ups + Mountain Climbers
INSERT INTO workout_plan_exercises (plan_day_id, exercise_id, sets, reps, duration_minutes, rest_seconds, order_index) VALUES
(2, 3, 1, NULL, 20, 0, 1),     -- Running 20min
(2, 21, 3, 20, NULL, 45, 2),   -- Sit-ups 3×20
(2, 11, 3, 10, NULL, 60, 3),   -- Push-ups 3×10
(2, 32, 3, 15, NULL, 45, 4);   -- Mountain Climbers 3×15

-- Thursday exercises (plan_day_id = 4): Jump Rope + Lunges + Russian Twist + High Knees
INSERT INTO workout_plan_exercises (plan_day_id, exercise_id, sets, reps, duration_minutes, rest_seconds, order_index) VALUES
(4, 6, 1, NULL, 15, 0, 1),     -- Jump Rope 15min
(4, 14, 3, 15, NULL, 60, 2),   -- Lunges 3×15
(4, 23, 3, 20, NULL, 45, 3),   -- Russian Twist 3×20
(4, 36, 3, 30, NULL, 45, 4);   -- High Knees 3×30

-- Friday exercises (plan_day_id = 5): Cycling + Plank + Bicycle Crunches
INSERT INTO workout_plan_exercises (plan_day_id, exercise_id, sets, reps, duration_minutes, rest_seconds, order_index) VALUES
(5, 4, 1, NULL, 25, 0, 1),     -- Cycling 25min
(5, 13, 3, NULL, 1, 30, 2),    -- Plank 3×45s
(5, 22, 3, 20, NULL, 45, 3);   -- Bicycle Crunches 3×20

-- Saturday exercises (plan_day_id = 6): HIIT Circuit
INSERT INTO workout_plan_exercises (plan_day_id, exercise_id, sets, reps, duration_minutes, rest_seconds, order_index) VALUES
(6, 31, 3, 10, NULL, 60, 1),   -- Burpees 3×10
(6, 33, 3, 10, NULL, 60, 2),   -- Box Jumps 3×10
(6, 32, 3, 20, NULL, 45, 3);   -- Mountain Climbers 3×20


-- Template 2: สร้างกล้ามเนื้อ (Muscle Building)
INSERT INTO workout_plans (user_id, name, description, goal, difficulty, is_template, is_active) VALUES
(NULL, 'สร้างกล้ามเนื้อ (Muscle Building)', 'แผนสำหรับผู้ที่ต้องการเพิ่มกล้ามเนื้อ แบ่งกลุ่มกล้ามเนื้อแต่ละวัน 5 วัน/สัปดาห์ ประมาณ 300-450 kcal/วัน', 'gain', 'intermediate', TRUE, FALSE);

-- Days for Template 2 (plan_id = 2)
INSERT INTO workout_plan_days (plan_id, day_of_week, is_rest_day, order_index) VALUES
(2, 'monday', FALSE, 1),
(2, 'tuesday', FALSE, 2),
(2, 'wednesday', FALSE, 3),
(2, 'thursday', TRUE, 4),
(2, 'friday', FALSE, 5),
(2, 'saturday', FALSE, 6),
(2, 'sunday', TRUE, 7);

-- Monday (Chest): Bench Press + Push-ups + Dumbbell Fly
INSERT INTO workout_plan_exercises (plan_day_id, exercise_id, sets, reps, duration_minutes, rest_seconds, order_index) VALUES
(8, 16, 4, 10, NULL, 90, 1),   -- Bench Press 4×10
(8, 11, 3, 15, NULL, 60, 2),   -- Push-ups 3×15
(8, 25, 3, 12, NULL, 60, 3);   -- Dumbbell Fly 3×12

-- Tuesday (Back): Pull-ups + Deadlift + Dumbbell Row
INSERT INTO workout_plan_exercises (plan_day_id, exercise_id, sets, reps, duration_minutes, rest_seconds, order_index) VALUES
(9, 17, 3, 8, NULL, 90, 1),    -- Pull-ups 3×8
(9, 15, 4, 8, NULL, 120, 2),   -- Deadlift 4×8
(9, 24, 3, 12, NULL, 60, 3);   -- Dumbbell Row 3×12

-- Wednesday (Legs): Squats + Lunges + Leg Press + Calf Raises
INSERT INTO workout_plan_exercises (plan_day_id, exercise_id, sets, reps, duration_minutes, rest_seconds, order_index) VALUES
(10, 12, 4, 12, NULL, 90, 1),  -- Squats 4×12
(10, 14, 3, 15, NULL, 60, 2),  -- Lunges 3×15
(10, 20, 3, 12, NULL, 60, 3),  -- Leg Press 3×12
(10, 30, 3, 20, NULL, 45, 4);  -- Calf Raises 3×20

-- Friday (Shoulders): Shoulder Press + Lateral Raise + Front Raise
INSERT INTO workout_plan_exercises (plan_day_id, exercise_id, sets, reps, duration_minutes, rest_seconds, order_index) VALUES
(12, 19, 4, 10, NULL, 90, 1),  -- Shoulder Press 4×10
(12, 26, 3, 12, NULL, 60, 2),  -- Lateral Raise 3×12
(12, 27, 3, 12, NULL, 60, 3);  -- Front Raise 3×12

-- Saturday (Arms): Dumbbell Curl + Tricep Dips + Hammer Curl
INSERT INTO workout_plan_exercises (plan_day_id, exercise_id, sets, reps, duration_minutes, rest_seconds, order_index) VALUES
(13, 18, 4, 12, NULL, 60, 1),  -- Dumbbell Curl 4×12
(13, 28, 3, 10, NULL, 60, 2),  -- Tricep Dips 3×10
(13, 29, 3, 12, NULL, 60, 3);  -- Hammer Curl 3×12


-- Template 3: Cardio เบิร์นไขมัน (Cardio Blast)
INSERT INTO workout_plans (user_id, name, description, goal, difficulty, is_template, is_active) VALUES
(NULL, 'Cardio เบิร์นไขมัน (Cardio Blast)', 'แผน Cardio สำหรับผู้เริ่มต้น เน้นเพิ่มความอดทนและเผาผลาญไขมัน 4 วัน Cardio + 1 วัน Yoga + 2 วันพัก ประมาณ 300-500 kcal/วัน', 'lose', 'beginner', TRUE, FALSE);

-- Days for Template 3 (plan_id = 3)
INSERT INTO workout_plan_days (plan_id, day_of_week, is_rest_day, order_index) VALUES
(3, 'monday', FALSE, 1),
(3, 'tuesday', FALSE, 2),
(3, 'wednesday', FALSE, 3),
(3, 'thursday', TRUE, 4),
(3, 'friday', FALSE, 5),
(3, 'saturday', FALSE, 6),
(3, 'sunday', FALSE, 7);

-- Monday: Walking + Stretching
INSERT INTO workout_plan_exercises (plan_day_id, exercise_id, sets, reps, duration_minutes, rest_seconds, order_index) VALUES
(15, 1, 1, NULL, 30, 0, 1),    -- Walking 30min
(15, 41, 1, NULL, 10, 0, 2);   -- Stretching 10min

-- Tuesday: Jogging + Jumping Jacks
INSERT INTO workout_plan_exercises (plan_day_id, exercise_id, sets, reps, duration_minutes, rest_seconds, order_index) VALUES
(16, 2, 1, NULL, 20, 0, 1),    -- Jogging 20min
(16, 7, 3, 30, NULL, 45, 2);   -- Jumping Jacks 3×30

-- Wednesday: Cycling
INSERT INTO workout_plan_exercises (plan_day_id, exercise_id, sets, reps, duration_minutes, rest_seconds, order_index) VALUES
(17, 4, 1, NULL, 30, 0, 1);    -- Cycling 30min

-- Friday: Running + High Knees
INSERT INTO workout_plan_exercises (plan_day_id, exercise_id, sets, reps, duration_minutes, rest_seconds, order_index) VALUES
(19, 3, 1, NULL, 25, 0, 1),    -- Running 25min
(19, 36, 3, 30, NULL, 45, 2);  -- High Knees 3×30

-- Saturday: Swimming
INSERT INTO workout_plan_exercises (plan_day_id, exercise_id, sets, reps, duration_minutes, rest_seconds, order_index) VALUES
(20, 5, 1, NULL, 30, 0, 1);    -- Swimming 30min

-- Sunday: Yoga
INSERT INTO workout_plan_exercises (plan_day_id, exercise_id, sets, reps, duration_minutes, rest_seconds, order_index) VALUES
(21, 46, 1, NULL, 15, 0, 1),   -- Sun Salutation 15min
(21, 47, 1, NULL, 10, 0, 2),   -- Warrior Pose 10min
(21, 50, 1, NULL, 5, 0, 3);    -- Child's Pose 5min

-- ============================================================================
-- 4. Achievements (รางวัล)
-- ============================================================================
INSERT INTO achievements (name, description, icon, condition_type, condition_value) VALUES
('First Step',           'ออกกำลังกายครั้งแรก!', '🎯', 'total_workouts', 1),
('Getting Started',      'ออกกำลังกายครบ 5 วัน', '🌟', 'total_workouts', 5),
('Dedicated',            'ออกกำลังกายครบ 10 วัน', '💫', 'total_workouts', 10),
('Fitness Freak',        'ออกกำลังกายครบ 30 วัน', '🏅', 'total_workouts', 30),
('Century Club',         'ออกกำลังกายครบ 100 วัน', '🏆', 'total_workouts', 100),
('3-Day Streak',         'ออกกำลังกายติดต่อกัน 3 วัน', '🔥', 'streak', 3),
('Week Warrior',         'ออกกำลังกายติดต่อกัน 7 วัน', '⚡', 'streak', 7),
('Two Week Champion',    'ออกกำลังกายติดต่อกัน 14 วัน', '💪', 'streak', 14),
('Monthly Master',       'ออกกำลังกายติดต่อกัน 30 วัน', '👑', 'streak', 30),
('Calorie Burner 500',   'เผาผลาญรวม 500 แคลอรี่', '🔥', 'total_calories', 500),
('Calorie Burner 1000',  'เผาผลาญรวม 1,000 แคลอรี่', '🔥', 'total_calories', 1000),
('Calorie Burner 5000',  'เผาผลาญรวม 5,000 แคลอรี่', '🔥', 'total_calories', 5000),
('Calorie Burner 10000', 'เผาผลาญรวม 10,000 แคลอรี่', '💥', 'total_calories', 10000),
('Weight Tracker',       'บันทึกน้ำหนักครั้งแรก', '⚖️', 'weight_logs', 1),
('Weight Watcher',       'บันทึกน้ำหนักครบ 7 ครั้ง', '📊', 'weight_logs', 7),
('Plan Creator',         'สร้างแผนออกกำลังกายครั้งแรก', '📝', 'plans_created', 1);
