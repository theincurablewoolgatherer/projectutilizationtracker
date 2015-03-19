var express = require('express');
var app = express.Router();
var passport = require('passport');
var constants = require('../utils/constants');
var Manhour = require(__dirname+'/../models/Manhour');
var Project = require(__dirname+'/../models/Project');
var Holiday = require(__dirname+'/../models/Holiday');
var Leave = require(__dirname+'/../models/Leave');
var nodeExcel = require('excel-export');

//========================================================
// I. Controller actions
//========================================================
showReportsView = function(req, res){
	res.render('reports', { title: 'ASL Utilization Tracker', isManager: req.user.usertype == constants.USERTYPE_PROJECT_MANAGER } );
}

printReportsView = function(req, res){
	app.getReportData(req, res, function(report) {
    report.projectname = req.params.projectname;
    report.start = new Date(parseInt(req.params.start));
    report.end =  new Date(parseInt(req.params.end));
		res.render('reportPrint', { title: 'ASL Utilization Tracker',  report: report});
	});
}

app.getReportData = function(req, res, callback){
	var start = new Date(parseInt(req.params.start));
  start.setHours(0,0,0,0);
  var end = new Date(parseInt(req.params.end));
  end.setHours(23,59,59,0);
  var _manhours = [];
  var _dailyReport = [];
  var dailyReport = [];
  var tempDate = new Date(start);
  var daysOfYear = [];
  var taskSummary = {};
  var memberSummary = {};
  var report = {};
  var leaveSummary = {};
  var inOutSummary = {'Total Office Hours': 0, 'Total Non-Working': 0, 'Total Utilization': 0, 'Total Paid Overtime': 0, 'Total Unpaid Overtime': 0, 'Total Overtime': 0, 'Total Leaves': 0};
  for (var d = tempDate; d <= end; d.setDate(d.getDate() + 1)) {
    var utcDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    _dailyReport.push({date: utcDate, manhours: []});
  }

  Manhour.find({
   date: { $gte:start, $lte:end}
   //  tasks: { project: mongoose.Types.ObjectId(req.params.projectid) } 
  }, function (err, manhours) {
    if (err) {
      res.statusCode = 500;
      res.send({error: err});
    } else {

      Holiday.find(function (err, holidays) {
        if (err) {
          res.statusCode = 500;
          res.send({error: err});
        } else {
            console.log(JSON.stringify(holidays));
            // Only include manhours that has a task for the specified project
            for(var m = 0; m < manhours.length; m++){
              var shouldPush = false;
              for(var t = 0; t < manhours[m].tasks.length; t++){
                if(manhours[m].tasks[t].project == req.params.projectid && manhours[m].tasks[t].duration > 0){
                  shouldPush = true;
                  break;
                }
              }
              // Remove tasks that do not belong in project
              if(shouldPush){
                var _tasks = [];
                for(var t = 0; t < manhours[m].tasks.length; t++){
                  if(manhours[m].tasks[t].project == req.params.projectid && manhours[m].tasks[t].duration > 0){
                    _tasks.push(manhours[m].tasks[t]);
                  }
                }
                manhours[m].tasks = _tasks;
                _manhours.push(manhours[m]);
              }
            }
            

            // Group manhours by date
            for(var m = 0; m < _manhours.length; m++){
              for(var d = 0; d < _dailyReport.length; d++){
                if(new Date(_manhours[m].date).getTime() == _dailyReport[d].date.getTime()){
                  _dailyReport[d].manhours.push(_manhours[m]);
                }
              }
            }

            // Final grouping of daily manhour - remove dates that has no manhour
            for(var d = 0; d < _dailyReport.length; d++){
              if(_dailyReport[d].manhours.length > 0){
                dailyReport.push(_dailyReport[d]);
              }
            }

            // Get summary for Task and Member
            for(var d = 0; d < dailyReport.length; d++){
              for(var m = 0; m < dailyReport[d].manhours.length; m++){
                for(var t = 0; t < dailyReport[d].manhours[m].tasks.length; t++){
                  if(dailyReport[d].manhours[m].tasks[t].project == req.params.projectid){
                    // task summary
                    if(taskSummary[dailyReport[d].manhours[m].tasks[t].task]){
                      taskSummary[dailyReport[d].manhours[m].tasks[t].task] += dailyReport[d].manhours[m].tasks[t].duration || 0;
                    }else{
                      taskSummary[dailyReport[d].manhours[m].tasks[t].task] = dailyReport[d].manhours[m].tasks[t].duration;
                    }

                    // Total Utilization
                    inOutSummary['Total Utilization'] += dailyReport[d].manhours[m].tasks[t].duration || 0;

                    // Member summary
                    memberSummary[dailyReport[d].manhours[m].user] = memberSummary[dailyReport[d].manhours[m].user] || {};
                    memberSummary[dailyReport[d].manhours[m].user][dailyReport[d].manhours[m].tasks[t].task] = memberSummary[dailyReport[d].manhours[m].user][dailyReport[d].manhours[m].tasks[t].task] || 0;
                    memberSummary[dailyReport[d].manhours[m].user][dailyReport[d].manhours[m].tasks[t].task] += dailyReport[d].manhours[m].tasks[t].duration || 0; 
                    memberSummary[dailyReport[d].manhours[m].user][dailyReport[d].manhours[m].tasks[t].task] = parseFloat(memberSummary[dailyReport[d].manhours[m].user][dailyReport[d].manhours[m].tasks[t].task]);
                  }
                }
                memberSummary[dailyReport[d].manhours[m].user]['Non-Working'] =  memberSummary[dailyReport[d].manhours[m].user]['Non-Working'] || 0;
                memberSummary[dailyReport[d].manhours[m].user]['Non-Working'] += dailyReport[d].manhours[m].nonworking || 0;
                inOutSummary['Total Non-Working'] += dailyReport[d].manhours[m].nonworking || 0;
                inOutSummary['Total Office Hours'] += (new Date(dailyReport[d].manhours[m].timeout) - new Date(dailyReport[d].manhours[m].timein));

                if(dailyReport[d].manhours[m].otProject && dailyReport[d].manhours[m].otProject == req.params.projectid){
                  var isNonWorking = dailyReport[d].manhours[m].date.getDay() == 0 || dailyReport[d].manhours[m].date.getDay() == 6;
                  if(!isNonWorking){
                    for(var h = 0; h < holidays.length; h++){
                      if(new Date(holidays[h].date).getTime() == dailyReport[d].manhours[m].date.getTime()){
                        isNonWorking = true;
                        break;
                      }
                    }
                  }
                  var regWorkHours = isNonWorking ? 0 : 8;
                  var officeHours = (new Date(dailyReport[d].manhours[m].timeout) - new Date(dailyReport[d].manhours[m].timein)) /3600000;
                  var overtimeHours = officeHours - dailyReport[d].manhours[m].nonworking - regWorkHours;
                  if(dailyReport[d].manhours[m].isOvertime){
                    inOutSummary['Total Paid Overtime'] += overtimeHours;
                  }else{
                    inOutSummary['Total Unpaid Overtime'] += overtimeHours;
                  }
                  inOutSummary['Total Overtime'] += overtimeHours;
                }
                // Get list of members - Will be used for leaves
               // leaveSummary[dailyReport[d].manhours[m].user] = [];
              }
            }

            report.taskSummary = taskSummary;
            report.memberSummary = memberSummary;
            report.dailyReport = dailyReport;
            inOutSummary['Total Office Hours'] = (inOutSummary['Total Office Hours'] / 3600000).toFixed(2);
            report.inOutSummary = inOutSummary;
            report.leaveSummary = leaveSummary;

            //Rounding off values
            for (var k in taskSummary) {
              taskSummary[k] = taskSummary[k].toFixed(2);
            }
            for (var k in inOutSummary) {
              inOutSummary[k] = parseFloat(inOutSummary[k]).toFixed(2);
            }
            for (var m in memberSummary) {
              for(var tm in memberSummary[m]){
                memberSummary[m][tm] = memberSummary[m][tm].toFixed(2);
              }
            }

            // Get Leaves
            Project.findOne({
              _id: req.params.projectid
            }, function (err, project) {
              if (err) {
                res.statusCode = 500;
                res.send({error: err});
              } else {
                var members = project.members;

                Leave.find({date:{ $gte:start, $lte:end}}).populate("user").exec(
                  function (err, leaves) {
                    if (err) {
                      res.statusCode = 500;
                      res.send({error: err});
                    } else {
                      res.statusCode = 200;
                    }
                    for(var l = 0; l < leaves.length; l++){
                      if(!report.leaveSummary.hasOwnProperty(leaves[l].user.username)){
                        report.leaveSummary[leaves[l].user.username] = [];
                      }
                      for(var m = 0; m < members.length; m++){
                        if(leaves[l].user.username == members[m].username){
                          report.leaveSummary[leaves[l].user.username].push(leaves[l]);
                          inOutSummary['Total Leaves']++;
                        }
                      }
                      
                      //}
                    }
                    for (var property in report.leaveSummary) {
                        if (report.leaveSummary.hasOwnProperty(property) && report.leaveSummary[property].length == 0) {
                            delete report.leaveSummary[property];
                        }
                    }
                    if(Object.keys(report.leaveSummary).length == 0){
                      delete report.leaveSummary;
                    }
                    return callback(report);
                });
              }
            });
            
      
        }
      });
    };
  });
}

getExcelReport = function(req, res){
  var projectTasks = [];
  var projectMembers = [];
  Project.findOne({
    _id: req.params.id
  }, function (err, project) {
    if (err) {
      res.statusCode = 500;
      res.send({error: err});
    } else {
      res.statusCode = 200;
    }
    return res.json(project);
  });
  app.getReportData(req, res, generateExcel());
/*
  var conf ={};
  //conf.stylesXmlFile = "styles.xml";
  conf.cols = [{
      caption:'string',
      type:'string',
      beforeCellWrite:function(row, cellData){
           return cellData.toUpperCase();
      },
      width:28.7109375
  },{
      caption:'date',
      type:'date',
      beforeCellWrite:function(){
          var originDate = new Date(Date.UTC(1899,11,30));
          return function(row, cellData, eOpt){
              if (eOpt.rowNum%2){
                  eOpt.styleIndex = 1;
              }  
              else{
                  eOpt.styleIndex = 2;
              }
              if (cellData === null){
                eOpt.cellType = 'string';
                return 'N/A';
              } else
                return (cellData - originDate) / (24 * 60 * 60 * 1000);
          } 
      }()
  },{
      caption:'bool',
      type:'bool'
  },{
      caption:'number',
       type:'number'              
  }];
  conf.rows = [
      ['pi', new Date(Date.UTC(2013, 4, 1)), true, 3.14],
      ["e", new Date(2012, 4, 1), false, 2.7182],
      ["M&M<>'", new Date(Date.UTC(2013, 6, 9)), false, 1.61803],
      ["null date", null, true, 1.414]  
  ];
  var result = nodeExcel.execute(conf);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats');
  res.setHeader("Content-Disposition", "attachment; filename=" + "Report.xlsx");
  res.end(result, 'binary');
  */
}


function isAdmin(req, res, next) {
    if (req.user && req.user.usertype != constants.USERTYPE_PROJECT_MANAGER){
      var err = new Error('Forbidden');
      err.status = 403;
      return next(err);
    }
    return next();
}

//========================================================
// II. Controller URL to Action mapping
//========================================================
app.get('/', isAdmin, showReportsView);
app.get('/print/:projectname/:projectid/from/:start/to/:end', isAdmin, printReportsView);
app.get('/excel/:projectname/:projectid/from/:start/to/:end', isAdmin, getExcelReport);
module.exports = app;
