// Wokwi Custom Chip - MAX30102 pulse oximeter simulator
// Emulates enough of the MAX30105 register map for the SparkFun
// MAX3010x library to initialise and stream a synthetic IR heartbeat.
#include "wokwi-api.h"
#include <stdio.h>
#include <stdlib.h>
#include <math.h>

const int ADDRESS = 0x57; // MAX30102 default I2C address

// Register addresses used by the SparkFun MAX30105 library
#define REG_INTR_STATUS_1  0x00
#define REG_INTR_STATUS_2  0x01
#define REG_INTR_ENABLE_1  0x02
#define REG_INTR_ENABLE_2  0x03
#define REG_FIFO_WR_PTR    0x04
#define REG_OVF_COUNTER    0x05
#define REG_FIFO_RD_PTR    0x06
#define REG_FIFO_DATA      0x07
#define REG_FIFO_CONFIG    0x08
#define REG_MODE_CONFIG    0x09
#define REG_SPO2_CONFIG    0x0A
#define REG_LED1_PA        0x0C
#define REG_LED2_PA        0x0D
#define REG_TEMP_INT       0x1F
#define REG_TEMP_FRAC      0x20
#define REG_TEMP_CONFIG    0x21
#define REG_REV_ID         0xFE
#define REG_PART_ID        0xFF

#define PART_ID_MAX30105 0x15
#define REV_ID           0x02

typedef struct {
  pin_t pin_int;
  uint8_t regs[256];
  uint8_t reg_addr; // last register address written (target for read / write)
  uint8_t addr_received; // true when the first (address) byte arrived
  uint8_t fifo_pos;   // position inside a 6-byte FIFO sample burst
  uint32_t threshold_attr;
} chip_state_t;

// Produce a plausible pulsatile IR signal (heartbeat ~72 BPM).
// Returns a 24-bit value similar to the real MAX3010x FIFO sample.
static uint32_t ir_sample(void) {
  double t = (double)simulation_time_us() / 1e6;
  double ac = 6000.0 * sin(2.0 * M_PI * t * 1.2);          // ~72 BPM ripple
  double slow = 7000.0 * sin(2.0 * M_PI * t * 0.1);        // breathing drift
  return (uint32_t)(70000.0 + ac + slow);
}

static bool on_i2c_connect(void *user_data, uint32_t address, bool connect) {
  return true;
}

static uint8_t on_i2c_read(void *user_data) {
  chip_state_t *chip = user_data;

  if (chip->reg_addr == REG_FIFO_DATA) {
    uint32_t ir = ir_sample();
    // SparkFun library bursts 6 bytes: red (3) then IR (3).
    if (chip->fifo_pos >= 6) chip->fifo_pos = 0;
    uint8_t b = 0;
    if (chip->fifo_pos < 3) {
      // Red channel (3 bytes, big-endian)
      uint32_t red = ir / 3;
      b = (uint8_t)((red >> (8 * (2 - chip->fifo_pos))) & 0xFF);
    } else {
      b = (uint8_t)((ir >> (8 * (5 - chip->fifo_pos))) & 0xFF);
    }
    chip->fifo_pos++;
    return b;
  }

  return chip->regs[chip->reg_addr];
}

static bool on_i2c_write(void *user_data, uint8_t data) {
  chip_state_t *chip = user_data;
  if (!chip->addr_received) {
    chip->reg_addr = data;
    chip->addr_received = 1;
    chip->fifo_pos = 0;
  } else {
    // Write data to the addressed register, then auto-increment.
    chip->regs[chip->reg_addr] = data;
    chip->reg_addr++;
  }
  return true;
}

static void on_i2c_disconnect(void *user_data) {
  // End of an I2C transaction: next write is a fresh register address.
  chip_state_t *chip = user_data;
  chip->addr_received = 0;
}

void chip_init() {
  chip_state_t *chip = malloc(sizeof(chip_state_t));
  for (int i = 0; i < 256; i++) chip->regs[i] = 0x00;
  chip->reg_addr = 0;
  chip->addr_received = 0;
  chip->fifo_pos = 0;

  chip->regs[REG_PART_ID] = PART_ID_MAX30105;
  chip->regs[REG_REV_ID] = REV_ID;
  chip->regs[REG_FIFO_CONFIG] = 0x4F;
  chip->regs[REG_MODE_CONFIG] = 0x03;
  chip->regs[REG_SPO2_CONFIG] = 0x27;
  chip->regs[REG_LED1_PA] = 0x0A;
  chip->regs[REG_LED2_PA] = 0x0A;
  chip->regs[REG_LED3_PA] = 0x0A;

  chip->pin_int = pin_init("INT", INPUT);
  chip->threshold_attr = attr_init("beatAvg", 80);

  const i2c_config_t i2c_config = {
      .user_data = chip,
      .address = ADDRESS,
      .scl = pin_init("SCL", INPUT),
      .sda = pin_init("SDA", INPUT),
      .connect = on_i2c_connect,
      .read = on_i2c_read,
      .write = on_i2c_write,
      .disconnect = on_i2c_disconnect,
  };
  i2c_init(&i2c_config);
}