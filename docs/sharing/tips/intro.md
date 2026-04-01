---
sidebar_position: 1
---

# 经验技巧

嵌入式开发中的实用技巧与经验总结，来自实践中的踩坑与填坑。

## 编程技巧

### 代码规范
```c
// ✅ 良好的命名规范
#define LED GPIO_PIN_13
#define UART_TIMEOUT 1000

// ❌ 避免魔法数字
if (timeout == 1000)  // 1000是什么？
```

### 状态机设计
```c
typedef enum {
    STATE_IDLE = 0,
    STATE_RUNNING,
    STATE_ERROR,
    STATE_MAX
} MachineState_t;
```

### 缓冲区管理
```c
// 环形缓冲区示例
#define BUF_SIZE 256
typedef struct {
    uint8_t data[BUF_SIZE];
    uint16_t head;
    uint16_t tail;
} RingBuffer_t;
```

## 调试经验

| 问题 | 排查方法 |
|------|----------|
| 程序死机 | 检查堆栈溢出、中断向量表 |
| 串口乱码 | 核对波特率、数据位、校验位 |
| 外设不工作 | 确认时钟使能、引脚配置 |
| 随机复位 | 检查电源稳定性、看门狗 |

## 最佳实践

1. **外设初始化后要检查返回值**
2. **中断里只做标记，不做复杂处理**
3. **关键代码加断言保护**
4. **善用printf调试，但发布时要关闭**

## 常见错误

- 忘记使能GPIO时钟
- 中断服务函数命名错误
- 结构体对齐问题
- 堆内存泄漏

---

*经验是踩坑踩出来的，愿你少走弯路。*
