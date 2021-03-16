require("dotenv").config();
const child_process = require("child_process");
const fs = require("fs");
const fsExtra = require("fs-extra");

const { INPUT_DIR, OUTPUT_DIR, API_KEY, API_URL } = process.env;

function runCmd(cmd) {
  const resp = child_process.execSync(cmd);
  const result = resp.toString("UTF8");
  return result;
}

function decodeText(str) {
  str = str.toLowerCase();
  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // Huyền sắc hỏi ngã nặng
  str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // Â, Ê, Ă, Ơ, Ư
  return str;
}

function transcribe(filePath) {
  // Using template API from FPT AI
  const command = `curl -X POST ${API_URL} -H "api-key: ${API_KEY}" -T ${filePath}`;

  const response = JSON.parse(runCmd(command));
  if (response.hypotheses) {
    const text = response.hypotheses[0].utterance;
    return decodeText(text);
  }
  return null;
}

// Cleanup output
fsExtra.emptyDirSync(OUTPUT_DIR);

// Read and transcribe audio
fs.readdir(INPUT_DIR, function (err, fileNames) {
  if (err) {
    onError(err);
    return;
  }
  fileNames.forEach(function (fileName) {
    console.log(`Start transcribing "${fileName}"`);

    const result = transcribe(`${INPUT_DIR}/${fileName}`);

    const outputFileName = `${fileName.split(".")[0]}.txt`;
    fs.writeFile(`${OUTPUT_DIR}/${outputFileName}`, result, function (err) {
      if (err) return console.log(err);
    });

    console.log(`Transcribe "${fileName}" completed`);
  });

  console.log("All Done!");
});
