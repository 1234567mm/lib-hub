---
sidebar_position: 3
---

# ESP32-S3无刷云台项目

基于ESP32-S3芯片开发的二轴无刷云台解决方案，集成IMU惯性测量、姿态解算、闭环控制等功能。

## 项目概述

### 项目特点
- **主控芯片**：ESP32-S3 (双核240MHz + AI向量指令)
- **电机驱动**：FOC驱动器 (BLDC无刷直流)
- **姿态传感**：MPU6050 / BMI088 (6轴/9轴IMU)
- **控制算法**：串级PID + 姿态解算
- **通信接口**：Wi-Fi实时调参 + 蓝牙遥控

### 功能实现
```
无刷云台功能清单
    │
    ├── 基础控制
    │       ├── 俯仰角控制 (Pitch): ±90°
    │       ├── 横滚角控制 (Roll): ±45°
    │       └── 航向角控制 (Yaw): 360°
    │
    ├── 传感器融合
    │       ├── 加速度计数据采集
    │       ├── 陀螺仪数据采集
    │       └── 互补滤波/卡尔曼滤波
    │
    ├── 控制算法
    │       ├── 内环：角速度环 (P)
    │       ├── 外环：角度环 (PID)
    │       └── 前馈控制 (加速度前馈)
    │
    └── 扩展功能
            ├── Wi-Fi无线调参
            ├── 蓝牙遥控
            └── 摄像头防抖扩展
```

## 硬件方案

### 硬件选型清单

| 模块 | 型号 | 数量 | 说明 |
|------|------|------|------|
| 主控 | ESP32-S3-DevKitC-1 | 1 | 开发板 |
| IMU | MPU6050 / BMI088 | 1 | 6轴/9轴惯性测量 |
| 电机 | 无刷直流电机 2206 / 2208 | 2 | 云台专用 |
| 驱动器 | DRV8313 / L6234 | 2 | 三相H桥 |
| 编码器 | AS5600 | 2 | 磁编码器 |
| 电源 | 3S锂电池 (11.1V) | 1 | 供电 |
| 稳压 | MP1584 / AMS1117 | 2 | 降压3.3V/5V |

### 云台机械结构

```
俯仰轴 (Pitch)
    ┌──────────────┐
    │   摄像头      │ ◄── 负载
    │  ┌────────┐  │
    │  │  电机  │──┼──► 俯仰运动
    └──┼────────┼──┘
       └────┬───┘
            │
       横滚轴 (Roll)
            │
    ┌───────┼───────┐
    │       │       │
    │   ┌──┴──┐   │
    │   │ 电机 │───┼──► 横滚运动
    │   └─────┘   │
    │             │
    │    底座     │
    │             │
    └─────────────┘
```

### 硬件连接图

```
ESP32-S3                     MPU6050
┌─────────────┐            ┌──────────────┐
│             │            │              │
│   GPIO 1 ───┼────────────► SCL          │
│   GPIO 2 ───┼────────────► SDA          │
│   GPIO 3 ───┼────────────► INT          │
│             │            │              │
│             │            └──────────────┘
│   GPIO 4 ───┼────────────► DRV8313
│   GPIO 5 ───┼────────────► PWM_A (U)
│   GPIO 6 ───┼────────────► PWM_B (V)
│   GPIO 7 ───┼────────────► PWM_C (W)
│   GPIO 8 ───┼────────────► FAULT
│             │
│   GPIO 9 ───┼────────────► AS5600_SDA
│   GPIO 10 ──┼────────────► AS5600_SCL
│             │
└─────────────┘

DRV8313                      AS5600
┌─────────────┐            ┌──────────────┐
│  PWM_U     │            │  SDA         │◄──► GPIO 9
│  PWM_V     │            │  SCL         │◄──► GPIO 10
│  PWM_W     │            │  VCC 3.3V    │
│  ENABLE    │            │  GND         │
│  FAULT     │────────────►               │
└─────────────┘            └──────────────┘
         │
         ▼
    三相无刷电机
```

## 软件设计

### ESP-IDF项目结构

```
esp32_gimbal/
├── main/
│   ├── main.c                 # 主程序
│   ├── imu/
│   │   ├── mpu6050.c          # MPU6050驱动
│   │   ├── mpu6050.h
│   │   ├── fusion.c           # 姿态解算
│   │   └── fusion.h
│   ├── motor/
│   │   ├── bldc.c             # 无刷电机驱动
│   │   ├── bldc.h
│   │   ├── foc.c              # FOC控制
│   │   └── foc.h
│   ├── control/
│   │   ├── pid.c              # PID控制器
│   │   ├── pid.h
│   │   └── cascade_control.c  # 串级PID
│   ├── communication/
│   │   ├── wifi_server.c      # Wi-Fi调参
│   │   └── ble_control.c      # 蓝牙遥控
│   └── config/
│       └── parameters.h       # 参数配置
│
├── components/
│   └── esp-dsp/               # DSP库 (卡尔曼)
│
├── CMakeLists.txt
└── Kconfig.projbuild
```

### 核心代码实现

#### 1. MPU6050驱动
```c
// mpu6050.h
#ifndef MPU6050_H
#define MPU6050_H

#include "driver/i2c.h"
#include <stdint.h>

// MPU6050寄存器
#define MPU6050_ADDR         0x68
#define MPU6050_PWR_MGMT_1   0x6B
#define MPU6050_ACCEL_XOUT   0x3B
#define MPU6050_GYRO_XOUT    0x43
#define MPU6050_CONFIG        0x1A
#define MPU6050_GYRO_CONFIG  0x1B
#define MPU6050_ACCEL_CONFIG 0x1C

// 配置结构体
typedef struct {
    int16_t accel_x, accel_y, accel_z;
    int16_t gyro_x, gyro_y, gyro_z;
    float temp;
} mpu6050_data_t;

esp_err_t mpu6050_init(i2c_port_t i2c_num);
esp_err_t mpu6050_read_raw(mpu6050_data_t *data);
esp_err_t mpu6050_read_scaled(mpu6050_data_t *data);

#endif
```

```c
// mpu6050.c
#include "mpu6050.h"

static i2c_port_t s_i2c_num;

esp_err_t mpu6050_init(i2c_port_t i2c_num)
{
    s_i2c_num = i2c_num;

    // 配置I2C
    i2c_config_t conf = {
        .mode = I2C_MODE_MASTER,
        .sda_io_num = 2,
        .scl_io_num = 1,
        .sda_pullup_en = GPIO_PULLUP_ENABLE,
        .scl_pullup_en = GPIO_PULLUP_ENABLE,
        .master.clk_speed = 400000,
    };
    i2c_param_config(i2c_num, &conf);
    i2c_driver_install(i2c_num, conf.mode, 0, 0, 0);

    // 唤醒MPU6050
    uint8_t data[2] = {MPU6050_PWR_MGMT_1, 0};
    i2c_master_write_to_device(i2c_num, MPU6050_ADDR, data, 2, 100);

    // 配置陀螺仪 ±250°/s
    data[0] = MPU6050_GYRO_CONFIG; data[1] = 0x00;
    i2c_master_write_to_device(i2c_num, MPU6050_ADDR, data, 2, 100);

    // 配置加速度计 ±2g
    data[0] = MPU6050_ACCEL_CONFIG; data[1] = 0x00;
    i2c_master_write_to_device(i2c_num, MPU6050_ADDR, data, 2, 100);

    return ESP_OK;
}

esp_err_t mpu6050_read_raw(mpu6050_data_t *data)
{
    uint8_t raw_data[14];
    uint8_t reg = MPU6050_ACCEL_XOUT;

    i2c_master_write_read_device(s_i2c_num, MPU6050_ADDR,
                                  &reg, 1, raw_data, 14, 100);

    data->accel_x = (raw_data[0] << 8) | raw_data[1];
    data->accel_y = (raw_data[2] << 8) | raw_data[3];
    data->accel_z = (raw_data[4] << 8) | raw_data[5];
    data->temp = ((raw_data[6] << 8) | raw_data[7]) / 340.0 + 36.53;
    data->gyro_x = (raw_data[8] << 8) | raw_data[9];
    data->gyro_y = (raw_data[10] << 8) | raw_data[11];
    data->gyro_z = (raw_data[12] << 8) | raw_data[13];

    return ESP_OK;
}
```

#### 2. 姿态融合 (互补滤波)
```c
// fusion.h
#ifndef FUSION_H
#define FUSION_H

#include <stdint.h>

// 姿态角结构体
typedef struct {
    float pitch;   // 俯仰角 (X轴)
    float roll;    // 横滚角 (Y轴)
    float yaw;     // 航向角 (Z轴)
} attitude_t;

void fusion_init(float alpha);
void fusion_update(float ax, float ay, float az,
                   float gx, float gy, float gz,
                   float dt);
attitude_t fusion_get_attitude(void);

#endif
```

```c
// fusion.c
#include "fusion.h"
#include "math.h"

static attitude_t attitude;
static float alpha = 0.98;  // 互补滤波权重

#define RAD_TO_DEG 57.29578f

void fusion_init(float a)
{
    alpha = a;
    attitude.pitch = 0;
    attitude.roll = 0;
    attitude.yaw = 0;
}

void fusion_update(float ax, float ay, float az,
                   float gx, float gy, float gz, float dt)
{
    // 加速度计计算角度 (低频)
    float accel_pitch = atan2(-ax, sqrt(ay*ay + az*az)) * RAD_TO_DEG;
    float accel_roll = atan2(ay, az) * RAD_TO_DEG;

    // 陀螺仪积分 (高频)
    attitude.pitch += gx * dt;
    attitude.roll += gy * dt;
    attitude.yaw += gz * dt;

    // 互补滤波融合
    attitude.pitch = alpha * attitude.pitch + (1 - alpha) * accel_pitch;
    attitude.roll = alpha * attitude.roll + (1 - alpha) * accel_roll;
}

attitude_t fusion_get_attitude(void)
{
    return attitude;
}
```

#### 3. FOC控制
```c
// foc.h
#ifndef FOC_H
#define FOC_H

#include <stdint.h>

void foc_init(void);
void foc_set_angle(float angle);    // 设置目标电角度
void foc_set_pwm(int u, int v, int w);
float foc_electrical_angle(float mechanical_angle, uint8_t pole_pairs);

#endif
```

```c
// foc.c
#include "foc.h"
#include "driver/mcpwm.h"
#include "soc/mcpwm_periph.h"

// FOC Park变换
typedef struct {
    float alpha, beta;
    float d, q;
    float u_alpha, u_beta;
} foc_t;

static foc_t foc;

void foc_set_pwm(int u, int v, int w)
{
    // 设置三相PWM (需要反park变换后的值)
    mcpwm_set_duty(MCPWM_UNIT_0, MCPWM_TIMER_0, MCPWM_OPR_A, u);
    mcpwm_set_duty(MCPWM_UNIT_0, MCPWM_TIMER_0, MCPWM_OPR_B, v);
    mcpwm_set_duty(MCPWM_UNIT_0, MCPWM_TIMER_0, MCPWM_OPR_C, w);
}
```

#### 4. 串级PID控制
```c
// cascade_control.c
#include "pid.h"

typedef struct {
    // 外环 (角度环)
    pid_controller_t angle_pid;

    // 内环 (角速度环)
    pid_controller_t speed_pid;
} cascade_pid_t;

static cascade_pid_t pitch_cascade = {
    .angle_pid = {
        .kp = 10.0f, .ki = 0.0f, .kd = 0.5f,
        .target = 0.0f, .feedback = 0.0f,
        .output = 0.0f,
        .integral = 0.0f, .prev_error = 0.0f,
    },
    .speed_pid = {
        .kp = 1.0f, .ki = 0.05f, .kd = 0.0f,
        .target = 0.0f, .feedback = 0.0f,
        .output = 0.0f,
        .integral = 0.0f, .prev_error = 0.0f,
    },
};

float cascade_control_update(float target_angle, float current_angle,
                              float current_speed, float dt)
{
    // 外环: 角度环
    pid_update(&pitch_cascade.angle_pid, target_angle, current_angle, dt);
    float angle_output = pitch_cascade.angle_pid.output;

    // 内环: 角速度环 (目标角速度 = 角度环输出 + 前馈)
    float target_speed = angle_output;
    pid_update(&pitch_cascade.speed_pid, target_speed, current_speed, dt);

    return pitch_cascade.speed_pid.output;
}
```

## 项目开源方案参考

### 优质GitHub项目

| 项目 | 链接 | 说明 |
|------|------|------|
| **SimpleFOC for ESP32** | https://github.com/simplefoc/Arduino-FOC | FOC控制库 |
| **ESP32 Gimbal** | https://github.com/mjhxmjh/ESP32-gimbal | 云台控制 |
| **BLDC Controller** | https://github.com/rikorg/bldc-controller | 无刷直流控制 |
| **MPU6050 Fusion** | https://github.com/k根本原则越好/ESP32-MPU6050 | 姿态解算 |
| **Gimbal Controller** | https://github.com/C蛮/brushless-gimbal | 云台控制器 |

### 学习资源
| 资源 | 链接 |
|------|------|
| simplefoc.com | https://simplefoc.com/ |
| FOC算法详解 | https://zhuanlan.zhihu.com/p/147659863 |
| 卡尔曼滤波 | https://zhuanlan.zhihu.com/p/37777039 |

## 云台调试技巧

### PID参数整定

```
调试顺序: 先内环后外环

1. 内环 (角速度环) 调试
   ├── P参数: 从小到大, 出现振荡则回调
   ├── I参数: 消除稳态误差
   └── D参数: 抑制超调

2. 外环 (角度环) 调试
   ├── P参数: 控制响应速度
   ├── D参数: 增强阻尼
   └── 前馈: 加速度前馈减少跟踪误差

典型参数参考:
   角度环: Kp=8-15, Ki=0, Kd=0.3-1.0
   角速度环: Kp=0.5-2.0, Ki=0.02-0.1, Kd=0
```

### 常见问题处理

| 现象 | 原因 | 解决方法 |
|------|------|----------|
| 电机抖动 | 换向不平滑/PWM分辨率低 | 增加死区补偿/提高PWM频率 |
| 角度漂移 | 积分饱和/陀螺仪零偏 | 积分限幅/校准零偏 |
| 响应迟缓 | P值太小/负载太大 | 增大P/减小负载 |
| 自激振荡 | 增益过大 | 减小P/D值 |

---

*无刷云台是电赛和毕业设计中的热门项目，ESP32-S3的FOC支持和Wi-Fi调参功能大大简化了开发难度。*
