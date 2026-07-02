import mqtt from 'mqtt'

const MQTT_WS_URL = 'wss://broker.emqx.io:8084/mqtt'
const TOPIC = 'yasir/crop/device001/data'

let client = null
let listeners = []

function notify(data) {
  listeners.forEach((fn) => fn(data))
}

export function onMqttMessage(fn) {
  listeners.push(fn)
  return () => {
    listeners = listeners.filter((f) => f !== fn)
  }
}

export function connectMqtt() {
  if (client && client.connected) return client

  client = mqtt.connect(MQTT_WS_URL, {
    clientId: 'khairaty_web_' + Math.random().toString(16).slice(2, 10),
    clean: true,
    reconnectPeriod: 5000,
    connectTimeout: 10000,
  })

  client.on('connect', () => {
    console.log('MQTT WebSocket connected')
    client.subscribe(TOPIC, (err) => {
      if (err) console.error('MQTT subscribe error:', err)
      else console.log('MQTT subscribed to', TOPIC)
    })
  })

  client.on('message', (topic, message) => {
    try {
      const data = JSON.parse(message.toString())
      console.log('MQTT message:', topic, data)
      notify(data)
    } catch (e) {
      console.error('MQTT parse error:', e)
    }
  })

  client.on('error', (err) => console.error('MQTT error:', err))
  client.on('reconnect', () => console.log('MQTT reconnecting...'))
  client.on('close', () => console.log('MQTT closed'))

  return client
}

export function disconnectMqtt() {
  if (client) {
    client.end(true)
    client = null
  }
}
