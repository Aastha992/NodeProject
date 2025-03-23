const fs = require("fs");
const path = require("path");
const handlebars = require("handlebars");

const weeklytemplatePath = path.join(__dirname, "weeklyTemplate.html");
const weeklytemplateSource = fs.readFileSync(weeklytemplatePath, "utf8");
const dailyTemplatePath = path.join(__dirname, "dailyTemplate.html");
const dailyTemplateSource = fs.readFileSync(dailyTemplatePath, "utf8");
const dailyDiaryTemplatePath = path.join(__dirname, "dailyDiary.html");
const dailyDiaryTemplateSource = fs.readFileSync(dailyDiaryTemplatePath, "utf8");

const dailyTemplate = handlebars.compile(dailyTemplateSource);
const weeklyTemplate = handlebars.compile(weeklytemplateSource);
const dailyDiaryTemplate = handlebars.compile(dailyDiaryTemplateSource);

module.exports = { weeklyTemplate, dailyTemplate, dailyDiaryTemplate };


