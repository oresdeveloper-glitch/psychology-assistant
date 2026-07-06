#include <WiFi.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <DHT.h>
#include <PubSubClient.h>

const char* ssid = "Wokwi-GUEST";
const char* password = "";

const char* mqttServer = "broker.emqx.io";
const int mqttPort = 1883;
const char* mqttTopic = "khairaty/sensor/esp32";
const char* clientId = "khairaty_esp32";

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

#define DHTPIN 15
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

#define POT_HEART 34
#define POT_SLEEP 35

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

void setup() {
  Serial.begin(115200);
  randomSeed(analogRead(A0));
  dht.begin();
  Wire.begin(21, 22);
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(0, 0); display.println("WiFi..."); display.display();

  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  WiFi.begin(ssid, password);
  int a = 0;
  while (WiFi.status() != WL_CONNECTED && a < 100) { delay(500); a++; }
  display.clearDisplay(); display.setCursor(0, 0);
  if (WiFi.status() == WL_CONNECTED) {
    display.println("WiFi OK"); display.print("IP: "); display.println(WiFi.localIP());
    Serial.print("WiFi OK, IP: "); Serial.println(WiFi.localIP());

    mqttClient.setServer(mqttServer, mqttPort);
    int b = 0;
    while (!mqttClient.connected() && b < 20) {
      if (mqttClient.connect(clientId)) {
        display.println("MQTT OK");
        Serial.println("MQTT OK");
      } else {
        Serial.print("."); delay(500); b++;
      }
    }
    if (!mqttClient.connected()) {
      display.println("MQTT FAIL");
      Serial.println("MQTT FAIL");
    }
  } else {
    display.print("WiFi FAIL "); display.println(a);
  }
  display.display();
  delay(1000);
}

bool sendData() {
  float t = dht.readTemperature();
  if (isnan(t)) t = 25.0;

  int potHeart = analogRead(POT_HEART);
  int potSleep = analogRead(POT_SLEEP);

  int hr = map(potHeart, 0, 4095, 55, 100);
  int sl = map(potSleep, 0, 4095, 60, 100);
  int ss = calcStress(t, hr, sl);

  String payload = "{\"temperature\":" + String(t,1) + ",\"heartRate\":" + String(hr) +
                   ",\"sleepScore\":" + String(sl) + ",\"stressScore\":" + String(ss) +
                   ",\"currentStatus\":\"" + classify(ss) +
                   "\",\"depressionRisk\":\"" + classifyRisk(sl, hr) + "\"}";

  Serial.print("MQTT pub len="); Serial.println(payload.length());
  bool ok = mqttClient.publish(mqttTopic, payload.c_str());
  Serial.println(ok ? "MQTT OK" : "MQTT FAIL");
  mqttClient.loop();

  display.clearDisplay(); display.setTextSize(1); display.setCursor(0, 0);
  display.print("T:"); display.print(t,1); display.print(" HR:"); display.println(hr);
  display.print("Sleep:"); display.print(sl); display.print(" Stress:"); display.println(ss);
  display.print(classify(ss)); display.print(" "); display.println(classifyRisk(sl, hr));
  display.setTextSize(2); display.setCursor(0, 48);
  display.print("SENT"); display.display();
  return ok;
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.mode(WIFI_STA);
    WiFi.setSleep(false);
    WiFi.begin(ssid, password);
    int a = 0;
    while (WiFi.status() != WL_CONNECTED && a < 60) { delay(500); a++; }
    if (WiFi.status() != WL_CONNECTED) { delay(2000); return; }
  }
  if (!mqttClient.connected()) {
    int b = 0;
    while (!mqttClient.connected() && b < 20) {
      if (mqttClient.connect(clientId)) break;
      delay(500); b++;
    }
    if (!mqttClient.connected()) { delay(2000); return; }
  }
  static unsigned long lastPub = 0;
  if (millis() - lastPub > 50) {
    lastPub = millis();
    sendData();
  }
  delay(10);
}

int calcStress(float t, int hr, int sl) {
  int s = 0;
  if (hr < 75) s += 10; else if (hr < 95) s += 30; else if (hr < 110) s += 50; else s += 70;
  if (t >= 24 && t <= 28) s += 5; else if (t > 28 && t <= 31) s += 15; else s += 25;
  if (sl >= 70) s -= 10; else if (sl >= 40) s += 10; else s += 25;
  return constrain(s, 0, 100);
}

String classify(int s) {
  if (s < 40) return "NORMAL/CALM";
  if (s < 70) return "MODERATE";
  return "STRESS";
}

String classifyRisk(int sl, int hr) {
  int r = 0;
  if (sl < 40) r += 60; else if (sl < 70) r += 30; else r += 10;
  if (hr > 105) r += 25; else if (hr > 90) r += 10;
  return r >= 60 ? "HIGH RISK" : "LOW RISK";
}
