/**********************************************************************
 * Angular Application
 **********************************************************************/
 var manhours = angular.module('manhours', ['ngResource', 'ui.bootstrap', 'ngTagsInput', 'ngContextMenu', 'ngToast', 'ngAnimate']);

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
                  //console.log(MESSAGE.LOGIN_FAILED);
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
      //console.log(MESSAGE.SAVE_PROJECT_FAILED);
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
    //console.log(url);
    $http.get(url).then(
      function(manhours) {
        $scope.result = manhours.data;
        $scope.showLeaves = Object.keys(manhours.data.leaveSummary).length > 0;
       
        // console.log($scope.result);
      });
     //console.log("REPORT");
     //console.log(url);
  }
  $scope.downloadCsv = function(){
    var url = ROUTE.REPORT_CSV + $scope.project._id + '/from/' + $scope.startDate.getTime() + '/to/' + $scope.endDate.getTime();
    window.location = url;
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
      //console.log($rootScope.clientTimeZoneOffset);

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
     // console.log(err);
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
 manhours.controller('CalendarCtrl', function($scope, $rootScope, $http, $modal, users, CALENDARCELL, CALENDAR, LEAVE, ROUTE, MODELMODE, projects, holidays, validation, toast, dateHelper) {
 
    $scope.cal_day_names = CALENDAR.DAYS;
    $scope.cal_months_labels = CALENDAR.MONTHS;
    $scope.contextMenuOptions = CALENDAR.CONTEXT_MENU_ITEMS;
    $scope.leaveTypes = LEAVE.types;
    $scope.cal_current_date;
    $scope.cal_month_day_weeks = [];
    $rootScope.cal_month_title = "";
    $scope.month_leaves = [];
    $scope.month_leaves_all = [];
    $scope.month_manhours = [];
    $scope.showForm = true;
    $scope.current_leave_filter = "my_projects";
    $rootScope.clientTimeZoneOffset = new Date().getTimezoneOffset();

    // Get current logged user
    $http.get(ROUTE.LOGGED_USER).then(function(result){
      $rootScope.logged_user = result.data;
    });

    // Receive broadcast to redraw calendar
    $rootScope.$on("redrawCalendar", function(event) {
        $scope.drawCalendar();
        drawCalendarDetails($scope.cal_current_date);
    });

    // Receive broadcast to select date
    $rootScope.$on("calendarNextPrev", function(event, date) {
      $scope.selectDate(date);
    });

    // Receive broadcast to force select date
    $rootScope.$on("forceSelectDate", function(event) {
        $scope.selectDate($scope.selecteddate);
    });


    // User changed the leave filter form toolbar
    $rootScope.$on("leaveFilterChanged", function(event, filter) {
      $scope.current_leave_filter = filter.mode;
      toast.leaveToggled(filter);
    });

    $scope.drawCalendar = function(){
       var firstOfMonth = dateHelper.getFirstDateOfMonth($scope.cal_current_date);
       var lastOfMonth = dateHelper.getLastDateOfMonth($scope.cal_current_date);
       var week_count = Math.ceil( (lastOfMonth.getDate() + firstOfMonth.getDay()) / 7);
       var day_count = lastOfMonth.getDate();
       var firstDayOffset = firstOfMonth.getDay();
       $rootScope.cal_month_title = $scope.cal_months_labels[$scope.cal_current_date.getMonth()] + " " + $scope.cal_current_date.getFullYear();
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
            var shouldDrawDetails = true;
            var celltype = CALENDARCELL.DEFAULT;
            if($scope.cal_current_date.getTime() == date.getTime()){
              celltype = CALENDARCELL.SELECTED;
            }else{
              if($scope.cal_current_date.getMonth() != date.getMonth()){
                celltype = CALENDARCELL.OTHERDAY;
                var shouldDrawDetails = false;
              }
            }
            if(index >= 1 && index <= day_count){
              daynum = index;
            }
            if(date.getDay() === 0 || date.getDay() === 6){
              holidayWeekendText = "Weekend";
              showContextMenu = false;
            }else{
              holidayWeekendText = null;
              showContextMenu = true;
            }
            week_days.push({index: index, date: date, celltype: celltype, shouldDrawDetails: shouldDrawDetails, contextMenuOptions: $scope.contextMenuOptions, leaveTypes: $scope.leaveTypes, showContextMenu: showContextMenu, holidayWeekendText: holidayWeekendText});
         }
         $scope.cal_month_day_weeks.push(week_days);
       }
    }
       

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
      $rootScope.cal_current_date = date;
      $scope.cal_current_date.setHours(0,0,0,0);
      
      // We're changing month, so we need to redraw the calendar
      if(redrawCalendarDates){
        // Redraw Calendar
        $scope.drawCalendar();
          
        // Redraw Calendar Details
        drawCalendarDetails(date);
      }    

      var selected_cell;
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
          $scope.cal_month_day_weeks[w][d].shouldDrawDetails = true;
          var celltype = CALENDARCELL.DEFAULT;
          if($scope.cal_current_date.getTime() == $scope.cal_month_day_weeks[w][d].date.getTime()){
             celltype = CALENDARCELL.SELECTED;
             selected_cell =  $scope.cal_month_day_weeks[w][d];
          }else{
             if($scope.cal_current_date.getMonth() !=  $scope.cal_month_day_weeks[w][d].date.getMonth()){
                celltype = CALENDARCELL.OTHERDAY;
                $scope.cal_month_day_weeks[w][d].shouldDrawDetails = false;
             }
          }
          $scope.cal_month_day_weeks[w][d].celltype = celltype;
        }
      }
      $rootScope.$broadcast("selectedDateChanged", {selectedDate: $scope.cal_current_date, manhour: $scope.manhour, on_leave: selected_cell.leave});
    }

    var drawCalendarDetails = function(date){
       // 1. Draw Holidays in Calendar Cells
       var firstOfMonth = dateHelper.getUTCTime(dateHelper.getFirstDateOfMonth(date));
       var lastOfMonth = dateHelper.getUTCTime(dateHelper.getLastDateOfMonth(date));

       var firstShownDate = new Date(firstOfMonth);
       firstShownDate.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());
       var lastShownDate = new Date(lastOfMonth);
       lastShownDate.setDate((lastOfMonth.getDate() + (6 - firstOfMonth.getDay()))-1);

       holidays.getHolidaysInDateRange(firstOfMonth, lastOfMonth).success(
        function(result){
         // console.log(result);
          for(var w = 0; w < $scope.cal_month_day_weeks.length; w++){
            for(var d = 0; d < $scope.cal_month_day_weeks[w].length; d++){
              for(var l = 0; l < result.length; l++){
                var holidayDay = dateHelper.getLocalFromUTCTime(dateHelper.getDateFromString(result[l].date));
                var cellDay = $scope.cal_month_day_weeks[w][d].date;  
                if(dateHelper.isSameDay(holidayDay, cellDay)){
                   $scope.cal_month_day_weeks[w][d].holiday = result[l];
                   $scope.cal_month_day_weeks[w][d].showContextMenu = false;
                   $scope.cal_month_day_weeks[w][d].holidayWeekendText = "Holiday";
                }
              }
            }
          }
        })
        .error(function(error){
          toast.error(error);
        });

        var isTeamMate = function(userMates, other_user){
          for(var u = 0; u < userMates.length; u++){
            if(userMates[u] === other_user){
              return true;
            }
          }
          return false;
        }
        
       
       // 3. Draw Current Logged on User UI specifics
       $http.get(ROUTE.LOGGED_USER).then(
            function(result) {
                var user_mates = [];
                users.getProjectMates(result.data.username).then(function(data){
                  user_mates = data;
                  //console.log(user_mates);
                });

                // 2. Draw Leave Count/Show Leaves link for each Calendar Cell
                var leave_url_all = ROUTE.USER_LEAVES_ALL + "from/" + firstOfMonth.getTime()+"/to/"+lastOfMonth.getTime()+"?"+new Date().getTime();
               // console.log(leave_url_all);
                $http.get(leave_url_all).then(
                  function(leaves){
                       
                      for(var w = 0; w < $scope.cal_month_day_weeks.length; w++){
                        for(var d = 0; d < $scope.cal_month_day_weeks[w].length; d++){
                          var day_leaves = [];
                          var team_day_leaves = [];
                          $scope.cal_month_day_weeks[w][d].leaves = {"all":[], "my_projects": []};
                          for(var p = 0; p < $rootScope.projects.length; p++){
                            $scope.cal_month_day_weeks[w][d].leaves["_"+$rootScope.projects[p]._id] = [];
                          }

                          for(var l = 0; l < leaves.data.length; l++){
                            var leaveDay =  dateHelper.getLocalFromUTCTime(dateHelper.getDateFromString(leaves.data[l].date));
                            var cellDay = $scope.cal_month_day_weeks[w][d].date;
                             
                            if(dateHelper.isSameDay(leaveDay, cellDay)){
                              // day_leaves.push(leaves.data[l]);

                              // all
                              $scope.cal_month_day_weeks[w][d].leaves.all.push(leaves.data[l]);

                              //projects
                              if(isTeamMate(user_mates,leaves.data[l].user.username)){
                                $scope.cal_month_day_weeks[w][d].leaves.my_projects.push(leaves.data[l]);
                              }

                              //per project
                              
                              var leave_user_projects = $scope.getUserProjectList(leaves.data[l].user);
                              for(var p = 0; p < leave_user_projects.length; p++){
                                console.log("_"+leave_user_projects);
                                  $scope.cal_month_day_weeks[w][d].leaves["_"+leave_user_projects].push(leaves.data[l]);
                              }
                            }
                          }
                        }
                      }
                });

               // 3.2 Retrieve manhours for the month and draw indicator on cells if user already inputted
               var manhour_url = ROUTE.MANHOUR_USER + result.data.username + "/from/" + firstShownDate.getTime()+"/to/"+lastShownDate.getTime()+"?"+new Date();
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

                             $scope.cal_month_day_weeks[w][d].utilization = 0;
                             // Get total utilization
                             for(var t = 0; t < manhours.data[m].tasks.length; t++){
                                $scope.cal_month_day_weeks[w][d].utilization += manhours.data[m].tasks[t].duration || 0;
                             }
                           }
                        }
                      }
                    }
                    
                    // Loading Animation 
                    setTimeout( function(){
                      document.getElementById("preloader").style.display = "none";
                      document.getElementById("manhour-container").style.opacity = 1;
                    }, 500 );

                    
              });
      });
    }

    $scope.applyLeave = function(date, type, mode){
      var leave_type_index = CALENDAR.CONTEXT_MENU_ITEMS.indexOf(type);
      var leave_type = LEAVE.types[leave_type_index].type;

      var leaveDate = dateHelper.getUTCTime(date);
      var leave = {date: leaveDate, type: leave_type};
      var leave_url = ROUTE.LEAVE_SAVE;

      // Do not allow saving of record if TimeZone Changed in client
      if(validation.isTimeZoneChanged($rootScope.clientTimeZoneOffset)){
        return;
      };

      var submit_leave = function(leave){
        $http.post(leave_url, leave)
          .success(function() {
            toast.saved();
             console.log(JSON.stringify(leave));
            $rootScope.$broadcast("redrawCalendar");
          })
          .error(function(error) {
            toast.error(error);
        });
      }

      if(mode === 0){
        leave_url = ROUTE.LEAVE_DELETE;
        submit_leave(leave);
      }else{
        // Get leave remarks
        var modalInstance = $modal.open({
          templateUrl: 'partials/userInputModal',
          controller: 'UserInputModalCtrl',
          size: 'sm',
          resolve: {
            model: function() {
              return leave;
            },
            model_field: function() {
              return "remarks";
            },
            title: function(){
              return "Leave Remarks";
            },
            input_label: function(){
              return "Remarks";
            },
            on_submit: function(){
              return submit_leave;
          }
        }
        });
      }
    }

    $scope.showLeaves = function(date, day_leaves) {
      var modalInstance = $modal.open({
        templateUrl: 'partials/userLeavesModal',
        controller: 'LeavesModalCtrl',
        windowClass: 'leaves-modal',
        size: 'md',
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

    $scope.getLeaveEntryClass = function(leave_type){
     for(var t = 0; t < LEAVE.types.length; t++){
        if(LEAVE.types[t].type === leave_type){
          return LEAVE.types[t].entryClass;
        }
      }
    }

    $scope.getUserProjectList = function(user){
      var user_projects = [];
      for(var p = 0; p < $rootScope.projects.length; p++){
        for(var m = 0; m < $rootScope.projects[p].members.length; m++){
          if($rootScope.projects[p].members[m].username === user.username){
            user_projects.push($rootScope.projects[p]._id);
            break;
          }
        }
      }
      return user_projects;
    }

    $scope.isCurrentUserLeave = function(leave){
      return(leave.user.username === $rootScope.logged_user.username);
    }
    // init
    $scope.selectDate(new Date());
});

/**********************************************************************
 * Generic User Input Modal controller
 **********************************************************************/
 manhours.controller('UserInputModalCtrl', function($scope, $rootScope, $modalInstance, title, input_label, model, model_field, on_submit){
  $scope.title = title;
  $scope.input_val;
  $scope.input_label = input_label;

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };

  $scope.ok = function() {
    model[model_field] = $scope.input_val;
    on_submit(model);
    $modalInstance.dismiss('submit');
  }
 });

/**********************************************************************
 * Calendar Toolbar controller
 **********************************************************************/
 manhours.controller('CalendarToolbarCtrl', function($scope, $rootScope, projects){

   
    $scope.leave_filters = [
    {label: "All Projects", mode: "all"},
    {label: "My Projects", mode: "my_projects"}];
    projects.getAll().then(function(data){
      $rootScope.projects = data;
      for(var p = 0; p < $rootScope.projects.length; p++){
        $scope.leave_filters.push({label: data[p].name, mode: "_"+data[p]._id});
      }
    });
    $scope.leave_filter_current = $scope.leave_filters[1];

    $scope.filterLeaveView = function(val){
      $rootScope.$broadcast("leaveFilterChanged", val);
      $scope.leave_filter_current = val;
    };

    // User changed the Date
    $rootScope.$on("selectedDateChanged", function(event, args) {
      $scope.cal_month_title = $rootScope.cal_month_title;
    });

    $scope.nextMonth = function(){
      var newDate = new Date($rootScope.cal_current_date);
      var month = newDate.getMonth() + 1;
      var nextMonthDayCount = new Date(newDate.getFullYear(),  month+1, 0).getDate();
      if(nextMonthDayCount < newDate.getDate()){
        newDate.setDate(nextMonthDayCount);
      }
      newDate.setMonth(month);

      $rootScope.$broadcast("calendarNextPrev", newDate);
      $scope.cal_month_title = $rootScope.cal_month_title;
    };

    $scope.prevMonth = function(){
      var newDate = new Date($rootScope.cal_current_date);    
      var month = newDate.getMonth() - 1;
      var nextMonthDayCount = new Date(newDate.getFullYear(),  month+1, 0).getDate();
      if(nextMonthDayCount < newDate.getDate()){
        newDate.setDate(nextMonthDayCount);
      }
      newDate.setMonth(month);
      $rootScope.$broadcast("calendarNextPrev", newDate);
      $scope.cal_month_title = $rootScope.cal_month_title;
    };
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
 manhours.controller('ManHourCtrl', function($scope, $rootScope, $filter, $modal, $http, inout, ROUTE, MESSAGE, MODELMODE, LEAVE, validation, projects, holidays, manhour, toast, dateHelper) {
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
    // TO-DO
    // $scope.on_whole_day_leave  = args.on_leave ? 
    // (args.on_leave.type == LEAVE.types[0].type ||
    // args.on_leave.type == LEAVE.types[2].type ||
    // args.on_leave.type == LEAVE.types[4].type) : false;
    $scope.on_whole_day_leave = false;
    //console.log($scope.on_whole_day_leave);
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
        var project_id = ($scope.manhour.tasks[t].project.constructor === String) ? $scope.manhour.tasks[t].project : $scope.manhour.tasks[t].project._id;
        $scope.totalUtilizedHours += $scope.manhour.tasks[t].duration;

        if(!$scope.projectUtilizationMap[project_id])
            $scope.projectUtilizationMap[project_id] = 0;
        $scope.projectUtilizationMap[project_id] += $scope.manhour.tasks[t].duration;
        //console.log("WOW TASK");
        //console.log("==>"+ project_id);
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
    //console.log("USER PROJS " +$scope.user_projects.length );
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
    //console.log(saveMode);
    //console.log($scope.manhour);

    // Convert dates to UTC date before saving
    $scope.manhour.date = dateHelper.getUTCTime($scope.manhour.date);
    $scope.manhour.timein = dateHelper.getUTCTime($scope.manhour.timein);
    $scope.manhour.timeout = dateHelper.getUTCTime($scope.manhour.timeout);
    
    //console.log($scope.manhour);
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
