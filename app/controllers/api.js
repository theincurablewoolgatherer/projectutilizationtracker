/**
*   Contains routes for the API
*
*/
var constants = require(__dirname+'/../utils/constants');
var express = require('express');
var request = require('request');
var passport = require('passport');
var User = require(__dirname+'/../models/User');
var Project = require(__dirname+'/../models/Project');
var Manhour = require(__dirname+'/../models/Manhour');
var Leave = require(__dirname+'/../models/Leave');
var Holiday = require(__dirname+'/../models/Holiday');
var mongoose = require("mongoose");
var app = express.Router();
var reportApi = require(__dirname+'/ReportController');
var https = require('https');
//========================================================
// I. Controller actions
//========================================================

// Create User: If no User is in database,
// create an Admin User.

getUserFullName = function(req, res){
var options = {
   // url: "https://107.105.134.72:8443/alfresco/service/api/login?u=j.uy&pw=srphldap&format=json",
    hostname: '107.105.134.72',
    port: 8443,
    path: '/alfresco/service/api/login?u=j.uy&pw=srphldap&format=json',
    method: 'GET',
    rejectUnauthorized: false,
    requestCert: true,
    agent: false
  };
  console.log("wee");
  var req2 = https.request(options,
   function(res) {
  console.log("statusCode: ", res.statusCode);
  console.log("headers: ", res.headers);

  res.on('data', function(d) {
    process.stdout.write(d);
  });
});
 req2.end();
 req2.on('error', function(e) {
  console.error(e);
});
}
userCreate = function(req, res) {
  var _usertype = constants.USERTYPE_DEVELOPER;
  var options = {
    url: "http://" + req.get('host') + "/api/user/list", 
    json: true,
    method: 'GET'
  };
  request(options,
    function(err, response, users) {
      if(users.length == 0){
        // Create Admin User
        _usertype = constants.USERTYPE_PROJECT_MANAGER;
      }

      // Save User 
      User.create({
        username: req.body.username,
        usertype: _usertype
      }, function (err, user) {
        if (err) {
          res.statusCode = 500;
          res.send({error: err});
        } else {
          res.statusCode = 200;
        }
        return res.json(user);
      });
    }
  );
}

// Get User Details
userDetails = function(req, res){
  User.findOne({
    username: req.params.username
  }, function (err, user) {
    if (err) {
      res.statusCode = 500;
      res.send({error: err});
    } else {
      res.statusCode = 200;
    }
    return res.json(user);
  });
}

// Update User
userUpdate = function(req, res) {
    var updateData = {};
    if(req.body.username != null) updateData.username = req.body.username;
    if(req.body.firstname != null) updateData.firstname = req.body.firstname;
    if(req.body.lastname != null) updateData.lastname = req.body.lastname;
    if(req.body.usertype != null) updateData.usertype = req.body.usertype;
   
    User.update({_id: req.body._id}, updateData, function(err,affected) {
          if(!err){
            res.statusCode = 200;
            return res.send({status: 'OK'});
          }else{
          res.statusCode = 500;
            return res.send({error : err});
        }
    });    
}   

// Get List of Users
userList = function(req, res){
  User.find(function (err, users) {
    if (err) {
      res.statusCode = 500;
      res.send({error: err});
    } else {
      res.statusCode = 200;
    }
    return res.json(users);
  });
}

// Create Project
projectCreate = function(req, res) {
  var project = new Project(req.body);
  project.manager = req.user;
  var upsertData = project.toObject();
  delete upsertData._id;
  Project.update({_id: mongoose.Types.ObjectId(project._id)}, upsertData, {upsert: true}, function (err) {
        if(!err){
           res.statusCode = 200;
              return res.send({status: 'OK'});
            }else{
              res.statusCode = 500;
              return res.send({error : err});
            }
   });

    // var project = new Project(req.body);
    // project.manager = req.user;
    // console.log("WOW" + project);
    // return project.save(function(err){
    //     if(!err){
    //       res.statusCode = 200;
    //       return res.send({status: 'OK'});
    //     }else{
    //       res.statusCode = 500;
    //       return res.send({error : err});
    //     }
    // });
}

// Get List of Projects
projectList = function(req, res){
  Project.find(function (err, projects) {
    if (err) {
      res.statusCode = 500;
      res.send({error: err});
    } else {
      res.statusCode = 200;
    }
    return res.json(projects);
  });
}

// Get Project Details
projectDetails = function(req, res){
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
}

// Get List of Projects of user
userProjectList = function(req, res){
  Project.find({members: { username: req.params.username } },
    function (err, projects) {
      if (err) {
        res.statusCode = 500;
        res.send({error: err});
      } else {
        res.statusCode = 200;
      }
      return res.json(projects);
  });
}

// Get List of Projects of user
userTeamMates = function(req, res){
  Project.find({members: { username: req.params.user } },
    function (err, projects) {
      var mates = [];
      if (err) {
        res.statusCode = 500;
        res.send({error: err});
      } else {
        res.statusCode = 200;
        for(var p = 0; p < projects.length; p++){
          for(var m = 0; m < projects[p].members.length; m++){
            mates.push(projects[p].members[m].username);
          }
        }
      }
      return res.json(mates);
  });
}

// Create Manhour
manhourCreate = function(req, res) {
  // error trap: loggedinser == manhour.user
    var manhour = new Manhour(req.body);
    return manhour.save(function(err){
        if(!err){
          res.statusCode = 200;
          return res.send({status: 'OK', manhour: manhour});
        }else{
          res.statusCode = 500;
          return res.send({error : err});
        }
    });
}

// Update Manhour
manhourUpdate = function(req, res) {
    var updateData = {};
    if(req.body.user != null) updateData.user = req.body.user;
    if(req.body.date != null) updateData.date = req.body.date;
    if(req.body.timein != null) updateData.timein = req.body.timein;
    if(req.body.timeout != null) updateData.timeout = req.body.timeout;
    if(req.body.tasks != null) updateData.tasks = req.body.tasks;
    if(req.body.isOvertime != null) updateData.isOvertime = req.body.isOvertime;
    if(req.body.nonworking != null) updateData.nonworking = req.body.nonworking;
    updateData.otProject = req.body.otProject;
    for(var t = 0; t < updateData.tasks.length; t++){
      if(typeof updateData.tasks[t].project === 'string'){
        updateData.tasks[t].project = mongoose.Types.ObjectId(updateData.tasks[t].project);
      }else{
        updateData.tasks[t].project = mongoose.Types.ObjectId(updateData.tasks[t].project._id);
      }
    }

    Manhour.update({_id: req.body._id}, updateData, function(err,affected) {
          if(!err){
            res.statusCode = 200;
            return res.send({status: 'OK'});
          }else{
            res.statusCode = 500;

            return res.send({error : err});
        }
    });    
}   


// Get Manhour Details
manhourDetailsById = function(req, res){
  Manhour.findOne({
   _id: req.params.id
  }, function (err, manhour) {
    if (err) {
      res.statusCode = 500;
      res.send({error: err});
    } else {
      res.statusCode = 200;
    }
   
    return res.json(manhour);
  });
}

manhourDetails = function(req, res){
  var mh_date = new Date(parseInt(req.params.date));
  
  Manhour.findOne({
    user: req.params.username,
    date: mh_date
  }).populate("tasks.project").exec(function (err, manhour) {
    if (err) {
      res.statusCode = 500;
      res.send({error: err});
    } else {
      res.statusCode = 200;
    }
   
    return res.json(manhour);
  });
}

// Get Manhour for a given duration
manhourListForDateRange = function(req, res){
  var start = new Date(parseInt(req.params.start));
  var end = new Date(parseInt(req.params.end));
  Manhour.find({
    user: req.params.username,
    date: { $gte:start, $lte:end}
  }).populate("tasks.project").exec(function (err, manhourList) {
    if (err) {
      res.statusCode = 500;
      res.send({error: err});
    } else {
      res.statusCode = 200;
    }
    return res.json(manhourList);
  });
}

// Delete Manhour
manhourDelete = function(req, res) {
  console.log('delete ' + req.body.date.constructor);
  Manhour.findOneAndRemove({date: new Date(req.body.date), user: req.user.username }, function(err) {
    if(!err){
           res.statusCode = 200;
              return res.send({status: 'OK'});
            }else{
              res.statusCode = 500;
              return res.send({error : err});
    }
  });
}

// Create Manhour
leaveCreate = function(req, res) {
  // error trap: loggedinser == manhour.user
    var startDate = new Date(req.body.date);
    startDate.setTime(startDate.getTime() + startDate.getTimezoneOffset()*60*1000 )
    var endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    if(!req.user){
      res.statusCode = 500;
      return res.send({error : "User session expired."});
    }

    var leave = new Leave({
      date: new Date(req.body.date),
      user: req.user,
      type: req.body.type,
      remarks: req.body.remarks,
      filedate: new Date()
    });

    console.log(leave.user);
    var upsertData = leave.toObject();
    delete upsertData._id;
    Leave.update({user: mongoose.Types.ObjectId(leave.user._id), date: leave.date}, upsertData, {upsert: true}, function (err) {
        if(!err){
           res.statusCode = 200;
              return res.send({status: 'OK'});
            }else{
              res.statusCode = 500;
              return res.send({error : err});
            }
      });
} 

// Delete Leaves
leaveDelete = function(req, res) {
  Leave.findOneAndRemove({date: new Date(req.body.date), user: mongoose.Types.ObjectId(req.user._id) }, function(err) {
    if(!err){
           res.statusCode = 200;
              return res.send({status: 'OK'});
            }else{
              res.statusCode = 500;
              return res.send({error : err});
    }
  });
}
// User Leaves
userLeaves = function(req, res) {
  var start = new Date(parseInt(req.params.start));
  var end = new Date(parseInt(req.params.end));
  Leave.find({user: req.params.userid, date:{ $gte:start, $lte:end}},
    function (err, leaves) {
      if (err) {
        res.statusCode = 500;
        res.send({error: err});
      } else {
        res.statusCode = 200;
      }
      return res.json(leaves);
  });
}

// Monthly Leaves
userAllLeaves = function(req, res) {
  var start = new Date(parseInt(req.params.start));
  var end = new Date(parseInt(req.params.end));

  Leave.find({date:{ $gte:start, $lte:end}}).populate("user").exec(
    function (err, leaves) {
      if (err) {
        res.statusCode = 500;
        res.send({error: err});
      } else {
        res.statusCode = 200;
      }
      return res.json(leaves);
  });
}

holidayByDate = function(req, res){
  Holiday.findOne({date: new Date(parseInt(req.params.date))}, function (err, holiday) {
    if (err) {
      res.statusCode = 500;
      res.send({error: err});
    } else {
      res.statusCode = 200;
    }
    return res.json(holiday);
  });
}

holidayCreate = function(req, res) {
  // error trap: loggedinser == manhour.user
    var holiday = new Holiday({
      date: new Date(req.body.date),
      name: req.body.name
    });

    var upsertData = holiday.toObject();
    delete upsertData._id;
    Holiday.update({date: holiday.date}, upsertData, {upsert: true}, function (err) {
        if(!err){
           res.statusCode = 200;
              return res.send({status: 'OK'});
            }else{
              res.statusCode = 500;
              return res.send({error : err});
            }
      });
} 

// Get List of Holidays
holidayList = function(req, res){
  Holiday.find(function (err, holidays) {
    if (err) {
      res.statusCode = 500;
      res.send({error: err});
    } else {
      res.statusCode = 200;
    }
    return res.json(holidays);
  });
}

// Get Holidays for a given duration
holidayListForDateRange = function(req, res){
  var start = new Date(parseInt(req.params.start));
  var end = new Date(parseInt(req.params.end));
  Holiday.find({
    date: { $gte:start, $lte:end}
  }, function (err, holidays) {
    if (err) {
      res.statusCode = 500;
      res.send({error: err});
    } else {
      res.statusCode = 200;
    }
    return res.json(holidays);
  });
}

// Delete Holiday
holidayDelete = function(req, res) {
  Holiday.findOneAndRemove({_id: mongoose.Types.ObjectId(req.body._id) }, function(err) {
    if(!err){
           res.statusCode = 200;
              return res.send({status: 'OK'});
            }else{
              res.statusCode = 500;
              return res.send({error : err});
    }
  });
}

// Get Manhours for a given duration
reportForProjectDateRange = function(req, res){
  var report = reportApi.getReportData(req, res, function(report){
    res.json(report);
  });
  
}

// Migrate
migrateManhour = function(req, res) {
    var updateData = {};
    if(req.body.date) updateData.date = new Date(req.body.date);
    if(req.body.timein) updateData.timein = new Date(req.body.timein);
    if(req.body.timeout) updateData.timeout = new Date(req.body.timeout);

    Manhour.update({_id: req.body._id}, updateData, function(err,affected) {
          if(!err){
            res.statusCode = 200;
            return res.send({status: 'OK'});
          }else{
            res.statusCode = 500;

            return res.send({error : err});
        }
    });    
}   
migrateManhourOT = function(req, res) {
    var updateData = {};
    if(req.body.otProject) updateData.otProject = mongoose.Types.ObjectId(req.body.otProject);
  
    Manhour.update({_id: req.body._id}, updateData, function(err,affected) {
          if(!err){
            res.statusCode = 200;
            return res.send({status: 'OK'});
          }else{
            res.statusCode = 500;

            return res.send({error : err});
        }
    });    
}  
migrateLeave = function(req, res) {
    var updateData = {};
    if(req.body.date) updateData.date = new Date(req.body.date);
    Leave.update({_id: req.body._id}, updateData, function(err,affected) {
          if(!err){
            res.statusCode = 200;
            return res.send({status: 'OK'});
          }else{
            res.statusCode = 500;

            return res.send({error : err});
        }
    });    
}

//========================================================
// II. Controller URL to Action mapping
//========================================================
// app.post('/user/new', userCreate); unsafe
app.get('/user/list', userList);
app.put('/user/update', userUpdate);
app.get('/user/fullname', getUserFullName);
app.get('/user/:username', userDetails);

app.post('/project/new', projectCreate);
app.get('/project/list', projectList);
app.get('/project/list/of/:username', userProjectList);
app.get('/user/mates/:user', userTeamMates);
app.get('/project/:id', projectDetails);
app.post('/manhour/new', manhourCreate);
app.put('/manhour/update', manhourUpdate);
app.post('/manhour/delete', manhourDelete);
app.get('/manhour/:date/of/:username', manhourDetails);
app.get('/manhour/of/:username/from/:start/to/:end', manhourListForDateRange);
app.get('/manhour/:id', manhourDetailsById);
app.post('/leave/new', leaveCreate);
app.post('/leave/delete', leaveDelete);
app.get('/leave/of/:userid/from/:start/to/:end', userLeaves);
app.get('/leave/from/:start/to/:end', userAllLeaves);
app.post('/holiday/new', holidayCreate);
app.get('/report/of/:projectid/from/:start/to/:end', reportForProjectDateRange);

app.get('/holiday/list/from/:start/to/:end', holidayListForDateRange);
app.get('/holiday/list',holidayList);
app.get('/holiday/:date',holidayByDate);
app.post('/holiday/delete',holidayDelete);



app.post('/migrate/manhour/update', migrateManhour);
app.post('/migrate/leave/update', migrateLeave);
app.post('/migrate/manhour/update_ot', migrateManhourOT);
module.exports = app;


