/**********************************************************************
 * Constants
 **********************************************************************/
 var manhours = angular.module('manhours');
 
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
        "DELETE_MANHOUR_FAILED": "Error Deleting Manhour",
        "SAVE_MANHOUR_UNDISTRIBUTEDHOURS" : "Undistributed hours should be zero"
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
        "REPORT_PRINT": "/reports/print/",
        "REPORT_CSV": "/reports/csv/",
        "USER_PROJECT_MATES":"/api/user/mates/"
 	}
 );

 // User types
 manhours.constant(
  "USER", {
        "USERTYPE_DEVELOPER": "DEVELOPER",
        "USERTYPE_PROJECT_MANAGER": "PROJECT_MANAGER"
  });
 
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

  // Calendar 
  manhours.constant(
  "CALENDAR", {
    "DAYS" : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    "MONTHS" : ['January', 'February', 'March', 'April','May', 'June', 'July', 'August', 'September','October', 'November', 'December'],
    "CONTEXT_MENU_ITEMS": ['Whole Day VL', 'Half Day VL', 'Whole Day SL', 'Half Day SL', 'View Leaves']
  });

