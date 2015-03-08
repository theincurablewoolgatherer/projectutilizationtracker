/**********************************************************************
 * Angular Application
 **********************************************************************/
 var manhours = angular.module('manhours', ['ngResource', 'ui.bootstrap', 'ngTagsInput', 'ngContextMenu', 'ngToast']);

/**********************************************************************
 * Configuration
 **********************************************************************/
manhours.config(['ngToastProvider', function(ngToast) {
    ngToast.configure({
      horizontalPosition: 'center'
    });
}]);

/**********************************************************************
 * Constants
 **********************************************************************/
 // String Messages
 manhours.constant(
 	"MESSAGE", {
        "LOGIN_FIELDS_REQUIRED": "Username/Password required",
        "LOGIN_DETAILS_INCORRECT": "Incorrect Username/Password",
        "LOGIN_SUCESS": "Authentication successful",
        "LOGIN_FAILED": "Authentication failed",
        "LOAD_PROJECT_FAILED": "Loading Projects Failed",
        "SAVE_PROJECT_FAILED": "Saving Project Failed",
        "SAVE_MANHOUR_FAILED": "Error Saving Manhour",
        "DELETE_MANHOUR_FAILED": "Error Deleting Manhour"
 	}
 );

 // RESTful services
 manhours.constant(
 	"ROUTE", {
        "LOGIN": "/login",
        "MANHOUR": "/manhour",
        "ADMIN": "/admin",
        "LOGGED_USER": "/loggeduser",
        "USER_LIST": "/api/user/list",
        "USER_UPDATE": "/api/user/update",
        "PROJECT_DETAILS": "/api/project/",
        "PROJECT_LIST": "/api/project/list",
        "PROJECT_SAVE": "/api/project/new",
        "MANHOUR_USER": "/api/manhour/of/",
        "MANHOUR_SAVE": "/api/manhour/new",
        "MANHOUR_UPDATE": "/api/manhour/update",
        "MANHOUR_DELETE": "/api/manhour/delete",
        "USER_PROJECT_LIST": "/api/project/list/of/",
        "LEAVE_SAVE": "/api/leave/new",
        "LEAVE_DELETE": "/api/leave/delete",
        "USER_LEAVES": "/api/leave/of/",
        "USER_LEAVES_ALL": "/api/leave/",
        "HOLIDAY_DETAILS": "/api/holiday/",
        "HOLIDAY_LIST": "/api/holiday/list",
        "HOLIDAY_SAVE": "/api/holiday/new",
        "HOLIDAY_DELETE": "/api/holiday/delete",
        "REPORT_PROJECTDATERANGE": "/api/report/of/",
        "REPORT_PRINT": "/reports/print/"
 	}
 );

 // User types
 manhours.constant(
  "USER", {
        "USERTYPE_DEVELOPER": "DEVELOPER",
        "USERTYPE_PROJECT_MANAGER": "PROJECT_MANAGER"
  }
  );
  // Model modes
  manhours.constant(
  "MODELMODE", {
        "CREATE": "Create",
        "UPDATE": "Update",
        "DELETE": "Delete"
  });

  // Calendar cell types
  manhours.constant(
  "CALENDARCELL", {
    "SELECTED": "month-day-selected",
    "DEFAULT": "month-day",
    "OTHERDAY": "month-day-other"
  });

  // Calendar day names
  manhours.constant(
  "CALENDARDAY", ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  );

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
manhours.controller('HolidaysCtrl', function($scope, $rootScope, $http, ROUTE, holidays, $modal, toast) {
    $scope.holidays = [];

    $rootScope.$on("loadHolidays", function(event, args) {
      holidays.getAll().then(function(data){
        $scope.holidays = data;
      });
    });
    $rootScope.$broadcast("loadHolidays");
    $scope.showHolidayForm = function(holiday){
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
      $http.post(ROUTE.HOLIDAY_DELETE, holiday)
        .success(function() {
          toast.deleted('Holiday');
          $rootScope.$broadcast("loadHolidays");
        })
        .error(function(error) {
          toast.error(error);
          // console.log(JSON.stringify(holiday));
      });

    }
});

/**********************************************************************
 * Holiday Form controller
 **********************************************************************/
 manhours.controller('HolidaysFormCtrl', function($scope, $rootScope, $http, $modalInstance, MESSAGE, ROUTE, MODELMODE, holiday, tags, toast) {
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
    $http.post(ROUTE.HOLIDAY_SAVE, $scope.holiday)
    .success(function() {
      toast.saved();
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
 manhours.controller('CalendarCtrl', function($scope, $rootScope, $http, $modal, users, CALENDARCELL, CALENDARDAY, ROUTE, MODELMODE, toast, dateHelper) {
    $scope.cal_day_names = CALENDARDAY;
    $scope.cal_months_labels = ['January', 'February', 'March', 'April',
                     'May', 'June', 'July', 'August', 'September',
                     'October', 'November', 'December'];
    $scope.contextMenuOptions = ['Whole Day VL', 'Half Day VL', 'Whole Day SL', 'Half Day SL', 'View Leaves'];
    $scope.cal_current_date;
    $scope.cal_month_day_weeks = [];
    $scope.cal_month_title;
    $scope.month_leaves = [];
    $scope.month_leaves_all = [];
    $scope.month_manhours = [];
    $scope.showForm = true;
    // Receive broadcast to redraw calendar
    $rootScope.$on("redrawCalendar", function(event) {
        $scope.drawCalendar();
        drawCalendarDetails($scope.cal_current_date);
    });

    // Receive broadcast to force select date
    $rootScope.$on("forceSelectDate", function(event) {
        $scope.selectDate($scope.selecteddate);
    });

    // Receive broadcast to hide form
    $rootScope.$on("hideUtilForm", function(event) {
        $scope.showForm = false;
    });
    // Receive broadcast to hide form
    $rootScope.$on("showUtilForm", function(event) {
        $scope.showForm = true;
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
       

    $scope.selectDate = function(date){
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
            if(dateHelper.isSameDay($scope.cal_current_date, dateHelper.getLocalFromUTCTime(dateHelper.getDateFromString($scope.month_manhours[m].date)))){
                
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

     
    var drawCalendarDetails = function(date){
       // 1. Draw Holidays in Calendar Cells
       var firstOfMonth = dateHelper.getUTCTime(dateHelper.getFirstDateOfMonth(date));
       var lastOfMonth = dateHelper.getLastDateOfMonth(date);
       var holiday_url_all = ROUTE.HOLIDAY_LIST + "/from/" + firstOfMonth.getTime()+"/to/"+lastOfMonth.getTime()+"?"+new Date();
       $http.get(holiday_url_all).then(
          function(holidays){
          for(var w = 0; w < $scope.cal_month_day_weeks.length; w++){
            for(var d = 0; d < $scope.cal_month_day_weeks[w].length; d++){
              for(var l = 0; l < holidays.data.length; l++){
                var holidayDay = dateHelper.getLocalFromUTCTime(dateHelper.getDateFromString(holidays.data[l].date));
                var cellDay = $scope.cal_month_day_weeks[w][d].date;  
                if(dateHelper.isSameDay(holidayDay, cellDay)){
                   $scope.cal_month_day_weeks[w][d].holiday = holidays.data[l];
                }
              }
            }
          }
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
 manhours.controller('ManHourCtrl', function($scope, $rootScope, $http, inout, ROUTE, MESSAGE, MODELMODE, projects, holidays, manhour, toast, dateHelper) {
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
    
    // Initial Manhour to show
    var manhour_url = "/api" + ROUTE.MANHOUR +"/"+ $scope.selecteddate.getTime() + "/of/" + _manhour.user;
    $http.get(manhour_url).then(function(res){
      drawManHours({selectedDate: $scope.selecteddate, manhour: res.data});
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
     drawManHours(args);
  });


  var drawManHours = function(args){
    $scope.selecteddate = args.selectedDate;
     if(!args.manhour ||  !dateHelper.isSameDay($scope.selecteddate,dateHelper.getLocalFromUTCTime( dateHelper.getDateFromString(args.manhour.date)))){
        // New Manhour
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
     }else{
         
        // Manhour already exists
        $scope.manhour = manhour.buildManhour(args.manhour);
        
       
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
    $http.post(ROUTE.MANHOUR_DELETE, {date: $scope.selecteddate})
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

  $scope.saveManhour = function(){
	if($scope.undistributedHours != 0){
		toast.error("Undistributed hours should be zero.\n ");
		return;
	}
	
      var saveMode = MODELMODE.CREATE;
      if($scope.manhour._id){
        saveMode = MODELMODE.UPDATE;
      }
      
      // Convert dates to UTC date
      $scope.manhour.date = dateHelper.getUTCTime($scope.manhour.date);
      $scope.manhour.timein = dateHelper.getUTCTime($scope.manhour.timein);
      $scope.manhour.timeout = dateHelper.getUTCTime($scope.manhour.timeout);
      
      if(saveMode == MODELMODE.CREATE){
        $http.post(ROUTE.MANHOUR_SAVE, $scope.manhour)
        .success(function(data) {
          toast.saved();
          $scope.manhour._id = data.manhour._id;
          //console.log("N saved" + JSON.stringify($scope.manhour.tasks));
        })
        .error(function(error) {
          toast.error(MESSAGE.SAVE_MANHOUR_FAILED +": "+ JSON.stringify(error));
          console.log(MESSAGE.SAVE_MANHOUR_FAILED);
        });
      }else{
        // Workaround for bug: Project for each task isn't saved
        var tempTaskProject = [];
        for(var t = 0; t < $scope.manhour.tasks.length; t++){
            tempTaskProject.push($scope.manhour.tasks[t].project);
            $scope.manhour.tasks[t].project = $scope.manhour.tasks[t].project._id;
        }
        $http.put(ROUTE.MANHOUR_UPDATE, $scope.manhour)
        .success(function() {
          toast.saved();
         // Workaround for bug: Project for each task isn't saved
         for(var t = 0; t < $scope.manhour.tasks.length; t++){
              $scope.manhour.tasks[t].project = tempTaskProject[t];
         }
          //console.log("U saved" + JSON.stringify($scope.manhour.tasks));
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
 * Custom Services
 **********************************************************************/
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

    this.error = function(error){
      var msg = ngToast.create({
        content: error,
        class: 'danger'
      });
    }
 });

manhours.service('projects', function($http, ROUTE, MESSAGE) {
  this.getAll = function() {
    return $http.get(ROUTE.PROJECT_LIST).then(
      function(result) {
           return result.data;
    });
  };

  this.getUserProjects = function(){
    return $http.get(ROUTE.LOGGED_USER).then(
      function(user) {
        return $http.get(ROUTE.USER_PROJECT_LIST + user.data.username).then(
            function(projects) {
            return projects;
        }).then(function(data){
            //console.log("OUTER" + data);
            return data;
        });
      }
    );
  }
});

manhours.service('holidays', function($http, ROUTE, MESSAGE) {
  this.getAll = function() {
    return $http.get(ROUTE.HOLIDAY_LIST).then(
      function(result) {
           return result.data;
    });
  };
});

manhours.service('users', function($http, ROUTE) {
  this.getAll = function() {
    return $http.get(ROUTE.USER_LIST).then(
      function(result) {
           return result.data;
    });
  };
});

manhours.service('tags', function($q, users) {
      this.loadUsers = function(query) {
        // TODO: DUPLICATE MATCHING ALGORITHM
        // Create utility class that matches
        var deferred = $q.defer();
        var results = [];
        
        users.getAll().then(function(data){
          console.log(data);
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

manhours.service('manhour', function($http, ROUTE,dateHelper){

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
    var timeindate =  new Date(manhour.timein);
    var timeoutdate =  new Date(manhour.timeout);
    manhour.date =  new Date(manhour.date);
    manhour.timein_hour = timeindate.getHours();
    manhour.timein_min = timeindate.getMinutes();
    manhour.timeout_hour = timeoutdate.getHours();
    manhour.timeout_min = timeoutdate.getMinutes();
    manhour.isOvertime = manhour.isOvertime ? 1 : 0;
    manhour.mh_fields = [];
    
    for(var t = 0; t < manhour.tasks.length; t++){
      var mh_field = {project: manhour.tasks[t].project.name, 
                      field_name: manhour.tasks[t].task};
      manhour.mh_fields.push(mh_field);
      
    }

    // Ensures that the timein/timeout are Date objects
    manhour.timein = timeindate;
    manhour.timeout = timeoutdate;
   
     console.log(manhour); 
    return manhour;
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