---
sidebar_position: 4
---

# 电子设计竞赛经验分享

全国大学生电子设计竞赛（电赛）经验总结，涵盖赛前准备、赛中策略、代码架构、调试技巧等方面。

## 电赛概述

### 竞赛简介
全国大学生电子设计竞赛是教育部倡导的大学生学科竞赛之一，每两年举办一次（单数年），比赛时间4天3夜。

### 竞赛类别
| 方向 | 内容 |
|------|------|
| **控制类** | 无人机、智能小车、循迹、云台 |
| **电源类** | 开关电源、功率放大 |
| **信号处理** | 滤波、频谱分析、信号发生 |
| **仪器仪表** | 示波器、万用表升级 |
| **通信类** | 无线通信、射频电路 |

### 嵌入式相关赛题分布
```
电赛题目分析 (近5年)
    │
    ├── 2023年
    │       ├── A题: 电流信号检测 (STM32)
    │       ├── D题: 简易电路特性仪 (硬件+软件)
    │       ├── H题: 送药小车 (STM32/C2000)  ← 控制类
    │       └── K题: 立体货架 (STM32)
    │
    ├── 2021年
    │       ├── C题: 智能送药小车 (ESP32视觉) ← 控制+视觉
    │       ├── F题: 送药小车 (STM32)
    │       └── G题: 玩具音乐小镇 (STM32)
    │
    └── 2019年
            ├── C题: 线路负载及故障检测 (STM32)
            ├── E题: 模拟电磁曲射炮 (STM32)
            └── H题: 纸张计数 (STM32)
```

## 赛前准备清单

### 知识储备
```
必备技能
    │
    ├── 硬件基础
    │       ├── 电路原理图阅读
    │       ├── PCB布局布线基础
    │       ├── 常用传感器原理
    │       └── 电源设计 (LDO/DC-DC)
    │
    ├── 单片机开发
    │       ├── GPIO/定时器/中断
    │       ├── UART/SPI/I2C通信
    │       ├── ADC/DAC使用
    │       ├── PWM输出
    │       └── DMA数据传输
    │
    ├── 外设驱动
    │       ├── 电机驱动 (L298/TB6612)
    │       ├── 传感器 (超声波/红外/摄像头)
    │       ├── 无线模块 (ESP32/NRF24L01)
    │       └── 显示模块 (OLED/LCD)
    │
    └── 算法能力
            ├── PID控制
            ├── 滤波算法 (卡尔曼/互补滤波)
            ├── 图像处理基础
            └── 控制理论
```

### 模块化代码框架

```
esp32-framework/
├── main/
│   ├── main.c              # 入口、任务创建
│   ├── config.h           # 所有配置参数
│   │
│   ├── drivers/           # 驱动层
│   │   ├── gpio.h/.c
│   │   ├── pwm.h/.c
│   │   ├── uart.h/.c
│   │   ├── i2c.h/.c
│   │   ├── spi.h/.c
│   │   ├── timer.h/.c
│   │   ├── encoder.h/.c
│   │   └── adc.h/.c
│   │
│   ├── devices/          # 设备层
│   │   ├── motor.h/.c
│   │   ├── servo.h/.c
│   │   ├── ultrasonic.h/.c
│   │   ├── infrared.h/.c
│   │   ├── mpu6050.h/.c
│   │   ├── oled.h/.c
│   │   └── camera.h/.c
│   │
│   ├── algorithms/      # 算法层
│   │   ├── pid.h/.c
│   │   ├── kalman.h/.c
│   │   ├── fusion.h/.c
│   │   └── control.h/.c
│   │
│   ├── tasks/           # 任务层
│   │   ├── control_task.c
│   │   ├── sensor_task.c
│   │   └── communication_task.c
│   │
│   └── utils/           # 工具
│       ├── filter.h/.c
│       ├── math_utils.h/.c
│       └── debug.h/.c
│
├── components/         # 第三方组件
│   ├── esp-dsp/
│   ├── lvgl/          # GUI库
│   └── jsmn/          # JSON解析
│
├── CMakeLists.txt
└── Kconfig.projbuild
```

### 配置文件示例
```c
// config.h
#ifndef CONFIG_H
#define CONFIG_H

// ============== 电机参数 ==============
#define MOTOR_PWM_FREQ      20000    // 20KHz
#define MOTOR_MAX_DUTY      1000
#define MOTOR_DEAD_ZONE     50

// ============== PID参数 ==============
// 速度环
#define SPEED_KP            5.0f
#define SPEED_KI            0.1f
#define SPEED_KD            0.0f

// 角度环
#define ANGLE_KP            10.0f
#define ANGLE_KI            0.0f
#define ANGLE_KD            0.5f

// ============== 传感器阈值 ==============
#define ULTRASONIC_MAX      400      // cm
#define INFRARED_THRESHOLD  800

// ============== 通信参数 ==============
#define UART_BAUD           115200
#define WIFI_SSID           "ESP32_CAR"
#define WIFI_PASSWORD       "12345678"

// ============== 调试开关 ==============
#define DEBUG_MODE          1
#define ENABLE_LOG          1

#endif
```

## 赛中策略

### 时间分配建议

| 阶段 | 时间 | 任务 | 输出 |
|------|------|------|------|
| **Day 1** | 0-4h | 题目分析、方案设计 | 方案文档 |
| | 4-12h | 硬件准备、核心代码 | 驱动测试 |
| | 12-24h | 基础功能实现 | 单项测试 |
| **Day 2** | 24-32h | 联合调试 | 联调记录 |
| | 32-48h | 算法优化 | 性能测试 |
| **Day 3** | 48-60h | 稳定性测试 | 测试报告 |
| | 60-72h | 文档撰写 | 设计报告 |
| **Day 4** | 72-84h | 备份、应急预案 | 最终版本 |

### 方案设计原则

```
方案选择标准
    │
    ├── 稳定性 > 功能性
    │       └── 简单可靠的方案 > 复杂炫技的方案
    │
    ├── 成熟方案 > 创新方案
    │       └── 使用验证过的方案减少风险
    │
    ├── 模块化设计
    │       └── 方便替换、调试、排错
    │
    └── 留有冗余
            └── 引脚、功能预留
```

### 调试技巧

#### 1. 串口调试
```c
// 分级日志系统
#define LOG_LEVEL LOG_INFO

#define LOG_DEBUG(fmt, ...) \
    do { if (LOG_LEVEL <= LOG_DEBUG) printf("[DEBUG] " fmt "\n", ##__VA_ARGS__); } while(0)

#define LOG_INFO(fmt, ...) \
    do { if (LOG_LEVEL <= LOG_INFO) printf("[INFO] " fmt "\n", ##__VA_ARGS__); } while(0)

#define LOG_ERROR(fmt, ...) \
    do { if (LOG_LEVEL <= LOG_ERROR) printf("[ERROR] " fmt "\n", ##__VA_ARGS__); } while(0)

// 使用示例
LOG_INFO("Motor speed: %d", speed);
LOG_DEBUG("IMU angle: %.2f", angle);

// 关键数据上报 (用于上位机分析)
void report_debug_data(float pitch, float roll, float yaw,
                      int16_t motor1_speed, int16_t motor2_speed)
{
    printf("DATA:%.2f,%.2f,%.2f,%d,%d\n",
           pitch, roll, yaw, motor1_speed, motor2_speed);
}
```

#### 2. 示波器定位问题
```
调试步骤
    1. 怀疑点测波形
    2. 对比预期波形
    3. 逐级往前排查
    4. 定位问题模块
```

#### 3. 常见问题快速排查
```c
// 问题排查清单
// 1. 模块不工作
//    - 电源是否正常? (万用表测电压)
//    - 接线是否正确? (检查杜邦线)
//    - 初始化返回值? (添加打印)

// 2. 数据异常
//    - 传感器本身? (换传感器测试)
//    - 接线/干扰? (检查屏蔽/接地)
//    - 算法问题? (串口输出原始值检查)

// 3. 控制不稳定
//    - 采样频率是否稳定? (示波器测中断)
//    - PID参数是否合适? (从低P开始调)
//    - 机械结构问题? (检查松动/卡顿)
```

## ESP32开发技巧

### Wi-Fi调试
```c
// 开启AP模式建立调试服务器
void start_debug_server(void)
{
    // 创建AP
    wifi_config_t ap_config = {
        .ap = {
            .ssid = "ESP32_DEBUG",
            .ssid_len = 10,
            .password = "12345678",
            .max_connection = 1,
        },
    };

    ESP_ERROR_CHECK(esp_wifi_set_mode(WIFI_MODE_AP));
    ESP_ERROR_CHECK(esp_wifi_set_config(WIFI_IF_AP, &ap_config));
    ESP_ERROR_CHECK(esp_wifi_start());

    // 创建HTTP服务器用于在线调参
    httpd_config_t config = HTTPD_DEFAULT_CONFIG();
    httpd_start(&debug_server, &config);
    // 注册调参URI
}
```

### 在线参数调优
```c
// Web调参页面关键代码
static const char PARAMS_PAGE[] = R"rawliteral(
<!DOCTYPE html>
<html>
<head><title>ESP32 Online Tuning</title></head>
<body>
<h1>PID Parameters</h1>
<table>
<tr><td>Speed Kp:</td><td><input type="range" id="speed_kp" min="0" max="20" step="0.1" value="5"></td><td id="v_speed_kp">5</td></tr>
<tr><td>Speed Ki:</td><td><input type="range" id="speed_ki" min="0" max="1" step="0.01" value="0.1"></td><td id="v_speed_ki">0.1</td></tr>
</table>
<script>
// 实时同步参数到ESP32
</script>
</body>
</html>
)rawliteral";
```

### 固件备份与恢复
```bash
# 固件备份
esptool.py --port COM3 read_flash 0x1000 0x3E0000 backup.bin

# 固件恢复
esptool.py --port COM3 write_flash 0x1000 backup.bin
```

## 常用传感器驱动速查

### 超声波 HC-SR04
```c
#define TRIG_PIN  GPIO_NUM_0
#define ECHO_PIN  GPIO_NUM_1

float ultrasonic_distance(void)
{
    // 发送触发信号
    gpio_set_level(TRIG_PIN, 1);
    ets_delay_us(10);
    gpio_set_level(TRIG_PIN, 0);

    // 等待回响
    int64_t start = esp_timer_get_time();
    while(gpio_get_level(ECHO_PIN) == 0) {
        if (esp_timer_get_time() - start > 25000) return -1;
    }
    start = esp_timer_get_time();
    while(gpio_get_level(ECHO_PIN) == 1) {
        if (esp_timer_get_time() - start > 25000) return -1;
    }

    // 计算距离 (声音速度340m/s, 来回/2)
    int64_t duration = esp_timer_get_time() - start;
    return duration * 340.0 / 2.0 / 1000000.0 * 100.0; // cm
}
```

### 编码器读取
```c
// 正交编码器 (如AS5600)
#define ENCODER_A  GPIO_NUM_2
#define ENCODER_B  GPIO_NUM_3

static int64_t encoder_count = 0;

void IRAM_ATTR encoder_isr(void *arg)
{
    int a = gpio_get_level(ENCODER_A);
    int b = gpio_get_level(ENCODER_B);
    encoder_count += (a == b) ? 1 : -1;
}

void encoder_init(void)
{
    gpio_set_intr_type(ENCODER_A, GPIO_INTR_ANYEDGE);
    gpio_isr_handler_add(ENCODER_A, encoder_isr, NULL);
}
```

## 应急预案

### 常见故障与备选方案

| 故障情况 | 应急方案 |
|----------|----------|
| 主控芯片损坏 | 备用ESP32/STM32板 |
| 电机驱动损坏 | 备用驱动板 (L298备用) |
| 传感器失效 | 代码切换到无传感器方案 |
| 代码跑飞 | 看门狗复位 + 应急停止 |
| 电源不稳定 | 加大滤波电容 + 备用电池 |

### 代码版本管理
```bash
# 每日代码备份
git add -A && git commit -m "Day2: 完成基础循迹功能"

# 重要版本tag
git tag -a v1.0 -m "基础功能完成"
git tag -a v2.0 -m "PID调优完成"
```

## 赛后总结

### 文档整理
- [ ] 设计报告完整版
- [ ] 代码注释完善
- [ ] 电路原理图
- [ ] PCB文件 (如适用)
- [ ] 测试数据记录
- [ ] 参赛总结

### 经验沉淀
```
收获总结模板
    │
    ├── 技术收获
    │       ├── 掌握了哪些新技能?
    │       └── 哪些地方可以做得更好?
    │
    ├── 团队协作
    │       ├── 分工是否合理?
    │       └── 沟通方式可以改进吗?
    │
    └── 个人成长
            ├── 时间管理?
            └── 抗压能力?
```

---

*电赛是一次综合能力的考验，充分的准备和良好的心态同样重要。祝你取得好成绩！*
