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
  `father_id` INT DEFAULT NULL COMMENT '父亲ID',
  `mother_id` INT DEFAULT NULL COMMENT '母亲ID',
  `description` TEXT COMMENT '备注描述',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_species` (`species`),
  INDEX `idx_status` (`status`),
  INDEX `idx_cage` (`cage_number`),
  INDEX `idx_father_id` (`father_id`),
  INDEX `idx_mother_id` (`mother_id`),
  FOREIGN KEY (`father_id`) REFERENCES `animals`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`mother_id`) REFERENCES `animals`(`id`) ON DELETE SET NULL
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
-- 物种指标正常范围表
-- ========================================
CREATE TABLE IF NOT EXISTS `species_normal_ranges` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `species` VARCHAR(50) NOT NULL COMMENT '物种',
  `indicator_name` VARCHAR(50) NOT NULL COMMENT '指标名称',
  `min_value` DECIMAL(10, 2) NOT NULL COMMENT '最小值',
  `max_value` DECIMAL(10, 2) NOT NULL COMMENT '最大值',
  `unit` VARCHAR(20) DEFAULT NULL COMMENT '单位',
  `description` TEXT COMMENT '描述',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_species` (`species`),
  UNIQUE KEY `uk_species_indicator` (`species`, `indicator_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='物种指标正常范围表';

-- ========================================
-- 种子数据：物种正常范围
-- ========================================
INSERT INTO `species_normal_ranges` (`species`, `indicator_name`, `min_value`, `max_value`, `unit`, `description`) VALUES
-- 小鼠
('小鼠', 'temperature', 36.5, 38.0, '℃', '小鼠正常体温范围'),
('小鼠', 'weight', 18.0, 40.0, 'g', '成年小鼠正常体重范围'),
('小鼠', 'heartRate', 500, 700, '次/分', '小鼠正常心率范围'),
('小鼠', 'respiratoryRate', 120, 200, '次/分', '小鼠正常呼吸频率范围'),
-- 大鼠
('大鼠', 'temperature', 37.0, 38.5, '℃', '大鼠正常体温范围'),
('大鼠', 'weight', 200.0, 500.0, 'g', '成年大鼠正常体重范围'),
('大鼠', 'heartRate', 300, 450, '次/分', '大鼠正常心率范围'),
('大鼠', 'respiratoryRate', 70, 120, '次/分', '大鼠正常呼吸频率范围'),
-- 兔
('兔', 'temperature', 38.5, 39.5, '℃', '家兔正常体温范围'),
('兔', 'weight', 2000.0, 5000.0, 'g', '成年家兔正常体重范围'),
('兔', 'heartRate', 180, 280, '次/分', '家兔正常心率范围'),
('兔', 'respiratoryRate', 40, 70, '次/分', '家兔正常呼吸频率范围'),
-- 豚鼠
('豚鼠', 'temperature', 37.8, 39.2, '℃', '豚鼠正常体温范围'),
('豚鼠', 'weight', 300.0, 800.0, 'g', '成年豚鼠正常体重范围'),
('豚鼠', 'heartRate', 240, 320, '次/分', '豚鼠正常心率范围'),
('豚鼠', 'respiratoryRate', 60, 110, '次/分', '豚鼠正常呼吸频率范围');

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
-- 实验数据点表
-- ========================================
CREATE TABLE IF NOT EXISTS `experiment_data_points` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `experiment_id` INT NOT NULL COMMENT '实验ID',
  `animal_id` INT NOT NULL COMMENT '动物ID',
  `collected_at` DATETIME NOT NULL COMMENT '采集时间',
  `metric_name` VARCHAR(100) NOT NULL COMMENT '指标名称',
  `data_type` ENUM('numeric', 'text', 'option') NOT NULL DEFAULT 'numeric' COMMENT '数据类型',
  `numeric_value` DECIMAL(14, 4) DEFAULT NULL COMMENT '数值型数据',
  `text_value` TEXT COMMENT '文本型数据',
  `option_value` VARCHAR(100) DEFAULT NULL COMMENT '选项型数据',
  `unit` VARCHAR(30) DEFAULT NULL COMMENT '单位',
  `notes` TEXT COMMENT '备注',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`experiment_id`) REFERENCES `experiments`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE CASCADE,
  INDEX `idx_experiment_id` (`experiment_id`),
  INDEX `idx_animal_id` (`animal_id`),
  INDEX `idx_metric_name` (`metric_name`),
  INDEX `idx_collected_at` (`collected_at`),
  INDEX `idx_data_type` (`data_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='实验数据点表';

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
-- 状态变更日志表
-- ========================================
CREATE TABLE IF NOT EXISTS `status_change_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `animal_id` INT NOT NULL COMMENT '动物ID',
  `from_status` VARCHAR(50) NOT NULL COMMENT '变更前状态',
  `to_status` VARCHAR(50) NOT NULL COMMENT '变更后状态',
  `reason` TEXT COMMENT '变更原因',
  `operator` VARCHAR(100) DEFAULT NULL COMMENT '操作人',
  `experiment_id` INT DEFAULT NULL COMMENT '关联实验ID',
  `changed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '变更时间',
  FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE CASCADE,
  INDEX `idx_animal_id` (`animal_id`),
  INDEX `idx_from_status` (`from_status`),
  INDEX `idx_to_status` (`to_status`),
  INDEX `idx_changed_at` (`changed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='状态变更日志表';

-- ========================================
-- 状态变更申请表
-- ========================================
CREATE TABLE IF NOT EXISTS `status_change_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `applicant` VARCHAR(100) NOT NULL COMMENT '申请人',
  `animal_id` INT NOT NULL COMMENT '动物ID',
  `from_status` VARCHAR(50) NOT NULL COMMENT '原状态',
  `to_status` VARCHAR(50) NOT NULL COMMENT '目标状态',
  `reason` TEXT NOT NULL COMMENT '变更原因',
  `approver` VARCHAR(100) DEFAULT NULL COMMENT '审批人',
  `approval_status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending' COMMENT '审批状态',
  `approval_comment` TEXT COMMENT '审批意见',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `approved_at` DATETIME DEFAULT NULL COMMENT '审批时间',
  FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE CASCADE,
  INDEX `idx_animal_id` (`animal_id`),
  INDEX `idx_approval_status` (`approval_status`),
  INDEX `idx_applicant` (`applicant`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='状态变更申请表';

-- ========================================
-- 笼位转移日志表
-- ========================================
CREATE TABLE IF NOT EXISTS `cage_transfer_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `animal_id` INT NOT NULL COMMENT '动物ID',
  `from_cage` VARCHAR(50) DEFAULT NULL COMMENT '原笼号',
  `to_cage` VARCHAR(50) DEFAULT NULL COMMENT '目标笼号',
  `operation_type` ENUM('move_in', 'move_out', 'cage_split', 'cage_merge') NOT NULL COMMENT '操作类型',
  `reason` TEXT COMMENT '操作原因',
  `operator` VARCHAR(100) DEFAULT NULL COMMENT '操作人',
  `operated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE CASCADE,
  INDEX `idx_animal_id` (`animal_id`),
  INDEX `idx_from_cage` (`from_cage`),
  INDEX `idx_to_cage` (`to_cage`),
  INDEX `idx_operation_type` (`operation_type`),
  INDEX `idx_operated_at` (`operated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='笼位转移日志表';

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
-- 种子数据：实验数据点
-- ========================================
INSERT INTO `experiment_data_points` (`experiment_id`, `animal_id`, `collected_at`, `metric_name`, `data_type`, `numeric_value`, `text_value`, `option_value`, `unit`, `notes`) VALUES
(1, 3, '2025-11-05 09:00:00', 'tumor_volume', 'numeric', 52.3000, NULL, NULL, 'mm³', '第1次测量'),
(1, 4, '2025-11-05 09:10:00', 'tumor_volume', 'numeric', 48.5000, NULL, NULL, 'mm³', '第1次测量'),
(1, 3, '2025-11-10 09:00:00', 'tumor_volume', 'numeric', 85.6000, NULL, NULL, 'mm³', '第2次测量'),
(1, 4, '2025-11-10 09:10:00', 'tumor_volume', 'numeric', 92.1000, NULL, NULL, 'mm³', '第2次测量'),
(1, 3, '2025-11-15 09:00:00', 'tumor_volume', 'numeric', 120.8000, NULL, NULL, 'mm³', '第3次测量'),
(1, 4, '2025-11-15 09:10:00', 'tumor_volume', 'numeric', 156.3000, NULL, NULL, 'mm³', '第3次测量'),
(1, 3, '2025-11-20 09:00:00', 'tumor_volume', 'numeric', 165.2000, NULL, NULL, 'mm³', '第4次测量'),
(1, 4, '2025-11-20 09:10:00', 'tumor_volume', 'numeric', 230.5000, NULL, NULL, 'mm³', '第4次测量'),
(1, 3, '2025-11-25 09:00:00', 'tumor_volume', 'numeric', 210.7000, NULL, NULL, 'mm³', '第5次测量'),
(1, 4, '2025-11-25 09:10:00', 'tumor_volume', 'numeric', 310.2000, NULL, NULL, 'mm³', '第5次测量'),
(1, 3, '2025-12-01 09:00:00', 'tumor_volume', 'numeric', 245.8000, NULL, NULL, 'mm³', '第6次测量'),
(1, 4, '2025-12-01 09:10:00', 'tumor_volume', 'numeric', 395.6000, NULL, NULL, 'mm³', '第6次测量'),
(1, 3, '2025-12-05 09:00:00', 'tumor_volume', 'numeric', 260.3000, NULL, NULL, 'mm³', '第7次测量'),
(1, 4, '2025-12-05 09:10:00', 'tumor_volume', 'numeric', 480.1000, NULL, NULL, 'mm³', '第7次测量'),
(1, 3, '2025-12-10 09:00:00', 'weight', 'numeric', 22.8000, NULL, NULL, 'g', '体重监测'),
(1, 4, '2025-12-10 09:10:00', 'weight', 'numeric', 18.5000, NULL, NULL, 'g', '体重监测，体重下降明显'),
(1, 3, '2025-11-05 09:00:00', 'weight', 'numeric', 24.1000, NULL, NULL, 'g', '初始体重'),
(1, 4, '2025-11-05 09:10:00', 'weight', 'numeric', 20.1000, NULL, NULL, 'g', '初始体重'),
(1, 3, '2025-12-10 09:00:00', 'general_condition', 'option', NULL, NULL, '良好', NULL, '整体状态评估'),
(1, 4, '2025-12-10 09:10:00', 'general_condition', 'option', NULL, NULL, '一般', NULL, '整体状态评估'),
(2, 6, '2025-10-20 10:00:00', 'ALT', 'numeric', 42.5000, NULL, NULL, 'U/L', '血清丙氨酸氨基转移酶'),
(2, 6, '2025-11-05 10:00:00', 'ALT', 'numeric', 58.3000, NULL, NULL, 'U/L', '血清丙氨酸氨基转移酶'),
(2, 6, '2025-11-20 10:00:00', 'ALT', 'numeric', 76.8000, NULL, NULL, 'U/L', '血清丙氨酸氨基转移酶，略有升高'),
(2, 6, '2025-12-05 10:00:00', 'ALT', 'numeric', 65.2000, NULL, NULL, 'U/L', '血清丙氨酸氨基转移酶'),
(2, 6, '2025-10-20 10:00:00', 'weight', 'numeric', 325.0000, NULL, NULL, 'g', '初始体重'),
(2, 6, '2025-11-20 10:00:00', 'weight', 'numeric', 310.5000, NULL, NULL, 'g', '体重监测'),
(2, 6, '2025-12-05 10:00:00', 'weight', 'numeric', 298.3000, NULL, NULL, 'g', '体重监测'),
(2, 6, '2025-12-10 14:00:00', 'behavior_note', 'text', NULL, '大鼠活动量减少，被毛蓬松，饮食量减少', NULL, NULL, '行为观察记录'),
(5, 11, '2025-09-10 10:00:00', 'ear_thickness', 'numeric', 0.2100, NULL, NULL, 'mm', '左耳厚度-给药前'),
(5, 12, '2025-09-10 10:10:00', 'ear_thickness', 'numeric', 0.2000, NULL, NULL, 'mm', '左耳厚度-给药前'),
(5, 11, '2025-09-20 10:00:00', 'ear_thickness', 'numeric', 0.6800, NULL, NULL, 'mm', '左耳厚度-激发后24h'),
(5, 12, '2025-09-20 10:10:00', 'ear_thickness', 'numeric', 0.8500, NULL, NULL, 'mm', '左耳厚度-激发后24h'),
(5, 11, '2025-10-01 10:00:00', 'ear_thickness', 'numeric', 0.3500, NULL, NULL, 'mm', '左耳厚度-恢复期'),
(5, 12, '2025-10-01 10:10:00', 'ear_thickness', 'numeric', 0.4200, NULL, NULL, 'mm', '左耳厚度-恢复期');

-- ========================================
-- 体检排班表
-- ========================================
CREATE TABLE IF NOT EXISTS `checkup_schedules` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `animal_id` INT NOT NULL COMMENT '动物ID',
  `scheduled_date` DATE NOT NULL COMMENT '计划检查日期',
  `time_slot` ENUM('morning', 'afternoon') NOT NULL DEFAULT 'morning' COMMENT '时间段',
  `veterinarian` VARCHAR(100) DEFAULT NULL COMMENT '负责兽医',
  `check_type` ENUM('routine', 'pre_experiment', 'post_treatment', 'follow_up') NOT NULL DEFAULT 'routine' COMMENT '检查类型',
  `priority` ENUM('normal', 'high', 'urgent') NOT NULL DEFAULT 'normal' COMMENT '优先级',
  `status` ENUM('scheduled', 'completed', 'missed', 'cancelled') NOT NULL DEFAULT 'scheduled' COMMENT '状态',
  `health_record_id` INT DEFAULT NULL COMMENT '关联健康记录ID',
  `notes` TEXT COMMENT '备注',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`health_record_id`) REFERENCES `health_records`(`id`) ON DELETE SET NULL,
  INDEX `idx_animal_id` (`animal_id`),
  INDEX `idx_scheduled_date` (`scheduled_date`),
  INDEX `idx_status` (`status`),
  INDEX `idx_priority` (`priority`),
  INDEX `idx_veterinarian` (`veterinarian`),
  INDEX `idx_check_type` (`check_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='体检排班表';

-- ========================================
-- 种子数据：体检排班
-- ========================================
INSERT INTO `checkup_schedules` (`animal_id`, `scheduled_date`, `time_slot`, `veterinarian`, `check_type`, `priority`, `status`, `notes`) VALUES
(1, '2026-01-15', 'morning', '张医生', 'routine', 'normal', 'scheduled', '月度例行体检'),
(2, '2026-01-15', 'morning', '张医生', 'routine', 'normal', 'scheduled', '月度例行体检'),
(3, '2026-01-16', 'afternoon', '李医生', 'pre_experiment', 'high', 'scheduled', '实验期间复查'),
(5, '2026-01-17', 'morning', '张医生', 'routine', 'normal', 'scheduled', '常规体检'),
(6, '2026-01-18', 'morning', '王医生', 'routine', 'normal', 'scheduled', 'SD大鼠定期体检'),
(7, '2026-01-12', 'afternoon', '王医生', 'follow_up', 'urgent', 'missed', '食欲下降复查，已逾期'),
(8, '2026-01-20', 'morning', '李医生', 'pre_experiment', 'high', 'scheduled', '行为学测试前体检'),
(9, '2026-01-22', 'morning', '赵医生', 'routine', 'normal', 'scheduled', '兔子定期体检'),
(10, '2026-01-25', 'morning', '赵医生', 'follow_up', 'high', 'scheduled', '检疫期第二次体检'),
(11, '2026-01-28', 'morning', '张医生', 'routine', 'normal', 'scheduled', '豚鼠定期体检'),
(12, '2026-01-28', 'morning', '张医生', 'routine', 'normal', 'scheduled', '豚鼠定期体检');

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

-- ========================================
-- 预警通知表
-- ========================================
CREATE TABLE IF NOT EXISTS `alerts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `animal_id` INT NOT NULL COMMENT '动物ID',
  `type` ENUM('health_abnormal', 'next_check_overdue', 'no_feeding_record') NOT NULL COMMENT '预警类型',
  `level` ENUM('warning', 'danger', 'info') NOT NULL DEFAULT 'warning' COMMENT '预警级别',
  `title` VARCHAR(200) NOT NULL COMMENT '预警标题',
  `message` TEXT COMMENT '预警详情',
  `status` ENUM('unread', 'read', 'resolved') NOT NULL DEFAULT 'unread' COMMENT '状态',
  `related_record_id` INT DEFAULT NULL COMMENT '关联记录ID',
  `related_record_type` VARCHAR(50) DEFAULT NULL COMMENT '关联记录类型',
  `triggered_at` DATETIME DEFAULT NULL COMMENT '触发时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE CASCADE,
  INDEX `idx_animal_id` (`animal_id`),
  INDEX `idx_type` (`type`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预警通知表';

-- ========================================
-- 繁殖记录表
-- ========================================
CREATE TABLE IF NOT EXISTS `breeding_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `male_id` INT NOT NULL COMMENT '雄性动物ID',
  `female_id` INT NOT NULL COMMENT '雌性动物ID',
  `pairing_date` DATE NOT NULL COMMENT '配对日期',
  `expected_birth_date` DATE DEFAULT NULL COMMENT '预计出生日期',
  `actual_birth_date` DATE DEFAULT NULL COMMENT '实际出生日期',
  `litter_count` INT DEFAULT NULL COMMENT '产仔数量',
  `survival_count` INT DEFAULT NULL COMMENT '存活数量',
  `male_count` INT DEFAULT NULL COMMENT '雄性幼崽数量',
  `female_count` INT DEFAULT NULL COMMENT '雌性幼崽数量',
  `status` ENUM('planned', 'pairing', 'pregnant', 'birthed', 'weaned', 'failed') NOT NULL DEFAULT 'planned' COMMENT '繁殖状态',
  `notes` TEXT COMMENT '备注',
  `operator` VARCHAR(100) DEFAULT NULL COMMENT '操作人',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`male_id`) REFERENCES `animals`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`female_id`) REFERENCES `animals`(`id`) ON DELETE CASCADE,
  INDEX `idx_male_id` (`male_id`),
  INDEX `idx_female_id` (`female_id`),
  INDEX `idx_pairing_date` (`pairing_date`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='繁殖记录表';

-- ========================================
-- 种子数据：谱系关系（给部分动物设置父母）
-- ========================================
UPDATE `animals` SET `father_id` = 1, `mother_id` = 2 WHERE `id` = 3;
UPDATE `animals` SET `father_id` = 1, `mother_id` = 2 WHERE `id` = 4;
UPDATE `animals` SET `father_id` = 6, `mother_id` = 7 WHERE `id` = 8;
UPDATE `animals` SET `father_id` = 11, `mother_id` = 12 WHERE `id` = 5;

-- ========================================
-- 种子数据：繁殖记录
-- ========================================
INSERT INTO `breeding_records` (`male_id`, `female_id`, `pairing_date`, `actual_birth_date`, `litter_count`, `survival_count`, `male_count`, `female_count`, `status`, `notes`, `operator`) VALUES
(1, 2, '2025-05-20', '2025-07-01', 8, 6, 3, 3, 'weaned', '第一胎繁殖，幼崽健康', '张饲养员'),
(6, 7, '2025-04-10', '2025-06-01', 10, 8, 5, 3, 'weaned', 'SD大鼠繁殖，生长良好', '王饲养员'),
(11, 12, '2025-06-15', '2025-08-10', 4, 3, 2, 1, 'weaned', '豚鼠繁殖，其中1只死亡', '李饲养员'),
(9, 10, '2026-01-10', NULL, NULL, NULL, NULL, NULL, 'pairing', '新西兰白兔配对中，观察受孕情况', '赵饲养员');

-- ========================================
-- 饲养计划表
-- ========================================
CREATE TABLE IF NOT EXISTS `feeding_plans` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `plan_name` VARCHAR(200) NOT NULL COMMENT '计划名称',
  `target_type` ENUM('animal', 'cage') NOT NULL DEFAULT 'animal' COMMENT '目标类型',
  `animal_id` INT DEFAULT NULL COMMENT '动物ID',
  `cage_number` VARCHAR(50) DEFAULT NULL COMMENT '笼号',
  `food_type` VARCHAR(100) NOT NULL COMMENT '饲料类型',
  `quantity` DECIMAL(10, 2) DEFAULT NULL COMMENT '计划喂养量',
  `unit` VARCHAR(20) DEFAULT 'g' COMMENT '单位',
  `water_ml` DECIMAL(10, 2) DEFAULT NULL COMMENT '饮水量(ml)',
  `feed_time` TIME NOT NULL COMMENT '计划喂养时间',
  `repeat_type` ENUM('daily', 'weekly', 'cron') NOT NULL DEFAULT 'daily' COMMENT '重复类型',
  `repeat_days` VARCHAR(50) DEFAULT NULL COMMENT '每周重复日(1-7,逗号分隔,1=周一)',
  `cron_expression` VARCHAR(100) DEFAULT NULL COMMENT 'Cron表达式',
  `feeder` VARCHAR(100) DEFAULT NULL COMMENT '负责人',
  `start_date` DATE NOT NULL COMMENT '有效期开始日期',
  `end_date` DATE DEFAULT NULL COMMENT '有效期结束日期',
  `status` ENUM('active', 'paused', 'expired') NOT NULL DEFAULT 'active' COMMENT '状态',
  `notes` TEXT COMMENT '备注',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE SET NULL,
  INDEX `idx_animal_id` (`animal_id`),
  INDEX `idx_cage_number` (`cage_number`),
  INDEX `idx_status` (`status`),
  INDEX `idx_start_date` (`start_date`),
  INDEX `idx_end_date` (`end_date`),
  INDEX `idx_repeat_type` (`repeat_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='饲养计划表';

-- ========================================
-- 饲养任务表
-- ========================================
CREATE TABLE IF NOT EXISTS `feeding_tasks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `plan_id` INT DEFAULT NULL COMMENT '关联计划ID',
  `animal_id` INT NOT NULL COMMENT '动物ID',
  `task_date` DATE NOT NULL COMMENT '任务日期',
  `task_time` TIME NOT NULL COMMENT '计划喂养时间',
  `food_type` VARCHAR(100) NOT NULL COMMENT '饲料类型',
  `quantity` DECIMAL(10, 2) DEFAULT NULL COMMENT '计划喂养量',
  `unit` VARCHAR(20) DEFAULT 'g' COMMENT '单位',
  `water_ml` DECIMAL(10, 2) DEFAULT NULL COMMENT '饮水量(ml)',
  `feeder` VARCHAR(100) DEFAULT NULL COMMENT '负责人',
  `status` ENUM('pending', 'completed', 'missed', 'cancelled') NOT NULL DEFAULT 'pending' COMMENT '状态',
  `feeding_record_id` INT DEFAULT NULL COMMENT '关联饲养记录ID',
  `completed_at` DATETIME DEFAULT NULL COMMENT '完成时间',
  `notes` TEXT COMMENT '备注',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`plan_id`) REFERENCES `feeding_plans`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`animal_id`) REFERENCES `animals`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`feeding_record_id`) REFERENCES `feeding_records`(`id`) ON DELETE SET NULL,
  INDEX `idx_plan_id` (`plan_id`),
  INDEX `idx_animal_id` (`animal_id`),
  INDEX `idx_task_date` (`task_date`),
  INDEX `idx_status` (`status`),
  INDEX `idx_feeding_record_id` (`feeding_record_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='饲养任务表';

-- ========================================
-- 种子数据：饲养计划
-- ========================================
INSERT INTO `feeding_plans` (`plan_name`, `target_type`, `animal_id`, `food_type`, `quantity`, `unit`, `water_ml`, `feed_time`, `repeat_type`, `repeat_days`, `feeder`, `start_date`, `end_date`, `status`, `notes`) VALUES
('小鼠A-101笼每日早餐', 'cage', NULL, '标准啮齿类动物饲料', 5.00, 'g', 8.00, '08:00:00', 'daily', NULL, '小李', '2026-01-01', '2026-12-31', 'active', 'A-101笼小鼠每日早餐'),
('小鼠A-101笼每日晚餐', 'cage', NULL, '标准啮齿类动物饲料', 5.00, 'g', 7.50, '17:00:00', 'daily', NULL, '小王', '2026-01-01', '2026-12-31', 'active', 'A-101笼小鼠每日晚餐'),
('大鼠B-201笼每日喂养', 'cage', NULL, '标准大鼠饲料', 25.00, 'g', 35.00, '08:30:00', 'daily', NULL, '小张', '2026-01-01', '2026-12-31', 'active', 'B-201笼大鼠每日喂养'),
('实验动物M-003高脂饲料', 'animal', 3, '实验专用饲料-高脂', 6.00, 'g', 8.50, '09:00:00', 'daily', NULL, '小李', '2026-01-01', '2026-03-01', 'active', '实验期间特殊饮食'),
('豚鼠周末维C补充', 'cage', NULL, '豚鼠专用饲料+维C蔬菜', 35.00, 'g', 50.00, '10:00:00', 'weekly', '6,7', '小李', '2026-01-01', '2026-12-31', 'active', '周末额外补充维C蔬菜');

-- ========================================
-- 种子数据：饲养任务（未来几天）
-- ========================================
INSERT INTO `feeding_tasks` (`plan_id`, `animal_id`, `task_date`, `task_time`, `food_type`, `quantity`, `unit`, `water_ml`, `feeder`, `status`, `notes`) VALUES
(1, 1, '2026-06-08', '08:00:00', '标准啮齿类动物饲料', 5.00, 'g', 8.00, '小李', 'pending', ''),
(1, 2, '2026-06-08', '08:00:00', '标准啮齿类动物饲料', 5.00, 'g', 8.00, '小李', 'pending', ''),
(2, 1, '2026-06-08', '17:00:00', '标准啮齿类动物饲料', 5.00, 'g', 7.50, '小王', 'pending', ''),
(2, 2, '2026-06-08', '17:00:00', '标准啮齿类动物饲料', 5.00, 'g', 7.50, '小王', 'pending', ''),
(3, 6, '2026-06-08', '08:30:00', '标准大鼠饲料', 25.00, 'g', 35.00, '小张', 'pending', ''),
(3, 7, '2026-06-08', '08:30:00', '标准大鼠饲料', 25.00, 'g', 35.00, '小张', 'pending', ''),
(4, 3, '2026-06-08', '09:00:00', '实验专用饲料-高脂', 6.00, 'g', 8.50, '小李', 'pending', '实验期间特殊饮食'),
(1, 1, '2026-06-09', '08:00:00', '标准啮齿类动物饲料', 5.00, 'g', 8.00, '小李', 'pending', ''),
(1, 2, '2026-06-09', '08:00:00', '标准啮齿类动物饲料', 5.00, 'g', 8.00, '小李', 'pending', ''),
(3, 6, '2026-06-09', '08:30:00', '标准大鼠饲料', 25.00, 'g', 35.00, '小张', 'pending', '');
