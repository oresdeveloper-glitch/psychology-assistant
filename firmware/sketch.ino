#include <WiFi.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <DHT.h>

const char* ssid = "Wokwi-GUEST";
const char* password = "";

IPAddress serverIp(5, 255, 123, 12);
const int serverPort = 80;
const char* hostname = "a2a643beee43a65b-41-59-212-29.serveousercontent.com";
const char* apiPath = "/api/v1/sensor/ingest";

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

#define DHTPIN 15
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

#define HEART_POT_PIN 34
#define SLEEP_POT_PIN 35

WiFiClient client;

void setup() {
  Serial.begin(115200);
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
    Serial.print("IP: "); Serial.println(WiFi.localIP());
  } else {
    display.print("WiFi FAIL ");
    display.println(a);
  }
  display.display();
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

  float t = dht.readTemperature();
  if (isnan(t)) t = 25.0;
  int hr = map(analogRead(HEART_POT_PIN), 0, 4095, 60, 130);
  int sl = map(analogRead(SLEEP_POT_PIN), 0, 4095, 0, 100);
  int ss = calcStress(t, hr, sl);

  String body = "{\"temperature\":" + String(t,1) + ",\"heartRate\":" + String(hr) +
                ",\"sleepScore\":" + String(sl) + ",\"stressScore\":" + String(ss) +
                ",\"currentStatus\":\"" + classify(ss) +
                "\",\"depressionRisk\":\"" + classifyRisk(sl, hr) + "\"}";

  bool ok = sendPost(body);
  Serial.print("POST "); Serial.println(ok ? "OK" : "FAIL");

  display.clearDisplay(); display.setTextSize(1); display.setCursor(0, 0);
  display.print("T:"); display.print(t,1); display.print(" HR:"); display.println(hr);
  display.print("Sleep:"); display.print(sl); display.print(" Stress:"); display.println(ss);
  display.print(classify(ss)); display.print(" "); display.println(classifyRisk(sl, hr));
  display.setTextSize(2); display.setCursor(0, 48);
  display.print(ok ? "SENT" : "FAIL"); display.display();
  delay(3000);
}

bool sendPost(String& payload) {
  int conn = client.connect(serverIp, serverPort, 15000);
  Serial.print("connect()="); Serial.println(conn);
  if (conn != 1) { Serial.println("connect FAIL"); return false; }
  client.print("POST "); client.print(apiPath); client.println(" HTTP/1.1");
  client.print("Host: "); client.println(hostname);
  client.print("Content-Type: application/json\r\n");
  client.print("Content-Length: "); client.println(payload.length());
  client.println("Connection: close");
  client.println();
  client.print(payload);
  unsigned long tmo = millis() + 10000;
  while (client.available() == 0 && millis() < tmo) { delay(10); }
  if (client.available() == 0) { client.stop(); return false; }
  String line = client.readStringUntil('\n');
  line.trim();
  Serial.print("Status: "); Serial.println(line);
  client.stop();
  return line.indexOf("200") >= 0;
}

int calcStress(float t, int hr, int sl) {
  int s = 0;
  if (hr < 75) s += 10; else if (hr < 95) s += 30; else if (hr < 110) s += 50; else s += 70;
  if (t >= 24 && t <= 28) s += 5; else if (t > 28 && t <= 31) s += 15; else s += 25;
  if (sl >= 70) s -= 10; else if (sl >= 40) s += 10; else s += 25;
  return constrain(s, 0, 100);
}
String classify(int s) { if (s < 40) return "NORMAL/CALM"; if (s < 70) return "MODERATE"; return "STRESS"; }
String classifyRisk(int sl, int hr) {
  int r = 0; if (sl < 40) r += 60; else if (sl < 70) r += 30; else r += 10;
  if (hr > 105) r += 25; else if (hr > 90) r += 10;
  return r >= 60 ? "HIGH RISK" : "LOW RISK";
}
