/**********************************************************************
 * Angular Application
 **********************************************************************/
 var manhours = angular.module('manhours', ['ngResource', 'ui.bootstrap', 'ngTagsInput', 'ngContextMenu', 'ngToast']);

/**********************************************************************
 * Configuration
 **********************************************************************/
manhours.config(['ngToastProvider', function(ngToast) {
    ngToast.configure({
      horizontalPosition: 'center',
      maxNumber: 1
    });
}]);

/**********************************************************************
 * Login controller
 **********************************************************************/
 manhours.controller('LoginCtrl', function($scope, $rootScope, $http, $location, MESSAGE, ROUTE, USER, toast) {
    // $scope.user is binded to the login form template: login.jade
    $scope.user = {};

    // $scope.isLoginValid is used in the login form as a boolean flag to either show/hide a login error message
    $scope.isLoginValid = true;

    // Holds the appropriate error message to show
    $scope.err = '';

    // This function is called when the login button was pressed
    $scope.login = function() {
    	if (!$scope.user.username || !$scope.user.password) {
          // Username / Password was left blank by the user
          $scope.isLoginValid = false;
          $scope.err = MESSAGE.LOGIN_FIELDS_REQUIRED;
          return;
      }
      
      // Attempt to authenticate the user
      $http.post(ROUTE.LOGIN, {
        	username: $scope.user.username,
        	password: $scope.user.password,
      })
      .success(function(user) {
                  // No error: authentication OK
                  $scope.isLoginValid = true;
                  $rootScope.message = MESSAGE.LOGIN_SUCESS;
                  // If this is the first login, navigate user to Admin Page
                  // Else, change the URL to the manhour page of the logged on user
                  var redirectTo = ROUTE.MANHOUR;
                  $http.get(ROUTE.USER_LIST).success(function(users) {
                   
                    if(users.length == 1){
                      redirectTo = ROUTE.ADMIN;
                    }
                    window.location.href = redirectTo;
                  });
                  
              })
      .error(function() {
                  // Error: authentication failed
                  toast.error(MESSAGE.LOGIN_FAILED);
                  console.log(MESSAGE.LOGIN_FAILED);
                  $scope.err = MESSAGE.LOGIN_DETAILS_INCORRECT;
                  $rootScope.message = MESSAGE.LOGIN_FAILED;
                  $scope.isLoginValid = false;
            });
    };
});
/**********************************************************************
 * Generic Confirmation Modal controller
 **********************************************************************/
 manhours.controller('ConfirmationModalCtrl', function($scope, $rootScope, $modalInstance, title, message, okButtonPressed) {
  $scope.title = title;
  $scope.message = message;

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };

  $scope.ok = function() {
    okButtonPressed();
  }
});

/**********************************************************************
 * Projects controller
 **********************************************************************/
 manhours.controller('ProjectsCtrl', function($scope, $rootScope, projects, $modal, ngToast) {
    $scope.projects = [];

    $rootScope.$on("loadProjects", function(event, args) {
      projects.getAll().then(function(data){
        $scope.projects = data;
      });
    });
    $rootScope.$broadcast("loadProjects");

    $scope.showProjectForm = function(project) {
       
      var modalInstance = $modal.open({
        templateUrl: 'partials/projectFormModal',
        controller: 'ProjectsFormCtrl',
        windowClass: 'project-modal',
        size: 'sm',
        resolve: {
          project: function() {
            return project;
          }
      }
      });
    };

});

/**********************************************************************
 * Project Form controller
 **********************************************************************/
 manhours.controller('ProjectsFormCtrl', function($scope, $rootScope, $http, $modalInstance, MESSAGE, ROUTE, MODELMODE, project, tags, toast) {
  $scope.project = project;
  $scope.mode = MODELMODE.CREATE;
  if(project){
    $scope.mode = MODELMODE.UPDATE;
  }

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
  $scope.loadUsers = function(query) {
    return tags.loadUsers(query);
  };

  $scope.saveProject = function() {
    $http.post(ROUTE.PROJECT_SAVE, $scope.project)
    .success(function() {
      toast.saved();
      $modalInstance.dismiss('save');
      $rootScope.$broadcast("loadProjects");
    })
    .error(function() {
      toast.error(MESSAGE.SAVE_PROJECT_FAILED);
      console.log(MESSAGE.SAVE_PROJECT_FAILED);
    });
  }
});
/**********************************************************************
 * Report controller
 **********************************************************************/
manhours.controller('ReportCtrl', function($scope, $rootScope, $http, projects, ROUTE) {
  $scope.projects = [];
  $scope.project = {};
  $scope.result = {};
  var getStartDate = function getMonday(d) {
    d = new Date(d);
    var day = d.getDay(),
    diff = d.getDate() - day + (day == 0 ? -6:1); // adjust when day is sunday
    return new Date(d.setDate(diff));
  }
  var getEndDate = function getMonday(d) {
    d = new Date(d);
    return new Date(d.setDate(d.getDate() + 6));
  }
  $scope.startDate = getStartDate(new Date());
  $scope.endDate = getEndDate($scope.startDate);
  $rootScope.$on("loadProjects", function(event, args) {
      projects.getAll().then(function(data){
        $scope.projects = data;
        $scope.project = $scope.projects[0];
        $scope.updateReport();
      });
    });
  $rootScope.$broadcast("loadProjects");

  // Code below is for date picker
  $scope.open1 = function($event) {
      $event.preventDefault();
      $event.stopPropagation();

      $scope.opened1 = true;
  };

  // Code below is for date picker
  $scope.open2 = function($event) {
      $event.preventDefault();
      $event.stopPropagation();

      $scope.opened2 = true;
  };     
  $scope.updateReport = function(){

    var url = ROUTE.REPORT_PROJECTDATERANGE + $scope.project._id + '/from/' + $scope.startDate.getTime() + '/to/' + $scope.endDate.getTime();
    $http.get(url).then(
      function(manhours) {
        $scope.result = manhours.data;
        // console.log($scope.result);
      });
    // console.log("===============");
    // console.log(url);
  }

  $scope.printReport = function(){
    var url = ROUTE.REPORT_PRINT + $scope.project.name + '/'+ $scope.project._id + '/from/' + $scope.startDate.getTime() + '/to/' + $scope.endDate.getTime();
    window.location = url;
  }
 });

/**********************************************************************
 * Holiday controller
 **********************************************************************/
manhours.controller('HolidaysCtrl', function($scope, $rootScope, $http, ROUTE, holidays, $modal, toast, validation, dateHelper) {
    $rootScope.clientTimeZoneOffset = new Date().getTimezoneOffset();

    $scope.holidays = [];

    $rootScope.$on("loadHolidays", function(event, args) {
      holidays.getAll().then(function(data){
        $scope.holidays = data;
      });
    });
    $rootScope.$broadcast("loadHolidays");
    $scope.showHolidayForm = function(holiday){
      console.log($rootScope.clientTimeZoneOffset);

      // Do not allow saving of record if TimeZone Changed in client
      if(validation.isTimeZoneChanged($rootScope.clientTimeZoneOffset)){
        return;
      };

      var modalInstance = $modal.open({
        templateUrl: 'partials/holidayFormModal',
        controller: 'HolidaysFormCtrl',
        windowClass: 'project-modal',
        size: 'sm',
        resolve: {
          holiday: function() {
            return holiday;
          }
      }
      });
    }
    $scope.deleteHoliday = function(holiday_id){
      var holiday = {_id: holiday_id};
      holidays.delete(holiday)
        .success(function(){
          toast.deleted('Holiday');
          $rootScope.$broadcast("loadHolidays");
        })
        .error(function(error){
          toast.error(error);
        });
    }
});

/**********************************************************************
 * Holiday Form controller
 **********************************************************************/
 manhours.controller('HolidaysFormCtrl', function($scope, $rootScope, $http, $modalInstance, MESSAGE, ROUTE, MODELMODE, holiday, tags, toast, dateHelper) {
  $scope.holiday = holiday || {};
  var today = new Date();
  today.setHours(0,0,0,0);
  $scope.holiday.date = $scope.holiday.date || today;
  $scope.mode = MODELMODE.CREATE;
  if(holiday){
    $scope.mode = MODELMODE.UPDATE;
  }

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };

  // Code below is for date picker
  $scope.open1 = function($event) {
      $event.preventDefault();
      $event.stopPropagation();
      $scope.opened1 = true;
  };

  $scope.saveHoliday = function() {
    $scope.holiday.date = dateHelper.getUTCTime($scope.holiday.date);
    $http.post(ROUTE.HOLIDAY_SAVE, $scope.holiday)
    .success(function() {
      toast.saved();
      $scope.holiday.date = dateHelper.getLocalFromUTCTime($scope.holiday.date);
      $modalInstance.dismiss('save');
      $rootScope.$broadcast("loadHolidays");
    })
    .error(function(err) {
      toast.error(err);
      console.log(err);
    });
  }


});

/**********************************************************************
 * User controller
 **********************************************************************/
manhours.controller('UsersCtrl', function($scope, $rootScope, users,  $modal) {
    $scope.users = [{username:"Loading Data"}];
    users.getAll().then(function(data){
      $scope.users = data;
    });

    $scope.showUserForm = function(user){
      var modalInstance = $modal.open({
        templateUrl: 'partials/userFormModal',
        controller: 'UserFormCtrl',
        windowClass: 'user-modal',
        size: 'sm',
        resolve: {
          user: function() {
            return user;
          }
      }
      });
    }
});

/**********************************************************************
 * User Form controller
 **********************************************************************/
 manhours.controller('UserFormCtrl', function($scope, $rootScope, $http, user, $modalInstance, MESSAGE, ROUTE, MODELMODE, USER, toast) {
  $scope.user = user;
  $scope.mode = MODELMODE.UPDATE;
  $scope.usertypes = [USER.USERTYPE_DEVELOPER, USER.USERTYPE_PROJECT_MANAGER];
  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };

 
  $scope.saveUser = function() {
    $http.put(ROUTE.USER_UPDATE, $scope.user)
    .success(function() {
      toast.saved();
      $modalInstance.dismiss('save');
    })
    .error(function(err) {
      console.log(err);
    });
  }
});

/**********************************************************************
 * Calendar controller
 **********************************************************************/
 manhours.controller('CalendarCtrl', function($scope, $rootScope, $http, $modal, users, CALENDARCELL, CALENDAR, ROUTE, MODELMODE, holidays, validation, toast, dateHelper) {
 
    $scope.cal_day_names = CALENDAR.DAYS;
    $scope.cal_months_labels = CALENDAR.MONTHS;
    $scope.contextMenuOptions = CALENDAR.CONTEXT_MENU_ITEMS;
    $scope.cal_current_date;
    $scope.cal_month_day_weeks = [];
    $scope.cal_month_title;
    $scope.month_leaves = [];
    $scope.month_leaves_all = [];
    $scope.month_manhours = [];
    $scope.showForm = true;

    $rootScope.clientTimeZoneOffset = new Date().getTimezoneOffset();

    // Receive broadcast to redraw calendar
    $rootScope.$on("redrawCalendar", function(event) {
        $scope.drawCalendar();
        drawCalendarDetails($scope.cal_current_date);
    });

    // Receive broadcast to force select date
    $rootScope.$on("forceSelectDate", function(event) {
        $scope.selectDate($scope.selecteddate);
    });

    $scope.drawCalendar = function(){
       var firstOfMonth = dateHelper.getFirstDateOfMonth($scope.cal_current_date);
       var lastOfMonth = dateHelper.getLastDateOfMonth($scope.cal_current_date);
       var week_count = Math.ceil( lastOfMonth.getDate() / 7);
       var day_count = lastOfMonth.getDate();
       var firstDayOffset = firstOfMonth.getDay();
       $scope.cal_month_title = $scope.cal_months_labels[$scope.cal_current_date.getMonth()] + " " + $scope.cal_current_date.getFullYear();
       $scope.cal_month_day_weeks = [];
       for(w = 1; w <= week_count; w++){
         var week_days = [];
         for(d = 1; d <= 7; d++){
            var index = (d + ((w-1) * 7)) - firstDayOffset;
            var daynum = "";
            var date = new Date();
            date.setTime($scope.cal_current_date.getTime());
            date.setDate(index);
            date.setHours(0,0,0,0);
            var celltype = CALENDARCELL.DEFAULT;
            if($scope.cal_current_date.getTime() == date.getTime()){
              celltype = CALENDARCELL.SELECTED;
            }else{
              if($scope.cal_current_date.getMonth() != date.getMonth()){
                celltype = CALENDARCELL.OTHERDAY;
              }
            }
            if(index >= 1 && index <= day_count){
              daynum = index;
            }
            week_days.push({index: index, date: date, celltype: celltype, contextMenuOptions: $scope.contextMenuOptions});
         }
         $scope.cal_month_day_weeks.push(week_days);
       }
    }
       
    $scope.nextMonth = function(){
      var newDate = new Date($scope.cal_current_date);
      var month = newDate.getMonth() + 1;
      var nextMonthDayCount = new Date(newDate.getFullYear(),  month+1, 0).getDate();
      if(nextMonthDayCount < newDate.getDate()){
        newDate.setDate(nextMonthDayCount);
      }
      newDate.setMonth(month);
      $scope.selectDate(newDate);
    };

    $scope.prevMonth = function(){
      var newDate = new Date($scope.cal_current_date);    
      var month = newDate.getMonth() - 1;
      var nextMonthDayCount = new Date(newDate.getFullYear(),  month+1, 0).getDate();
      if(nextMonthDayCount < newDate.getDate()){
        newDate.setDate(nextMonthDayCount);
      }
      newDate.setMonth(month);
      $scope.selectDate(newDate);
    };
    $scope.selectDate = function(date){
      // Do not allow saving of record if TimeZone Changed in client
      if(validation.isTimeZoneChanged($rootScope.clientTimeZoneOffset)){
        return;
      };

      var redrawCalendarDates = false;
      // Check if month in view should change
      if(!$scope.cal_current_date || $scope.cal_current_date.getMonth() != date.getMonth()){
        redrawCalendarDates = true;
      }
      $scope.cal_current_date = date;
      $scope.cal_current_date.setHours(0,0,0,0);
      
      // We're changing month, so we need to redraw the calendar
      if(redrawCalendarDates){
        // Redraw Calendar
        $scope.drawCalendar();
          
        // Redraw Calendar Details
        drawCalendarDetails(date);
      }    
      for(var w = 0; w < $scope.cal_month_day_weeks.length; w++){
        for(var d = 0; d < $scope.cal_month_day_weeks[w].length; d++){
          for(var m = 0; m < $scope.month_manhours.length; m++){
           var manhourUTCDate = $scope.month_manhours[m].date;
           if($scope.month_manhours[m].date.constructor === String){
             manhourUTCDate = dateHelper.getLocalFromUTCTime(dateHelper.getDateFromString($scope.month_manhours[m].date));
           }
            if(dateHelper.isSameDay($scope.cal_current_date, manhourUTCDate)){
                
               // Set Current Manhour
               $scope.manhour =  $scope.month_manhours[m];
             }
          }
          var celltype = CALENDARCELL.DEFAULT;
          if($scope.cal_current_date.getTime() == $scope.cal_month_day_weeks[w][d].date.getTime()){
             celltype = CALENDARCELL.SELECTED;
          }else{
             if($scope.cal_current_date.getMonth() !=  $scope.cal_month_day_weeks[w][d].date.getMonth()){
                celltype = CALENDARCELL.OTHERDAY;
             }
          }
          $scope.cal_month_day_weeks[w][d].celltype = celltype;
        }
      }
      $rootScope.$broadcast("selectedDateChanged", {selectedDate: $scope.cal_current_date, manhour: $scope.manhour});
    }

    var drawCalendarDetails = function(date){
       // 1. Draw Holidays in Calendar Cells
       var firstOfMonth = dateHelper.getUTCTime(dateHelper.getFirstDateOfMonth(date));
       var lastOfMonth = dateHelper.getLastDateOfMonth(date);
       holidays.getHolidaysInDateRange(firstOfMonth, lastOfMonth).success(
        function(result){
          console.log(result);
          for(var w = 0; w < $scope.cal_month_day_weeks.length; w++){
            for(var d = 0; d < $scope.cal_month_day_weeks[w].length; d++){
              for(var l = 0; l < result.length; l++){
                var holidayDay = dateHelper.getLocalFromUTCTime(dateHelper.getDateFromString(result[l].date));
                var cellDay = $scope.cal_month_day_weeks[w][d].date;  
                if(dateHelper.isSameDay(holidayDay, cellDay)){
                   $scope.cal_month_day_weeks[w][d].holiday = result[l];
                }
              }
            }
          }
        })
        .error(function(error){
          toast.error(error);
        });

      
         
        // 2. Draw Leave Count/Show Leaves link for each Calendar Cell
        var leave_url_all = ROUTE.USER_LEAVES_ALL + "from/" + firstOfMonth.getTime()+"/to/"+lastOfMonth.getTime()+"?"+new Date().getTime();
        $http.get(leave_url_all).then(
          function(leaves){
              for(var w = 0; w < $scope.cal_month_day_weeks.length; w++){
                for(var d = 0; d < $scope.cal_month_day_weeks[w].length; d++){
                  var day_leaves = [];
                  for(var l = 0; l < leaves.data.length; l++){
                    var leaveDay =  dateHelper.getLocalFromUTCTime(dateHelper.getDateFromString(leaves.data[l].date));
                    var cellDay = $scope.cal_month_day_weeks[w][d].date;
                     
                    if(dateHelper.isSameDay(leaveDay, cellDay)){
                      day_leaves.push(leaves.data[l]);
                      // console.log($scope.cal_month_day_weeks[w][d].date + " LEAVE: " + leaveDay + " = " + leaves.data[l].user.username);
                    }
                  $scope.cal_month_day_weeks[w][d].leave_all = day_leaves;
                  }
                }
              }
        });
       
       // 3. Draw Current Logged on User UI specifics
       $http.get(ROUTE.LOGGED_USER).then(
            function(result) {
                // 3.1 Draw Leave text for the Current Logged on User
                var leave_url = ROUTE.USER_LEAVES + result.data._id + "/from/"+firstOfMonth.getTime()+"/to/"+lastOfMonth.getTime()+"?"+new Date();
                $http.get(leave_url).then(
                  function(leaves){
                  $scope.month_leaves = leaves.data;
                  for(var l = 0; l < leaves.data.length; l++){
                    for(var w = 0; w < $scope.cal_month_day_weeks.length; w++){
                      for(var d = 0; d < $scope.cal_month_day_weeks[w].length; d++){
                        var leaveDay =  dateHelper.getLocalFromUTCTime(dateHelper.getDateFromString(leaves.data[l].date));
                        var cellDay = $scope.cal_month_day_weeks[w][d].date;
                        if(dateHelper.isSameDay(leaveDay, cellDay)){
                           $scope.cal_month_day_weeks[w][d].leave = leaves.data[l];
                         }
                      }
                    }
                  }
                });

               // 3.2 Retrieve manhours for the month and draw indicator on cells if user already inputted
               var manhour_url = ROUTE.MANHOUR_USER + result.data.username + "/from/" + firstOfMonth.getTime()+"/to/"+lastOfMonth.getTime()+"?"+new Date();
               $http.get(manhour_url).then(
                  function(manhours){
                    $scope.month_manhours = manhours.data;
                    for(var w = 0; w < $scope.cal_month_day_weeks.length; w++){
                      for(var d = 0; d < $scope.cal_month_day_weeks[w].length; d++){
                        for(var m = 0; m < manhours.data.length; m++){
                          var mhDay = dateHelper.getLocalFromUTCTime(dateHelper.getDateFromString(manhours.data[m].date));
                         
                          var cellDay = $scope.cal_month_day_weeks[w][d].date;
                           
                          if(dateHelper.isSameDay(mhDay, cellDay)){
                             $scope.cal_month_day_weeks[w][d].manhour = manhours.data[m];
                           }
                        }
                      }
                    }
              });
      });
    }
    
    $scope.applyLeave = function(date, type, mode){
      var leaveDate = dateHelper.getUTCTime(date);
      var leave = {date: leaveDate, type: type};
      var leave_url = ROUTE.LEAVE_SAVE;

      // Do not allow saving of record if TimeZone Changed in client
      if(validation.isTimeZoneChanged($rootScope.clientTimeZoneOffset)){
        return;
      };

      if(mode === 0){
        leave_url = ROUTE.LEAVE_DELETE;
      }
      $http.post(leave_url, leave)
        .success(function() {
          toast.saved();
          // console.log(JSON.stringify(leave));
          $rootScope.$broadcast("redrawCalendar");
        })
        .error(function(error) {
          console.log(JSON.stringify(error));
      });

    }

    $scope.showLeaves = function(date, day_leaves) {
      var modalInstance = $modal.open({
        templateUrl: 'partials/userLeavesModal',
        controller: 'LeavesModalCtrl',
        windowClass: 'leaves-modal',
        size: 'sm',
        resolve: {
          date: function() {
            return date;
          },
          day_leaves: function() {
            return day_leaves;
          }
       }
      });
    };

    // init
    $scope.selectDate(new Date());
});

/**********************************************************************
 * Leaves modal controller
 **********************************************************************/
 manhours.controller('LeavesModalCtrl', function($scope, $rootScope, $modalInstance, date, day_leaves){
    $scope.date = date;
    $scope.day_leaves = day_leaves;
    $scope.cancel = function () {
       $modalInstance.dismiss('cancel');
    };
 });

/**********************************************************************
 * Project Utilization controller
 **********************************************************************/
 manhours.controller('ManHourCtrl', function($scope, $rootScope, $filter, $modal, $http, inout, ROUTE, MESSAGE, MODELMODE, validation, projects, holidays, manhour, toast, dateHelper) {
  $scope.saveEnabled = true;

  // Inout Time - Dropdown Values
  $scope.inout_time_hours = inout.getHours();
  $scope.inout_time_minutes = inout.getMinutes();

  // User Projects
  projects.getUserProjects().then(function(data){
    $scope.user_projects = data.data;
  });

  // Holidays
  holidays.getAll().then(function(holidays){
    $rootScope.holidays = holidays;
  });

  // Current Date Selected in calendar
  $scope.selecteddate = new Date();
  $scope.selecteddate.setHours(0,0,0,0);

  // Flag to check if utilization exceeds regular hours
  $scope.showOvertimeOption = false;

  manhour.buildNewManhour($scope.selecteddate).then(function(_manhour){
    $scope.new_manhour_template = _manhour;
    
    //console.log("INIT " + $scope.selecteddate);
    // Initial Manhour to show
    var manhour_url = "/api" + ROUTE.MANHOUR +"/"+ dateHelper.getUTCTime($scope.selecteddate).getTime() + "/of/" + _manhour.user;
    $http.get(manhour_url).then(function(res){
      var manhour;
      if(res.data !== "null"){
          manhour = res.data;
      }
      drawManHours({selectedDate: $scope.selecteddate, manhour: manhour});
    });

  });
  // Total Office Duration
  $scope.officeDuration = 0;

  // Total Office Duration
  $scope.undistributedHours = 0;

  // Sum of Project Utilization
  $scope.totalUtilizedHours = 0;

  // Overtime Duration
  $scope.overtimeHours = 0;

  // User changed the Date
  $rootScope.$on("selectedDateChanged", function(event, args) {
    $scope.selecteddate = args.selectedDate;
    drawManHours(args);
  });


  var drawManHours = function(args){
    var initializeNewManhour = function(){
        $scope.manhour = {};
        $scope.manhour.date = $scope.selecteddate;
        $scope.manhour.user = $scope.new_manhour_template.user;
        $scope.manhour.nonworking = $scope.new_manhour_template.nonworking;
        $scope.manhour.isOvertime = 0;
        $scope.manhour.tasks = [];
        for(var t = 0; t < $scope.new_manhour_template.tasks.length; t++){
          var task = {"project": $scope.new_manhour_template.tasks[t].project, task: $scope.new_manhour_template.tasks[t].task};
          $scope.manhour.tasks.push(task);
        }
        $scope.manhour.mh_fields = $scope.new_manhour_template.mh_fields;
        $scope.manhour.timein_hour = $scope.new_manhour_template.timein_hour;
        $scope.manhour.timein_min = $scope.new_manhour_template.timein_min;
        $scope.manhour.timeout_hour = $scope.new_manhour_template.timeout_hour;
        $scope.manhour.timeout_min = $scope.new_manhour_template.timeout_min;
    } 
    
    if(args.manhour){
      var manhourUtcDate = args.manhour.date;
      if(args.manhour.date.constructor === String){
          manhourUtcDate = dateHelper.getLocalFromUTCTime(dateHelper.getDateFromString(args.manhour.date));
      }
      if(dateHelper.isSameDay($scope.selecteddate, manhourUtcDate)){
        // Manhour already exists
        $scope.manhour = manhour.buildManhour(args.manhour);
      }else{
        // New Manhour
        initializeNewManhour();
      }
    }else{
        // New Manhour
        initializeNewManhour();
    }
    $scope.updateInOut();
    $scope.updateTotalUtilization();
  }
  

  // Triggered when user selected In/Out Time
  // Calculates Office hour duration
  $scope.updateInOut = function(){
    $scope.manhour.timein = new Date($scope.selecteddate);
    $scope.manhour.timein.setHours($scope.manhour.timein_hour);
    $scope.manhour.timein.setMinutes($scope.manhour.timein_min);

    $scope.manhour.timeout = new Date($scope.selecteddate);
    $scope.manhour.timeout.setHours($scope.manhour.timeout_hour);
    $scope.manhour.timeout.setMinutes($scope.manhour.timeout_min);

    // Add +1 day to denote an overtime when Out hour-min is less than In hour-min combination
    if($scope.manhour.timeout.getTime() < $scope.manhour.timein.getTime()){
      $scope.manhour.timeout.setDate($scope.manhour.date.getDate() + 1);
    }else{
       $scope.manhour.timeout.setDate($scope.manhour.date.getDate());
    }

    // Recalculate Office Duration
    $scope.officeDuration = ((($scope.manhour.timeout.getTime() - $scope.manhour.timein.getTime())/3600000) * 100 / 100).toFixed(2);
     
    // Recalculate Undistributed hours
    $scope.undistributedHours = ($scope.officeDuration - $scope.totalUtilizedHours).toFixed(2);
  }


  // Draws Project Utilization fields
  $scope.drawManhourFields = function(){
   // console.log($scope.manhour);

  }


  $scope.updateTotalUtilization = function(){
    // Contains the total utilization of each project
    $scope.projectUtilizationMap = {};
    $scope.totalUtilizedHours = $scope.manhour.nonworking;
    for(var t = 0; t < $scope.manhour.tasks.length; t++){
      if(!isNaN($scope.manhour.tasks[t].duration)){
        $scope.totalUtilizedHours += $scope.manhour.tasks[t].duration;
        if(!$scope.projectUtilizationMap[$scope.manhour.tasks[t].project._id])
            $scope.projectUtilizationMap[$scope.manhour.tasks[t].project._id] = 0;
        $scope.projectUtilizationMap[$scope.manhour.tasks[t].project._id] += $scope.manhour.tasks[t].duration;
      }
    }
    $scope.totalUtilizedHours = $scope.totalUtilizedHours.toFixed(2);
    $scope.undistributedHours = ($scope.officeDuration - $scope.totalUtilizedHours).toFixed(2);

    // Show/Hide Overtime/OTY toggle
    $scope.calculateOvertimeDuration();
    var isNonWorking =  $scope.isNonWorkingDay($scope.selecteddate);
    $scope.showOvertimeOption = isNonWorking || ($scope.overtimeHours >= 1);

    // Unset Overtime if OvertimeOption will be hidden
    if(!$scope.showOvertimeOption){
      $scope.manhour.isOvertime = 0;
      $scope.manhour.otProject = null;
    }

    
    // Show OT/Y Projects
    $scope.otprojects = [];
    for(var p = 0; p < $scope.user_projects.length; p++){
      if($scope.projectUtilizationMap[$scope.user_projects[p]._id] && $scope.projectUtilizationMap[$scope.user_projects[p]._id] > 0){
        $scope.otprojects.push($scope.user_projects[p]);
      }
    }

    // Clear otproject if it isn't valid(not in options)
    var isCurrentOTProjectValid = false;
    for(var p = 0; p < $scope.otprojects.length; p++){
      if($scope.manhour.otProject == $scope.otprojects[p]._id){
        isCurrentOTProjectValid = true;
      }
    }
    $scope.manhour.otProject = isCurrentOTProjectValid ? $scope.manhour.otProject : null;

    //console.log($scope.projectUtilizationMap);
    

    // Default OT/OTY Project
    if($scope.otprojects && $scope.showOvertimeOption && $scope.otprojects[0]){
      $scope.manhour.otProject = $scope.manhour.otProject || $scope.otprojects[0]._id;
    }
  }

  $scope.$watch('manhour.isOvertime', function() {
    if(!$scope.manhour)
      return;
    $scope.calculateOvertimeDuration();
  });

  $scope.calculateOvertimeDuration = function(){
    var isNonWorking = $scope.isNonWorkingDay($scope.selecteddate);
    var regularHours = isNonWorking ? 0 : 8;
    var overtimeHours = ($scope.totalUtilizedHours - $scope.manhour.nonworking) - regularHours;
    $scope.overtimeHours = overtimeHours;
  }
  // Checks if date is a Non-Working Day
  $scope.isNonWorkingDay = function(date){
    // Check if weekend
    var isNonWorking = $scope.manhour.date.getDay() == 0 || $scope.manhour.date.getDay() == 6;
    if(!isNonWorking){
      // Check if holiday
      for(var h = 0; h < $rootScope.holidays.length; h++){
        if(new Date($rootScope.holidays[h].date).getTime() == date.getTime()){
          isNonWorking = true;
          break;
        }
      }
    }
    return isNonWorking;
  }

  $scope.deleteManhour = function(){
      // Do not allow saving of record if TimeZone Changed in client
      if(validation.isTimeZoneChanged($rootScope.clientTimeZoneOffset)){
        return;
      };
      var modalInstance = $modal.open({
        templateUrl: 'partials/confirmationModal',
        controller: 'ConfirmationModalCtrl',
        windowClass: 'confirmation-modal',
        size: 'sm',
        resolve: {
          title: function() {
            return "Confirm Delete";
          },
          message: function() {
            return "Once you delete your entry, it cannot be undone. \n Continue deleting entry for " + $filter('date')($scope.selecteddate) + "?";
          },
          okButtonPressed: function(){
            var deleteManhour = function(){
              var mh_utc_time = dateHelper.getUTCTimeMs($scope.selecteddate);
              manhour.delete({date: mh_utc_time})
                .success(function() {
                  toast.deleted();
                  $rootScope.$broadcast("redrawCalendar");

                  // workaround to force redraw util fields after delete
                  window.location = '/';

                })
                .error(function(error) {
                  toast.error(MESSAGE.DELETE_MANHOUR_FAILED);
                  console.log(MESSAGE.DELETE_MANHOUR_FAILED);
                });
            }
            return deleteManhour;
          }
      }
      });

  }

  $scope.saveManhour = function(){
  	if($scope.undistributedHours != 0){
  		toast.error(MESSAGE.SAVE_MANHOUR_UNDISTRIBUTEDHOURS);
  		return;
  	}
    
    // Do not allow saving of record if TimeZone Changed in client
    if(validation.isTimeZoneChanged($rootScope.clientTimeZoneOffset)){
      return;
    };

	  $scope.saveEnabled = false;

    var saveMode = MODELMODE.CREATE;
    if($scope.manhour._id){
      saveMode = MODELMODE.UPDATE;
    }
    console.log(saveMode);
    //console.log($scope.manhour);

    // Convert dates to UTC date before saving
    $scope.manhour.date = dateHelper.getUTCTime($scope.manhour.date);
    $scope.manhour.timein = dateHelper.getUTCTime($scope.manhour.timein);
    $scope.manhour.timeout = dateHelper.getUTCTime($scope.manhour.timeout);
    
    console.log($scope.manhour);
    // return;
    if(saveMode == MODELMODE.CREATE){
      $http.post(ROUTE.MANHOUR_SAVE, $scope.manhour)
      .success(function(data) {
        toast.saved();
        $scope.manhour._id = data.manhour._id;
        // Revert dates to Local Date
        $scope.manhour.date = dateHelper.getLocalFromUTCTime($scope.manhour.date);
        $scope.manhour.timein = dateHelper.getLocalFromUTCTime($scope.manhour.timein);
        $scope.manhour.timeout = dateHelper.getLocalFromUTCTime($scope.manhour.timeout);
        //console.log("N saved" + JSON.stringify($scope.manhour.tasks));
        $scope.saveEnabled = true;
      })
      .error(function(error) {
        toast.error(MESSAGE.SAVE_MANHOUR_FAILED +": "+ JSON.stringify(error));
        console.log(MESSAGE.SAVE_MANHOUR_FAILED);

      });
    }else{
      $http.put(ROUTE.MANHOUR_UPDATE, $scope.manhour)
      .success(function() {
        toast.saved();
        
       // Revert dates to Local Date
        $scope.manhour.date = dateHelper.getLocalFromUTCTime($scope.manhour.date);
        $scope.manhour.timein = dateHelper.getLocalFromUTCTime($scope.manhour.timein);
        $scope.manhour.timeout = dateHelper.getLocalFromUTCTime($scope.manhour.timeout);
        $scope.saveEnabled = true;
      })
      .error(function(error) {
        toast.error(MESSAGE.SAVE_MANHOUR_FAILED  +": "+ JSON.stringify(error));
        console.log(MESSAGE.SAVE_MANHOUR_FAILED);
      });
    }
    $rootScope.$broadcast("redrawCalendar");
  }

});

/**********************************************************************
 * Custom Filters
 **********************************************************************/
 manhours.filter("leftpad", function() {
  return function(number) {
    if (number !== null && number !== undefined) {
      var str = "" + number;
      while (str.length < 2) str = "0" + str;
      return str;
    }
  };
});
