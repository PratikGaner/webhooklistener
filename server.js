const express = require('express');
const bodyParser = require('body-parser');
const mqtt = require('mqtt');

const app = express();
const port = 3000;

// AWS IoT Core endpoint, credentials, and topic details
const iotEndpoint = "a3peca2j2kxqhn-ats.iot.ap-south-1.amazonaws.com";
const iotPort = 8883;
const iotTopic = "raspi/updates";
const iotClientId = "webapp_client";
const caPath = "./root-CA.pem";
const certPath = "./certificate.pem.crt";
const keyPath = "./private.pem.key";

// Create an MQTT client
const mqttClient = mqtt.connect(`mqtts://${iotEndpoint}:${iotPort}`, {
  clientId: iotClientId,
  ca: require('fs').readFileSync(caPath),
  cert: require('fs').readFileSync(certPath),
  key: require('fs').readFileSync(keyPath),
});

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
});

// Express middleware to parse JSON
app.use(bodyParser.json());

app.get('/webhook', (req,res) => {
  res.status(200).send('its running')
})

app.post('/webhook', (req, res) => {
  const data = req.body;
  //res.status(200).send('reached webhook endpoint')

  const repositoryName = data.repository ? data.repository.repo_name : 'default_repository';
  const dockerImageName = `${repositoryName}:${data.push_data.tag}`;
  //const dockerImageName = "k0wshik2/raspiimage:arm64v8";

  //const payload = { dockerImageName };

  // Publish the payload to the MQTT topic
  mqttClient.publish(iotTopic, dockerImageName);

  res.status(200).send('Webhook received and message published to MQTT.');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});