-- 实验室动物信息管理系统 数据库初始化脚本
-- Database: lab_animal_db

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

USE lab_animal_db;

-- ========================================
-- 用户表
-- ========================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
  `password` VARCHAR(255) NOT NULL COMMENT '密码(bcrypt)',
  `name` VARCHAR(100) DEFAULT NULL COMMENT '显示名称',
  `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user' COMMENT '角色',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ========================================
-- 动物基本信息表
-- ========================================
CREATE TABLE IF NOT EXISTS `animals` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL COMMENT '动物名称/编号',
  `species` VARCHAR(50) NOT NULL COMMENT '物种',
  `breed` VARCHAR(50) DEFAULT NULL COMMENT '品系/品种',
  `gender` ENUM('male', 'female', 'unknown') NOT NULL DEFAULT 'unknown' COMMENT '性别',
  `birth_date` DATE DEFAULT NULL COMMENT '出生日期',
  `weight` DECIMAL(10, 2) DEFAULT NULL COMMENT '体重(g)',
  `status` ENUM('healthy', 'sick', 'in_experiment', 'deceased', 'quarantine') NOT NULL DEFAULT 'healthy' COMMENT '状态',
  `cage_number` VARCHAR(50) DEFAULT NULL COMMENT '笼号',
  `rfid_tag` VARCHAR(100) DEFAULT NULL COMMENT 'RFID标签',
  `source` VARCHAR(200) DEFAULT NULL COMMENT '来源',
  `description` TEXT COMMENT '备注描述',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_species` (`species`),
  INDEX `idx_status` (`status`),
  INDEX `idx_cage` (`cage_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='动物基本信息表';

-- ========================================
-- 健康记录表
-- ========================================
CREATE TABLE IF NOT EXISTS `health_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `animal_id` INT NOT NULL COMMENT '动物ID',
  `check_date` DATE NOT NULL COMMENT '检查日期',
  `temperature` DECIMAL(4, 1) DEFAULT NULL COMMENT '体温(℃)',
  `weight` DECIMAL(10, 2) DEFAULT NULL COMMENT '体重(g)',
  `heart_rate` INT DEFAULT NULL COMMENT '心率(次/分)',
  `respiratory_rate` INT DEFAULT NULL COMMENT '呼吸频率(次/分)',
  `condition` ENUM('normal', 'abnormal', 'critical') NOT NULL DEFAULT 'normal' COMMENT '健康状况',
  `diagnosis` TEXT COMMENT '诊断',
  `treatment` TEXT COMMENT '治疗方案',
  `veterinarian` VARCHAR(100) DEFAULT NULL COMMENT '兽医',
  `next_check_date` DATE DEFAULT NULL COMMENT '下次检查日期',
  `notes` TEXT COMMENT '备注',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE CASCADE,
  INDEX `idx_animal_id` (`animal_id`),
  INDEX `idx_check_date` (`check_date`),
  INDEX `idx_condition` (`condition`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='健康记录表';

-- ========================================
-- 实验项目表
-- ========================================
CREATE TABLE IF NOT EXISTS `experiments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(200) NOT NULL COMMENT '实验名称',
  `project_code` VARCHAR(50) NOT NULL COMMENT '项目编号',
  `description` TEXT COMMENT '实验描述',
  `start_date` DATE DEFAULT NULL COMMENT '开始日期',
  `end_date` DATE DEFAULT NULL COMMENT '结束日期',
  `status` ENUM('planning', 'in_progress', 'completed', 'suspended', 'cancelled') NOT NULL DEFAULT 'planning' COMMENT '状态',
  `researcher` VARCHAR(100) DEFAULT NULL COMMENT '负责研究员',
  `department` VARCHAR(100) DEFAULT NULL COMMENT '所属部门',
  `notes` TEXT COMMENT '备注',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_project_code` (`project_code`),
  INDEX `idx_status` (`status`),
  INDEX `idx_researcher` (`researcher`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='实验项目表';

-- ========================================
-- 实验-动物关联表
-- ========================================
CREATE TABLE IF NOT EXISTS `experiment_animals` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `experiment_id` INT NOT NULL COMMENT '实验ID',
  `animal_id` INT NOT NULL COMMENT '动物ID',
  `role` VARCHAR(50) DEFAULT 'subject' COMMENT '角色(实验组/对照组)',
  `join_date` DATE DEFAULT NULL COMMENT '加入日期',
  `leave_date` DATE DEFAULT NULL COMMENT '离开日期',
  `notes` TEXT COMMENT '备注',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`experiment_id`) REFERENCES `experiments`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_exp_animal` (`experiment_id`, `animal_id`),
  INDEX `idx_experiment_id` (`experiment_id`),
  INDEX `idx_animal_id` (`animal_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='实验-动物关联表';

-- ========================================
-- 饲养记录表
-- ========================================
CREATE TABLE IF NOT EXISTS `feeding_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `animal_id` INT NOT NULL COMMENT '动物ID',
  `feed_date` DATE NOT NULL COMMENT '喂养日期',
  `feed_time` TIME DEFAULT NULL COMMENT '喂养时间',
  `food_type` VARCHAR(100) NOT NULL COMMENT '饲料类型',
  `quantity` DECIMAL(10, 2) DEFAULT NULL COMMENT '数量',
  `unit` VARCHAR(20) DEFAULT 'g' COMMENT '单位',
  `water_ml` DECIMAL(10, 2) DEFAULT NULL COMMENT '饮水量(ml)',
  `feeder` VARCHAR(100) DEFAULT NULL COMMENT '喂养员',
  `notes` TEXT COMMENT '备注',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE CASCADE,
  INDEX `idx_animal_id` (`animal_id`),
  INDEX `idx_feed_date` (`feed_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='饲养记录表';

-- ========================================
-- 种子数据：动物信息
-- ========================================
INSERT INTO `animals` (`name`, `species`, `breed`, `gender`, `birth_date`, `weight`, `status`, `cage_number`, `rfid_tag`, `source`, `description`) VALUES
('M-001', '小鼠', 'C57BL/6', 'male', '2025-06-15', 25.30, 'healthy', 'A-101', 'RFID-2025-0001', '北京维通利华实验动物中心', '健康雄性C57BL/6小鼠，用于免疫学研究'),
('M-002', '小鼠', 'C57BL/6', 'female', '2025-06-15', 21.50, 'healthy', 'A-101', 'RFID-2025-0002', '北京维通利华实验动物中心', '健康雌性C57BL/6小鼠'),
('M-003', '小鼠', 'BALB/c', 'male', '2025-07-01', 23.80, 'in_experiment', 'A-102', 'RFID-2025-0003', '上海斯莱克实验动物中心', '正在参与药效评价实验'),
('M-004', '小鼠', 'BALB/c', 'female', '2025-07-01', 20.10, 'in_experiment', 'A-102', 'RFID-2025-0004', '上海斯莱克实验动物中心', '正在参与药效评价实验'),
('M-005', '小鼠', 'ICR', 'male', '2025-08-10', 28.60, 'healthy', 'A-103', 'RFID-2025-0005', '广东省医学实验动物中心', '常规饲养ICR小鼠'),
('R-001', '大鼠', 'SD', 'male', '2025-05-20', 320.50, 'healthy', 'B-201', 'RFID-2025-0006', '北京维通利华实验动物中心', '健康SD大鼠，用于毒理学研究'),
('R-002', '大鼠', 'SD', 'female', '2025-05-20', 280.30, 'sick', 'B-201', 'RFID-2025-0007', '北京维通利华实验动物中心', '近期出现食欲下降，需观察'),
('R-003', '大鼠', 'Wistar', 'male', '2025-06-01', 350.00, 'in_experiment', 'B-202', 'RFID-2025-0008', '上海斯莱克实验动物中心', '参与神经行为学实验'),
('RB-001', '兔', '新西兰白兔', 'female', '2025-03-15', 2800.00, 'healthy', 'C-301', 'RFID-2025-0009', '山东鲁抗实验动物中心', '用于抗体生产'),
('RB-002', '兔', '新西兰白兔', 'male', '2025-04-01', 3200.00, 'quarantine', 'C-302', 'RFID-2025-0010', '山东鲁抗实验动物中心', '新到检疫中'),
('GP-001', '豚鼠', 'Hartley', 'male', '2025-07-20', 450.00, 'healthy', 'D-401', 'RFID-2025-0011', '广东省医学实验动物中心', '用于过敏性测试'),
('GP-002', '豚鼠', 'Hartley', 'female', '2025-07-20', 380.00, 'healthy', 'D-401', 'RFID-2025-0012', '广东省医学实验动物中心', '用于过敏性测试');

-- ========================================
-- 种子数据：健康记录
-- ========================================
INSERT INTO `health_records` (`animal_id`, `check_date`, `temperature`, `weight`, `heart_rate`, `respiratory_rate`, `condition`, `diagnosis`, `treatment`, `veterinarian`, `next_check_date`, `notes`) VALUES
(1, '2025-12-01', 37.2, 25.30, 600, 160, 'normal', '各项指标正常', '无需治疗', '张医生', '2026-01-01', '定期体检'),
(2, '2025-12-01', 37.1, 21.50, 620, 155, 'normal', '各项指标正常', '无需治疗', '张医生', '2026-01-01', '定期体检'),
(3, '2025-12-05', 37.5, 24.10, 580, 170, 'normal', '实验前体检，指标正常', '无需治疗', '李医生', '2025-12-15', '实验期间每10天复查'),
(6, '2025-12-02', 37.8, 325.00, 350, 90, 'normal', '各项指标正常', '无需治疗', '王医生', '2026-01-02', 'SD大鼠定期体检'),
(7, '2025-12-10', 38.5, 270.00, 380, 100, 'abnormal', '食欲下降，体重减轻', '口服补液盐，加强营养', '王医生', '2025-12-13', '需密切观察'),
(8, '2025-12-08', 37.6, 352.00, 340, 85, 'normal', '实验进行中，指标稳定', '按实验方案用药', '李医生', '2025-12-18', '行为学测试前体检'),
(9, '2025-12-03', 38.9, 2810.00, 220, 50, 'normal', '各项指标正常', '无需治疗', '赵医生', '2026-01-03', '兔子定期体检'),
(10, '2025-12-15', 39.2, 3150.00, 240, 55, 'normal', '检疫期体检正常', '继续观察', '赵医生', '2025-12-22', '检疫期第二次体检'),
(11, '2025-12-05', 38.6, 455.00, 280, 80, 'normal', '各项指标正常', '无需治疗', '张医生', '2026-01-05', '豚鼠定期体检'),
(1, '2026-01-01', 37.3, 26.00, 590, 158, 'normal', '体重增长正常', '无需治疗', '张医生', '2026-02-01', '月度例行体检');

-- ========================================
-- 种子数据：实验项目
-- ========================================
INSERT INTO `experiments` (`name`, `project_code`, `description`, `start_date`, `end_date`, `status`, `researcher`, `department`, `notes`) VALUES
('新型抗肿瘤药物XR-7的药效评价', 'EXP-2025-001', '评估新型抗肿瘤药物XR-7对BALB/c小鼠移植瘤的抑制效果，包括肿瘤体积变化、生存期及毒性观察', '2025-11-01', '2026-03-01', 'in_progress', '陈博士', '药理学研究室', 'IACUC审批编号：2025-A-042'),
('SD大鼠慢性毒性试验', 'EXP-2025-002', '通过28天重复给药毒性试验评估候选药物的安全性，观察大鼠的一般状态、血液生化和组织病理学变化', '2025-10-15', '2026-02-15', 'in_progress', '刘研究员', '毒理学研究室', 'GLP规范执行'),
('神经退行性疾病模型建立', 'EXP-2025-003', '利用Wistar大鼠建立阿尔茨海默病动物模型，通过行为学测试和脑组织分析验证模型的有效性', '2025-12-01', '2026-06-01', 'in_progress', '赵教授', '神经科学研究室', '与附属医院合作项目'),
('新型疫苗佐剂免疫原性研究', 'EXP-2025-004', '评估新型纳米佐剂对小鼠免疫应答的增强效果，检测抗体滴度和细胞免疫指标', '2026-01-15', '2026-07-15', 'planning', '吴副教授', '免疫学研究室', '已获伦理审批，待启动'),
('过敏性接触性皮炎模型研究', 'EXP-2025-005', '利用豚鼠建立过敏性接触性皮炎模型，评估新型抗过敏药物的疗效', '2025-09-01', '2025-12-30', 'completed', '孙研究员', '皮肤病学研究室', '实验已完成，报告撰写中');

-- ========================================
-- 种子数据：实验-动物关联
-- ========================================
INSERT INTO `experiment_animals` (`experiment_id`, `animal_id`, `role`, `join_date`, `leave_date`, `notes`) VALUES
(1, 3, 'treatment_group', '2025-11-01', NULL, '治疗组 - 高剂量'),
(1, 4, 'control_group', '2025-11-01', NULL, '对照组 - 溶媒对照'),
(2, 6, 'treatment_group', '2025-10-15', NULL, '治疗组 - 中剂量'),
(3, 8, 'treatment_group', '2025-12-01', NULL, '模型组'),
(5, 11, 'treatment_group', '2025-09-01', '2025-12-30', '治疗组'),
(5, 12, 'control_group', '2025-09-01', '2025-12-30', '对照组');

-- ========================================
-- 种子数据：饲养记录
-- ========================================
INSERT INTO `feeding_records` (`animal_id`, `feed_date`, `feed_time`, `food_type`, `quantity`, `unit`, `water_ml`, `feeder`, `notes`) VALUES
(1, '2026-01-20', '08:00:00', '标准啮齿类动物饲料', 5.00, 'g', 8.00, '小李', '正常进食'),
(1, '2026-01-20', '17:00:00', '标准啮齿类动物饲料', 5.00, 'g', 7.50, '小王', '正常进食'),
(2, '2026-01-20', '08:00:00', '标准啮齿类动物饲料', 4.50, 'g', 7.00, '小李', '正常进食'),
(3, '2026-01-20', '08:00:00', '实验专用饲料-高脂', 6.00, 'g', 8.50, '小李', '实验期间特殊饮食'),
(6, '2026-01-20', '08:00:00', '标准大鼠饲料', 25.00, 'g', 35.00, '小张', '正常进食'),
(6, '2026-01-20', '17:00:00', '标准大鼠饲料', 20.00, 'g', 30.00, '小陈', '正常进食'),
(7, '2026-01-20', '08:00:00', '标准大鼠饲料', 18.00, 'g', 25.00, '小张', '进食量略少于正常'),
(8, '2026-01-20', '08:00:00', '实验专用饲料', 22.00, 'g', 32.00, '小张', '实验期间按方案喂养'),
(9, '2026-01-20', '08:00:00', '兔用颗粒饲料', 150.00, 'g', 300.00, '小刘', '正常进食，补充了苜蓿草'),
(10, '2026-01-20', '08:00:00', '兔用颗粒饲料', 130.00, 'g', 280.00, '小刘', '检疫期饲料'),
(11, '2026-01-20', '08:00:00', '豚鼠专用饲料', 35.00, 'g', 50.00, '小李', '补充维C蔬菜'),
(12, '2026-01-20', '08:00:00', '豚鼠专用饲料', 30.00, 'g', 45.00, '小李', '补充维C蔬菜'),
(1, '2026-01-21', '08:00:00', '标准啮齿类动物饲料', 5.00, 'g', 8.00, '小李', '正常进食'),
(2, '2026-01-21', '08:00:00', '标准啮齿类动物饲料', 4.80, 'g', 7.20, '小李', '正常进食'),
(6, '2026-01-21', '08:00:00', '标准大鼠饲料', 24.00, 'g', 33.00, '小张', '正常进食');
