---
sidebar_position: 2
---

# ESP32-S3智能小车项目

基于ESP32-S3芯片开发的智能小车解决方案，集成Wi-Fi/蓝牙控制、视觉识别、自动巡航等功能。

## 项目概述

### 项目特点
- **主控芯片**：ESP32-S3-WROOM-1 (Xtensa双核，240MHz)
- **无线控制**：Wi-Fi AP模式 + 蓝牙BLE遥控
- **驱动方案**：双路H桥电机驱动
- **扩展功能**：超声波测距、红外循迹、摄像头扩展

### 功能实现
```
智能小车功能清单
    │
    ├── 基础控制
    │       ├── 前进/后退/左转/右转
    │       ├── 速度PWM调节
    │       └── 紧急停止
    │
    ├── 无线遥控
    │       ├── Wi-Fi手机控制 (Web界面)
    │       ├── 蓝牙手柄支持
    │       └── 多车编队控制
    │
    ├── 自主导航
    │       ├── 超声波避障
    │       ├── 红外循迹
    │       └── 巡线导航
    │
    └── 扩展功能
            ├── 摄像头图传
            ├── 语音控制
            └── 语音播报
```

## 硬件方案

### 硬件选型清单

| 模块 | 型号 | 数量 | 说明 |
|------|------|------|------|
| 主控 | ESP32-S3-DevKitC-1 | 1 | 开发板 |
| 电机驱动 | L298N / TB6612FNG | 1 | 双H桥 |
| 直流电机 | 直流减速电机 12V | 4 | 麦克纳姆轮 |
| 传感器 | HC-SR04超声波 | 4 | 避障检测 |
| 传感器 | TCRT5000红外 | 4 | 循迹模块 |
| 电源 | 12V锂电池 / 3S锂电 | 1 | 供电 |
| 稳压 | LM2596 / MP1584 | 1 | 降压5V |
| 扩展 | ESP32-CAM | 1 | 图像采集(可选) |

### 硬件连接图

```
ESP32-S3                     电机驱动(L298N)
┌─────────────┐            ┌─────────────────┐
│             │            │                 │
│    GPIO 0  ─┼────────────► IN1 (Motor A)  │
│    GPIO 1  ─┼────────────► IN2 (Motor A)  │
│    GPIO 2  ─┼────────────► IN3 (Motor B)  │
│    GPIO 3  ─┼────────────► IN4 (Motor B)  │
│             │            │                 │
│    GPIO 4  ─┼────────────► ENA (PWM A)    │
│    GPIO 5  ─┼────────────► ENB (PWM B)    │
│             │            └─────────────────┘
│   GPIO 6~9  │                  ▲
│   (超声波)  │                  │
└─────────────┘            ┌────┴────┐
                           │  DC Motors │
                           │  × 4      │
                           └───────────┘

超声波传感器 (×4)
┌──────────────┐
│  TRIG ── GPIO 6 │
│  ECHO ── GPIO 7 │
│  VCC  ── 5V     │
│  GND  ── GND   │
└──────────────┘
```

### 原理图说明

```
电源系统
┌─────────────────────────────────────┐
│  12V锂电池 (11.1V ~ 12.6V)           │
└────────────┬────────────────────────┘
             │
             ▼
    ┌────────────────┐
    │  LM2596 降压模块  │──────► 5V (给ESP32、超声波供电)
    └────────────────┘
             │
             ▼
    ┌────────────────┐
    │  5V → 3.3V LDO  │──────► 3.3V (给传感器供电)
    └────────────────┘
```

## 软件设计

### ESP-IDF项目结构

```
esp32_smart_car/
├── main/
│   ├── main.c              # 主程序入口
│   ├── motor.c             # 电机驱动
│   ├── motor.h
│   ├── wifi_control.c       # Wi-Fi控制
│   ├── wifi_control.h
│   ├── ble_control.c        # 蓝牙控制
│   ├── ble_control.h
│   ├── ultrasonic.c         # 超声波驱动
│   ├── ultrasonic.h
│   ├── infrared.c           # 红外循迹
│   ├── infrared.h
│   └── wifi_server.c        # Web服务器
│
├── components/
│   ├── esp_camera/          # 摄像头组件
│   └── buzzer/               # 蜂鸣器
│
├── CMakeLists.txt
├── partitions.csv
└── Kconfig.projbuild
```

### 核心代码实现

#### 1. 电机驱动
```c
// motor.h
#ifndef MOTOR_H
#define MOTOR_H

#include "driver/mcpwm.h"

// 电机引脚定义
#define MOTOR_A_IN1  GPIO_NUM_0
#define MOTOR_A_IN2  GPIO_NUM_1
#define MOTOR_B_IN1  GPIO_NUM_2
#define MOTOR_B_IN2  GPIO_NUM_3
#define MOTOR_A_PWM  GPIO_NUM_4
#define MOTOR_B_PWM  GPIO_NUM_5

// 电机方向
typedef enum {
    MOTOR_FORWARD = 0,
    MOTOR_BACKWARD,
    MOTOR_STOP
} motor_direction_t;

// 函数声明
void motor_init(void);
void motor_set_speed(motor_direction_t dir, uint16_t speed);
void motor_control(uint8_t left_speed, uint8_t right_speed);

#endif
```

```c
// motor.c
#include "motor.h"

void motor_init(void)
{
    // 配置GPIO
    gpio_config_t io_conf = {
        .pin_bit_mask = (1ULL << MOTOR_A_IN1) | (1ULL << MOTOR_A_IN2) |
                       (1ULL << MOTOR_B_IN1) | (1ULL << MOTOR_B_IN2),
        .mode = GPIO_MODE_OUTPUT,
    };
    gpio_config(&io_conf);

    // 配置PWM (MCPWM)
    mcpwm_gpio_init(MCPWM_UNIT_0, MCPWM0A, MOTOR_A_PWM);
    mcpwm_gpio_init(MCPWM_UNIT_0, MCPWM0B, MOTOR_B_PWM);

    mcpwm_config_t pwm_config = {
        .frequency = 10000,  // 10KHz
        .cmpr_a = 0,
        .cmpr_b = 0,
        .duty_mode = MCPWM_DUTY_MODE_0,
        .counter_mode = MCPWM_UP_COUNTER,
    };
    mcpwm_init(MCPWM_UNIT_0, MCPWM_TIMER_0, &pwm_config);
}

void motor_control(uint8_t left_speed, uint8_t right_speed)
{
    // 左电机
    mcpwm_set_duty(MCPWM_UNIT_0, MCPWM_TIMER_0, MCPWM_OPR_A, left_speed);
    // 右电机
    mcpwm_set_duty(MCPWM_UNIT_0, MCPWM_TIMER_0, MCPWM_OPR_B, right_speed);
}
```

#### 2. Wi-Fi Web控制服务器
```c
// wifi_server.c
#include "esp_http_server.h"
#include "motor.h"

// HTML页面
static const char HTML_PAGE[] = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
    <title>ESP32-S3 Smart Car</title>
    <meta name="viewport" content="width=device-width">
    <style>
        body { font-family: Arial; text-align: center; }
        .control-btn {
            width: 80px; height: 80px;
            font-size: 24px;
            margin: 5px;
            border-radius: 10px;
        }
        .speed-control { margin: 20px; }
    </style>
</head>
<body>
    <h1>ESP32-S3 Smart Car Control</h1>
    <div class="speed-control">
        Speed: <input type="range" id="speed" min="0" max="100" value="50">
    </div>
    <div>
        <button class="control-btn" onclick="sendCmd('F')">▲</button>
    </div>
    <div>
        <button class="control-btn" onclick="sendCmd('L')">◄</button>
        <button class="control-btn" onclick="sendCmd('S')">●</button>
        <button class="control-btn" onclick="sendCmd('R')">►</button>
    </div>
    <div>
        <button class="control-btn" onclick="sendCmd('B')">▼</button>
    </div>
    <script>
        function sendCmd(cmd) {
            var speed = document.getElementById('speed').value;
            fetch('/control?cmd=' + cmd + '&speed=' + speed);
        }
    </script>
</body>
</html>
)rawliteral";

static esp_err_t index_handler(httpd_req_t *req)
{
    httpd_resp_send(req, HTML_PAGE, HTTPD_RESP_USE_STRLEN);
    return ESP_OK;
}

static esp_err_t control_handler(httpd_req_t *req)
{
    char buf[100];
    httpd_req_get_url_query_str(req, buf, sizeof(buf));

    char cmd[10], speed[10];
    httpd_query_key_value(buf, "cmd", cmd, sizeof(cmd));
    httpd_query_key_value(buf, "speed", speed, sizeof(speed));

    int s = atoi(speed);

    switch(cmd[0]) {
        case 'F': motor_control(s, s); break;      // 前进
        case 'B': motor_control(-s, -s); break;    // 后退
        case 'L': motor_control(-s/2, s); break;   // 左转
        case 'R': motor_control(s, -s/2); break;   // 右转
        case 'S': motor_control(0, 0); break;      // 停止
    }

    httpd_resp_send(req, "OK", 2);
    return ESP_OK;
}

httpd_handle_t start_webserver(void)
{
    httpd_config_t config = HTTPD_DEFAULT_CONFIG();
    httpd_handle_t server = NULL;

    httpd_start(&server, &config);
    httpd_register_uri_handler(server, &(httpd_uri_t){
        .uri = "/", .method = HTTP_GET, .handler = index_handler
    });
    httpd_register_uri_handler(server, &(httpd_uri_t){
        .uri = "/control", .method = HTTP_GET, .handler = control_handler
    });

    return server;
}
```

#### 3. 蓝牙遥控
```c
// ble_control.c
#include "esp_nimble_hci.h"
#include "nimble/nimble_port.h"
#include "host/ble_hs.h"
#include "host/util/util.h"

// BLE UUID
#define BLE_SVC_UUID "180D"
#define BLE_CHAR_UUID "2A37"

// 遥控指令回调
static int ble_on_rx(uint16_t conn_handle, uint16_t attr_handle,
                     uint8_t *rx_data, size_t len)
{
    char cmd = rx_data[0];
    switch(cmd) {
        case 'F': motor_control(80, 80); break;
        case 'B': motor_control(-80, -80); break;
        case 'L': motor_control(-40, 80); break;
        case 'R': motor_control(80, -40); break;
        case 'S': motor_control(0, 0); break;
    }
    return 0;
}
```

## 项目开源方案参考

### 优质GitHub项目

| 项目 | 链接 | 说明 |
|------|------|------|
| **ESP32 Wi-Fi Car** | https://github.com/wolff127/ESP32-WiFi-Car | Web控制的智能小车 |
| **ESP32 BLE RC Car** | https://github.com/wolff127/ESP32-BLE-RC-CAR | 蓝牙遥控小车 |
| **2-Wheel Robot** | https://github.com/G6EJD/ESP32-2-wheel-robot | 双轮机器人 |
| **ESP32 Cam Robot** | https://github.com/JanGamer05/ESP32-Cam-Robot-Car | 摄像头图传小车 |
| **Line Follower** | https://github.com/Robotics-URJC/Line-follower | 循迹智能车 |

### 电路设计参考
| 项目 | 链接 |
|------|------|
| ESP32智能小车原理图 | https://github.com/wolff127/ESP32-WiFi-Car |
| TB6612驱动模块 | https://github.com/sparkfun/SparkFun_TB6612FNG |

## 电赛实战经验

### 赛前准备清单

```
□ 硬件准备
  ├── 主控板 × 2 (备用)
  ├── 电机驱动 × 2
  ├── 传感器套装 (超声波/红外/摄像头)
  ├── 电源管理模块
  └── 杜邦线、面包板、焊接工具

□ 软件准备
  ├── ESP-IDF环境配置完成
  ├── 基础驱动代码模块化
  ├── 调试好的PID参数
  └── 应急预案代码备份

□ 工具准备
  ├── 万用表、示波器
  ├── 逻辑分析仪
  ├── 热熔胶枪、胶带
  └── 备用的电机和轮子
```

### 比赛时间分配

| 阶段 | 时间 | 任务 |
|------|------|------|
| 搭建 | 0-2h | 硬件组装、接线检查 |
| 调试 | 2-6h | 基础功能调试 |
| 优化 | 6-10h | 算法优化、参数调整 |
| 测试 | 10-14h | 模拟测试、应急预案 |
| 备份 | 14-16h | 代码备份、文档整理 |

### 常见问题与解决

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 电机不转 | 电源/驱动问题 | 检查电源电压、驱动芯片 |
| Wi-Fi断连 | 信号干扰/功耗不足 | 增加电容、独立供电 |
| 循迹不稳定 | 传感器阈值问题 | 重新校准、遮光处理 |
| 超声波误触发 | 信号干扰 | 增加滤波、软件消抖 |

---

*智能小车是电赛经典项目，ESP32-S3凭借Wi-Fi+蓝牙双模和强大算力，是非常合适的选择。*
