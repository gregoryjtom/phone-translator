const http = require("http");
const express = require("express");
const bodyParser = require("body-parser");
const VoiceResponse = require("twilio").twiml.VoiceResponse;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

let toNumber;
let recordingInitiated = false;
let recordingFinished = false;
let transcription = "";

const gatherPhoneNumber = twiml => {
  const gather = twiml.gather({ numDigits: 10 });
  gather.say("What phone number would you like to call?");
};

const recordName = twiml => {
  const gather = twiml.gather({
    input: "speech",
    action: "/handle",
    finishOnKey: "*",
    language: "es-MX"
  });
  gather.say("What do you want to say?");
};

app.post("/initiate", (req, res) => {
  console.log(req.body.Caller);

  const twiml = new VoiceResponse();

  if (req.body.Digits !== undefined) {
    toNumber = req.body.Digits;
  }

  if (toNumber === undefined) {
    gatherPhoneNumber(twiml);
  } else if (!recordingInitiated) {
    recordingInitiated = true;
    recordName(twiml);
  } else if (!recordingFinished) {
    twiml.say("Wait a moment while your response is being processed.");
    twiml.pause({ length: 10 });
    twiml.redirect("/voice");
  } else {
    console.log(1);
    twiml.say({ language: "es-MX" }, transcription);
    twiml.redirect("/initiate");
    toNumber = undefined;
    recordingInitiated = false;
    recordingFinished = false;
  }

  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
});

app.post("/handle", (req, res) => {
  recordingFinished = true;
  transcription = req.body.SpeechResult;
  console.log(transcription);

  const twiml = new VoiceResponse();
  twiml.redirect("/initiate");
  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
});

http.createServer(app).listen(1337, () => {
  console.log("Express server listening on port 1337");
});
