
 /**********************************************************************
 * Custom Services
 **********************************************************************/
var manhours = angular.module('manhours');

// Manhour Model Http Services/Helper functions
manhours.service('manhour', function($http, ROUTE,dateHelper){
  
  this.delete = function(manhour){
    return $http.post(ROUTE.MANHOUR_DELETE, manhour);
  }

  this.buildNewManhour = function(date){
    return $http.get(ROUTE.LOGGED_USER).then(
      function(user) {
        date = new Date(date.getTime());
        date.setHours(0,0,0,0);
        var tasks = [];
        var mh_fields = [];
        return $http.get(ROUTE.USER_PROJECT_LIST + user.data.username).then(
            function(projects) {
              for(var p = 0; p < projects.data.length; p++){
                for(var t = 0; t < projects.data[p].tasks.length; t++){
                  mh_fields.push({project: projects.data[p].name, field_name: projects.data[p].tasks[t].task});
                  tasks.push({"project": projects.data[p]._id, task: projects.data[p].tasks[t].task});
                }
              }
            var manhour = {
              date: date,
              user: user.data.username,
              nonworking: 1,
              isOvertime: 0,
              tasks: tasks,
              timein_hour: 9,
              timein_min: 0,
              timeout_hour: 18,
              timeout_min: 0,
              mh_fields: mh_fields
            };
            //console.log("INNER" + manhour);
            return manhour;
        }).then(function(data){
            //console.log("OUTER" + data);
            return data;
        });
      }
    );
    
  }

  // Load Manhour for the day if existing
  this.buildManhour = function(manhour){
    if(manhour){
      if(manhour.date.constructor === String){
        manhour.date  = dateHelper.getLocalFromUTCTime(dateHelper.getDateFromString(manhour.date));
      }
      if(manhour.timein.constructor === String){
        manhour.timein  = dateHelper.getLocalFromUTCTime(dateHelper.getDateFromString(manhour.timein));  
      }
      if(manhour.timeout.constructor === String){
        manhour.timeout  = dateHelper.getLocalFromUTCTime(dateHelper.getDateFromString(manhour.timeout));
      }
    }

    manhour.timein_hour = manhour.timein.getHours();
    manhour.timein_min = manhour.timein.getMinutes();
    manhour.timeout_hour = manhour.timeout.getHours();
    manhour.timeout_min = manhour.timeout.getMinutes();
    manhour.isOvertime = manhour.isOvertime ? 1 : 0;
    manhour.mh_fields = [];

    for(var t = 0; t < manhour.tasks.length; t++){
      var mh_field = {project: manhour.tasks[t].project.name, 
                      field_name: manhour.tasks[t].task};
      manhour.mh_fields.push(mh_field);
      
    }
    
    return manhour;
  } 
});
// Project Model Http Services
manhours.service('projects', function($http, ROUTE, MESSAGE) {
  this.getAll = function() {
    return $http.get(ROUTE.PROJECT_LIST).then(
      function(result) {
           return result.data;
    });
  };

  this.getUserProjectList = function(user){
        return $http.get(ROUTE.USER_PROJECT_LIST + user).then(
            function(projects) {
            return projects;
        });
  }

  this.getUserProjects = function(){
    return $http.get(ROUTE.LOGGED_USER).then(
      function(user) {
        return $http.get(ROUTE.USER_PROJECT_LIST + user.data.username).then(
            function(projects) {
            return projects;
        }).then(function(data){
            return data;
        });
      }
    );
  }

});

// Holiday Model Http Services
manhours.service('holidays', function($http, ROUTE, MESSAGE, dateHelper) {
  this.getAll = function() {
    return $http.get(ROUTE.HOLIDAY_LIST).then(
      function(result) {
        for(var h = 0; h < result.data.length; h++){
          var holiday = result.data[h];
          if(holiday && holiday.date.constructor === String){
            holiday.date  = dateHelper.getLocalFromUTCTime(dateHelper.getDateFromString(holiday.date));
          }
        }
        return result.data;
      });
  };

  this.getHolidaysInDateRange = function(startDate, endDate) {
    var url = ROUTE.HOLIDAY_LIST + "/from/" + startDate.getTime()+"/to/"+endDate.getTime()+"?"+new Date();
   // console.log(url);
    return $http.get(url);
  };

  this.delete = function(holiday){
    return $http.post(ROUTE.HOLIDAY_DELETE, holiday);
  }
});

// User Model Http Services
manhours.service('users', function($http, ROUTE) {
  this.getAll = function() {
    return $http.get(ROUTE.USER_LIST).then(
      function(result) {
        return result.data;
    });
  };

  this.getProjectMates = function(user){
    return $http.get(ROUTE.USER_PROJECT_MATES + user).then(
      function(result) {
        return result.data;
    });
  }
});

manhours.service('dateHelper', function(){
  this.getDateFromString = function(date){
    var tempDate = new Date(date);
    //tempDate.setTime(tempDate.getTime() + tempDate.getTimezoneOffset()*60*1000 );
    return tempDate;
  };

  this.getUTCTime = function(date){
    var utcTime = date.getTime() - ((date.getTimezoneOffset()/60) * 3600000); 
    return new Date(utcTime);
  }

  this.getUTCTimeMs = function(date){
    return Date.UTC(date.getFullYear(),date.getMonth(), date.getDate());
  }

  this.getLocalFromUTCTime = function(date){
    var utcTime = date.getTime() + ((date.getTimezoneOffset()/60) * 3600000); 
    return new Date(utcTime);
  }
    
  this.isSameDay = function(date1, date2){
    var _date1 = new Date(date1);
    _date1.setHours(0,0,0,0);
    var _date2 = new Date(date2);
    _date2.setHours(0,0,0,0);
    return _date1.getTime() == _date2.getTime();
  }
  
  this.getFirstDateOfMonth = function(date){
    var firstDateOfMonth = new Date(date);
    var month = firstDateOfMonth.getMonth();
    var year = firstDateOfMonth.getFullYear();
    var _firstDateOfMonth = new Date(year, month, 1);
    return _firstDateOfMonth;
  }
  
  this.getLastDateOfMonth = function(date){
    var lastDateOfMonth = new Date(date);
    var month = lastDateOfMonth.getMonth() + 1;
    var year = lastDateOfMonth.getFullYear();
    return new Date(year, month, 0);
  }
});

manhours.service('toast', function(ngToast){
    this.saved = function(){
      var msg = ngToast.create({
        content: 'Saved'
      });
    }

    this.deleted = function(record){
      var msg = ngToast.create({
        content: (record || '') + ' Deleted'
      });
    }

    this.leaveToggled = function(filter){
      var msgString = "Shown Leaves: " + filter.label;
      var msg = ngToast.create({
        content: msgString,
         class: 'info'
      });
    }

    this.error = function(error){
      var msg = ngToast.create({
        content: error,
        class: 'danger'
      });
    }
});
manhours.service('tags', function($q, users) {
      this.loadUsers = function(query) {
        // TODO: DUPLICATE MATCHING ALGORITHM
        // Create utility class that matches
        var deferred = $q.defer();
        var results = [];
        
        users.getAll().then(function(data){
          //console.log(data);
          var userlist = data;
          for(i = 0; i < userlist.length; i++){
            if (userlist[i].username.indexOf(query) == 0) {
              results.push(userlist[i].username);
            }
         }
         deferred.resolve(results);
        });
        return deferred.promise;
      };

});

manhours.service('validation', function(){
  this.isTimeZoneChanged = function(baseDateOffset){
    if(new Date().getTimezoneOffset() !== baseDateOffset){
      alert("Client timezone was modified!\n Reloading page...");
      location.reload();
      return true;
    }
  }
});

manhours.service('inout', function() {
    this.getMinutes = function(){
      var minutes = [];
      for(var min = 0; min < 60; min++){
        minutes.push(min);
      }
      return minutes;  
    }
    this.getHours = function(){
      var hours = [];
      for(var hour = 0; hour < 24; hour++){
        hours.push(hour);
      }
      return hours;  
    }
});
