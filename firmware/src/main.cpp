#include <Arduino.h>
#include <WiFi.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <DHT.h>
#include <PubSubClient.h>

#define WIFI_SSID "Wokwi-GUEST"
#define WIFI_PASS ""

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

#define DHTPIN 15
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

#define POT_HEART 34
#define POT_SLEEP 35

const char* mqttServer = "broker.emqx.io";
const int mqttPort = 1883;
const char* mqttTopic = "khairaty/sensor/esp32";
const char* clientId = "khairaty_esp32";

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

int cs(float t, int hr, int sl);
String cls(int s);
String rsk(int sl, int hr);

void setup() {
  Serial.begin(115200);
  randomSeed(analogRead(0));
  dht.begin();
  Wire.begin(21, 22);
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("WiFi...");
  display.display();

  Serial.print("WiFi");
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  int a = 0;
  while (WiFi.status() != WL_CONNECTED && a < 100) { delay(500); Serial.print("."); a++; }

  display.clearDisplay();
  display.setCursor(0, 0);
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(" OK");
    display.println("WiFi OK");
    display.print("IP: "); display.println(WiFi.localIP());
    Serial.print("IP: "); Serial.println(WiFi.localIP());

    mqttClient.setServer(mqttServer, mqttPort);
    Serial.print("MQTT");
    int b = 0;
    while (!mqttClient.connected() && b < 20) {
      if (mqttClient.connect(clientId)) {
        Serial.println(" OK");
        display.println("MQTT OK");
      } else {
        Serial.print(".");
        delay(500);
        b++;
      }
    }
    if (!mqttClient.connected()) {
      Serial.println(" FAIL");
      display.println("MQTT FAIL");
    }
  } else {
    Serial.print(" FAIL after "); Serial.print(a); Serial.println(" tries");
    display.println("WiFi FAIL");
  }
  display.display();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi down");
    WiFi.mode(WIFI_STA);
    WiFi.setSleep(false);
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    int a = 0;
    while (WiFi.status() != WL_CONNECTED && a < 60) { delay(500); a++; }
    if (WiFi.status() != WL_CONNECTED) {
      display.clearDisplay(); display.setCursor(0,0);
      display.println("WiFi FAIL"); display.display();
      delay(2000);
      return;
    }
    Serial.println("WiFi reconnected");
  }

  if (!mqttClient.connected()) {
    Serial.print("MQTT reconnect");
    int b = 0;
    while (!mqttClient.connected() && b < 20) {
      if (mqttClient.connect(clientId)) {
        Serial.println(" OK");
      } else {
        Serial.print(".");
        delay(500);
        b++;
      }
    }
    if (!mqttClient.connected()) {
      Serial.println(" FAIL");
      delay(2000);
      return;
    }
  }

  float t = dht.readTemperature();
  if (isnan(t)) t = 25.0;

  int potHeart = analogRead(POT_HEART);
  int potSleep = analogRead(POT_SLEEP);

  int hr = map(potHeart, 0, 4095, 55, 100);
  int sl = map(potSleep, 0, 4095, 60, 100);
  int ss = cs(t, hr, sl);

  static unsigned long lastPub = 0;
  if (millis() - lastPub > 50) {
    lastPub = millis();

    String payload = "{\"temperature\":" + String(t,1) + ",\"heartRate\":" + String(hr) +
                     ",\"sleepScore\":" + String(sl) + ",\"stressScore\":" + String(ss) +
                     ",\"currentStatus\":\"" + cls(ss) +
                     "\",\"depressionRisk\":\"" + rsk(sl, hr) + "\"}";

    Serial.print("MQTT pub len="); Serial.println(payload.length());
    bool ok = mqttClient.publish(mqttTopic, payload.c_str());
    Serial.print("publish()="); Serial.println(ok ? "OK" : "FAIL");
    mqttClient.loop();
  }

  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.print("T:"); display.print(t,1); display.print(" HR:"); display.println(hr);
  display.print("Sleep:"); display.print(sl); display.print(" Stress:"); display.println(ss);
  display.print(cls(ss)); display.print(" "); display.println(rsk(sl, hr));
  display.setTextSize(2);
  display.setCursor(0, 48);
  display.print("SENT");
  display.display();

  delay(10);
}

int cs(float t, int hr, int sl) {
  int s = 0;
  if (hr < 75) s += 10; else if (hr < 95) s += 30; else if (hr < 110) s += 50; else s += 70;
  if (t >= 24 && t <= 28) s += 5; else if (t > 28 && t <= 31) s += 15; else s += 25;
  if (sl >= 70) s -= 10; else if (sl >= 40) s += 10; else s += 25;
  return constrain(s, 0, 100);
}

String cls(int s) {
  if (s < 40) return "NORMAL/CALM";
  if (s < 70) return "MODERATE";
  return "STRESS";
}

String rsk(int sl, int hr) {
  int r = 0;
  if (sl < 40) r += 60; else if (sl < 70) r += 30; else r += 10;
  if (hr > 105) r += 25; else if (hr > 90) r += 10;
  return r >= 60 ? "HIGH RISK" : "LOW RISK";
}
