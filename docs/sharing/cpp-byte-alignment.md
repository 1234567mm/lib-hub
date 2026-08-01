---
id: cpp-byte-alignment
title: "C/C++ 字节对齐完全指南：从 struct 布局到 pragma pack"
sidebar_position: 2
---

# C/C++ 字节对齐完全指南

## 引言：一个反直觉的例子

先看两个结构体，它们的成员一模一样，只是声明顺序不同：

```c
struct A {
    int   a;
    char  b;
    short c;
};

struct B {
    char  b;
    int   a;
    short c;
};
```

在 32 位平台（char 1 字节、short 2 字节、int 4 字节）上，两者成员的字节总和都是 `4 + 1 + 2 = 7`，但你猜 `sizeof(struct A)` 和 `sizeof(struct B)` 分别是多少？

答案是：`sizeof(A) == 8`，`sizeof(B) == 12`。

同样的成员，只因为顺序不同就多占了 5 个字节——这就是字节对齐（Byte Alignment）在起作用。本文从原理到实战，把 C/C++ 的字节对齐讲透。

---

## 一、什么是字节对齐

现代计算机中，内存按字节划分地址。理论上，一个 `int` 变量可以存放在任意地址上，但现实中，**CPU 访问特定类型数据时，往往要求其起始地址满足一定的条件**——比如 4 字节的 `int` 起始地址最好是 4 的倍数（即能被 4 整除）。

这种"让数据的起始地址对齐到其类型大小（或其自然边界）整数倍"的规则，就是对齐。

为什么结构体要讨论对齐？因为结构体是多个成员按顺序拼在一起的复合类型，成员之间会因对齐规则被插入"填充字节（padding）"，导致结构体大小 ≠ 成员大小之和。

---

## 二、为什么需要字节对齐

### 2.1 硬件平台的要求

某些平台对特定类型的数据**强制要求**对齐地址，否则直接报错：

- Motorola 68000 不允许 16 位数据存放在奇数地址，否则触发异常；
- MIPS / ARM 等 RISC 处理器访问非对齐的多字节数据时，会产生**总线访问异常（Bus Error）**。

在这些平台上，非对齐访问不是"慢一点"的问题，而是**程序直接崩溃**。

### 2.2 访问效率的差异

即使硬件允许非对齐访问（如 x86），对齐依然能显著提升性能。

以 32 位处理器为例，CPU 每个总线周期从地址能被 4 整除的位置开始，读取 4 字节数据：

- **对齐时**：一次总线周期就能读完整个 `int`；
- **非对齐时**：数据可能跨越两个"总线窗口"，需要 **2 个总线周期** 分别读取，再拼接得到结果。

一句话总结对齐的目的：**用空间（填充字节）换时间（访问速度）**，同时满足部分硬件的硬性要求。

---

## 三、对齐的核心规则

不同编译器在细节上有差异，但一般遵循三条准则：

> **准则 1**：结构体变量的首地址，能被其**最宽基本类型成员**的大小整除；
>
> **准则 2**：每个成员相对结构体首地址的**偏移量（offset）**，是该成员自身大小的整数倍，不满足时编译器在成员之间插入填充字节；
>
> **准则 3**：结构体的**总大小**是其最宽基本类型成员大小的整数倍，不满足时在末尾补充尾部填充字节。

### 3.1 关键概念

| 概念 | 说明 |
|------|------|
| 数据类型自身对齐值 | `char`=1，`short`=2，`int/float`=4，`double`=8 |
| 结构体自身对齐值 | 成员中自身对齐值的最大值 |
| 指定对齐值 | `#pragma pack(n)` 指定的 n |
| 有效对齐值 | `min{自身对齐值, 指定对齐值}` |

成员存放的起始地址需满足：`起始地址 % 有效对齐值 == 0`。

### 3.2 动手推导：偏移量与填充

```c
#include <stdio.h>
#include <stddef.h>

#define OFFSET(st, field) ((size_t)&(((st *)0)->field))

typedef struct {
    char  a;       /* 1 字节 */
    short b;       /* 2 字节 */
    char  c;       /* 1 字节 */
    int   d;       /* 4 字节 */
    char  e[3];    /* 3 字节 */
} T_Test;

int main(void) {
    printf("Size = %zu\n", sizeof(T_Test));
    printf("a-%zu, b-%zu, c-%zu, d-%zu\n",
           OFFSET(T_Test, a), OFFSET(T_Test, b),
           OFFSET(T_Test, c), OFFSET(T_Test, d));
    printf("e[0]-%zu, e[1]-%zu, e[2]-%zu\n",
           OFFSET(T_Test, e[0]), OFFSET(T_Test, e[1]), OFFSET(T_Test, e[2]));
    return 0;
}
```

推导过程（4 字节对齐默认下）：

| 成员 | 自身大小 | 偏移量 | 说明 |
|------|---------|--------|------|
| `a` | 1 | 0 | 直接存放 |
| `b` | 2 | 2 | 偏移 1 不是 2 的倍数 → 填充 1 字节 |
| `c` | 1 | 4 | 直接存放 |
| `d` | 4 | 8 | 偏移 5 不是 4 的倍数 → 填充 3 字节 |
| `e[3]` | 3 | 12 | 直接存放 |

成员结束后已占用 15 字节，但最宽成员是 4 字节，15 不是 4 的倍数 → 尾部再补 1 字节，最终：

```
sizeof(T_Test) = 16
```

输出验证：
```
Size = 16
a-0, b-2, c-4, d-8
e[0]-12, e[1]-13, e[2]-14
```

> **技巧**：用 `offsetof(type, member)`（C 标准库 `<stddef.h>` 自带）或上面的 `OFFSET` 宏，可以在程序里直接打印成员的偏移量，是排查结构体布局问题的利器。

### 3.3 内存布局的"矩阵写法"

把每个成员按 4 字节一行铺开，`*` 表示填充字节，可以直观看到结构体内部长什么样。以引言中的 `struct B` 为例（12 字节）：

```
b***   ← char b 占 1 字节，后面 3 字节填充
aaaa   ← int a
cc**   ← short c 占 2 字节，后面 2 字节填充
```

而 `struct A`（8 字节）：

```
aaaa   ← int a
bcc*   ← char b + short c，尾部 1 字节填充
```

这就是同样的成员、不同的顺序，内存占用完全不同的根本原因。

---

## 四、结构体成员顺序优化

既然顺序影响大小，写结构体时应遵循一个实用原则：

> **按成员大小递增（或递减）的顺序排列成员，把同类型的成员放在一起。**

比如把上面的 `T_Test` 重排：

```c
typedef struct {
    int    d;      /* 4 */
    short  b;      /* 2 */
    char   a, c;   /* 1 + 1 */
    char   e[3];   /* 3 */
} T_Test2;
```

推导：`d` 偏移 0，`b` 偏移 4，`a` 偏移 6，`c` 偏移 7，`e` 偏移 8～10，最宽成员 4 字节 → 尾部补 2 字节，`sizeof(T_Test2) = 12`，比原来的 16 字节**省了 4 字节**。

在嵌入式场景里，这类结构体往往对应协议帧、寄存器映射或大量存储的数据结构，一个成员顺序的调整可能直接省下可观的内存。**成员声明顺序 = 内存布局顺序**，这一点务必牢记。

---

## 五、手动控制对齐：pragma pack

### 5.1 基本用法

```c
#pragma pack(n)      /* 让后续结构体按 n 字节对齐 */
...
#pragma pack()       /* 恢复默认对齐 */
```

`#pragma pack(1)` 是最常用的：取消所有填充，成员紧凑排列，结构体大小 = 成员字节之和。典型用途是**跨平台通信协议帧**——保证任何编译器、任何平台下结构体的内存布局完全一致。

```c
#pragma pack(1)
typedef struct {
    uint8_t  cmd;     /* 1 */
    uint16_t len;     /* 2 */
    uint32_t crc;     /* 4 */
    uint8_t  payload[8];
} T_MSG;              /* sizeof = 15 */
#pragma pack()
```

### 5.2 push / pop 语法

`#pragma pack` 会影响**后面所有**结构体定义，为了不"污染"其他代码，建议使用 push/pop 把影响范围限制在局部：

```c
#pragma pack(push, 1)   /* 保存当前对齐值，并设为 1 */
typedef struct { ... } T_FRAME;
#pragma pack(pop)       /* 恢复之前保存的对齐值 */
```

### 5.3 注意

- `pack(n)` 的 n 通常取 1、2、4、8、16；
- 有效对齐值 = `min{成员自身对齐值, n}`，所以 `pack(1)` 会把所有成员压成 1 字节对齐；
- **副作用**：pack 后的结构体成员可能非对齐，ARM/MIPS 上访问其成员可能触发总线异常，且访问速度下降（见第七节）。

---

## 六、GCC 特有：__attribute__((packed)) 与 aligned

GCC/Clang 提供属性语法，作用更精细：

```c
/* 取消对齐，紧凑排列 */
struct __attribute__((packed)) T_Packed {
    char  c;
    int   i;
};   /* sizeof = 5 */

/* 强制成员对齐到 n 字节边界 */
struct __attribute__((aligned(16))) T_Aligned {
    char c;
    int  i;
};   /* sizeof = 20（16 字节对齐的整数倍） */
```

**注意**：`aligned(n)` 是"向上圆整"，结构体大小会被补到 n 的整数倍，这与直觉相反——`aligned(16)` 反而会让结构体**变大**。它主要用于需要特定对齐的场景，比如 DMA 缓冲区、SIMD 数据等。

---

## 七、C++ 的对齐：alignof 与 alignas

C++11 开始引入了标准化的对齐控制关键字。

### 7.1 alignof：查询对齐要求

```cpp
#include <iostream>
int main() {
    std::cout << alignof(char)   << '\n';   // 1
    std::cout << alignof(int)    << '\n';   // 4
    std::cout << alignof(double) << '\n';   // 8
    std::cout << alignof(int[4]) << '\n';   // 4，数组的对齐等于元素类型的对齐
    return 0;
}
```

`alignof(T)` 返回类型 T 的**对齐要求**（即该类型对象起始地址需要满足的字节对齐数）。注意：`alignof` 是编译期常量，C 中对应的是 C11 的 `_Alignof`（`<stdalign.h>` 中的 `alignof` 宏）。

### 7.2 alignas：指定对齐要求

`alignas(n)` 或 `alignas(Type)` 可以强制类型/变量/成员的对齐：

```cpp
// 让该结构体所有对象都对齐到 32 字节边界（如 SIMD 数据）
struct alignas(32) SseVec {
    float data[4];
};
// sizeof(SseVec) = 32, alignof(SseVec) = 32

// 修饰变量：适合需要大对齐的缓冲区
alignas(64) unsigned char cache_line[64];
```

**限制与注意**：

- `alignas(0)` 被忽略；非法对齐值（如 `alignas(3)`）编译报错；
- **不能弱化**自然对齐：`struct alignas(1) U { S s; }` 若 `S` 自然对齐是 8，会编译失败，因为 `alignas(1)` 弱化了 `S` 的对齐要求；
- `alignas` 不能用于函数参数、catch 子句的异常参数等。

### 7.3 与 C 的对照

| 功能 | C | C++ |
|------|---|---|
| 查询对齐 | C11 `_Alignof` / `<stdalign.h>` 的 `alignof` | C++11 `alignof` 运算符 |
| 指定对齐 | C11 `_Alignas` / `<stdalign.h>` 的 `alignas` | C++11 `alignas` 关键字 |
| 取消对齐 | `#pragma pack(1)` / `__attribute__((packed))` | 同样适用 + `__attribute__((packed))` |

> C++11 之前，C++ 只能靠 `#pragma pack` 和编译器扩展控制对齐；C++11 之后有了语言级标准手段。但对于**序列化/协议**场景，`packed` 仍是唯一能"取消填充"的办法，`alignas` 只能增不能减。

---

## 八、非对齐访问的隐患

### 8.1 不同架构的态度

| 架构 | 非对齐访问行为 |
|------|---------------|
| x86（CISC） | 允许，但性能下降（可能 2 次总线周期） |
| ARM / MIPS（RISC） | 触发总线异常 / 数据未对齐异常，程序崩溃 |

x86 的 EFLAGS 寄存器有个 AC（Alignment Check）标志，默认关闭，CPU 会自动处理非对齐访问；而 MIPS/ARM 没有这种"兜底"能力，非对齐的多字节访问会直接通知操作系统并引发异常（如 vxWorks 下会触发数据未对齐异常）。

### 8.2 典型雷区：强制类型转换

```c
int main(void) {
    unsigned int i = 0x12345678;
    unsigned char *p = (unsigned char *)&i;

    *p = 0x00;   /* 安全，char 无对齐要求 */

    /* 危险：p+1 是奇数地址，却按 short 访问 */
    unsigned short *p1 = (unsigned short *)(p + 1);
    *p1 = 0x0000;   /* x86 上效率低；MIPS/ARM 上可能直接崩溃 */
    return 0;
}
```

### 8.3 典型雷区：跨 CPU 数据包强转结构体指针

如果数据包（如串口/网络收到的字节流）没有按对齐排布，直接强转成结构体指针再访问 `->int成员`，在 ARM/MIPS 上就是定时炸弹：

```c
/* 危险写法：p 指向的数据可能不对齐 */
void ParseFrame(const uint8_t *raw) {
    T_FRAME *f = (T_FRAME *)raw;
    uint32_t x = f->crc;   /* 若 raw 不是 4 字节对齐，ARM 上崩溃 */
}

/* 安全写法：拷贝到对齐的局部变量中再访问 */
void ParseFrame(const uint8_t *raw) {
    T_FRAME f;
    memcpy(&f, raw, sizeof(f));   /* memcpy 天然安全 */
    uint32_t x = f.crc;           /* 局部变量由编译器保证对齐 */
}
```

> **铁律**：字节流 → 结构体，一律用 `memcpy`，不要用强转。这条规则在嵌入式开发里能帮你避开 90% 的对齐崩溃。

---

## 九、实战：通信协议结构体设计

跨平台 / 跨处理器通信时，对齐带来的最大问题是：**不同编译器、不同平台对同一结构体的填充可能不同，导致结构体长度不一致**。

设计通信协议帧时，建议：

1. **协议帧用 `#pragma pack(1)` 或 `__attribute__((packed))` 紧凑排布**，保证所有平台布局一致、长度确定；
2. 必要时**手动填充字节**，让帧内关键字段（如 4 字节的校验值）保持自然对齐，兼顾访问效率；
3. 帧内不要用 `int` 等长度随平台变化的类型，用 `uint32_t`、`uint16_t`、`uint8_t` 等定长类型；
4. 收发都走 `memcpy` / 逐字节解析，避免强转。

一个推荐的协议帧布局：

```c
#pragma pack(push, 1)
typedef struct {
    uint32_t  magic;     /* 帧头，4 字节 */
    uint16_t  type;      /* 类型 */
    uint8_t   seq;       /* 序号 */
    uint8_t   len;       /* 载荷长度 */
    uint8_t   payload[64];
    uint16_t  crc;       /* 校验 */
} T_FRAME;               /* sizeof = 1 + 4 + 2 + 1 + 1 + 64 + 2 = 74，固定 */
#pragma pack(pop)
```

---

## 十、总结

| 要点 | 结论 |
|------|------|
| 对齐是什么 | 数据起始地址须是其类型大小的整数倍，结构体成员间会产生填充 |
| 为什么对齐 | 硬件强制要求 + 访问效率（一次总线周期 vs 两次） |
| 三条准则 | 首地址可被最宽成员整除；成员偏移是其大小的整数倍；总大小是最宽成员的整数倍 |
| 优化手段 | 成员按大小排序声明；`#pragma pack(1)` 取消填充；C++ 用 `alignas`/`alignof` |
| 最大陷阱 | 字节流强转结构体指针后访问成员 → 非对齐访问，ARM/MIPS 崩溃 |
| 最佳实践 | 协议帧 pack(1) + 定长类型 + memcpy 拷贝解析 |

字节对齐是 C/C++ 中"看不见但无处不在"的规则：它影响内存占用、访问性能，甚至决定程序在 ARM 上是否会崩溃。理解它，是写出可靠嵌入式代码的基本功。

---

## 参考资料

- [C语言字节对齐问题详解 — clover_toeic（博客园）](https://www.cnblogs.com/clover-toeic/p/3853132.html)
- [C++ struct结构体内存对齐 — MElephant（博客园）](https://www.cnblogs.com/hyacinthLJP/p/16041690.html)
- [alignas specifier — cppreference.com](https://en.cppreference.com/w/cpp/language/alignas)
- [alignof operator — cppreference.com](https://en.cppreference.com/w/cpp/language/alignof)
