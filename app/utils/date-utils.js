module.exports = {
  getWeekNumber: function (date) {
    date = new Date(date.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    var week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
                        - 3 + (week1.getDay() + 6) % 7) / 7);
  },

  getOvertimehours: function (manhour, holidays){
  	var isNonWorking = manhour.date.getDay() == 0 || manhour.date.getDay() == 6;
    if(!isNonWorking){
        for(var h = 0; h < holidays.length; h++){
            if(new Date(holidays[h].date).getTime() == manhour.date.getTime()){
                isNonWorking = true;
                break;
            }
        }
    }
    
    var regWorkHours = isNonWorking ? 0 : 8;
    var officeHours = (new Date(manhour.timeout) - new Date(manhour.timein)) / 3600000;
    var overtimeHours = officeHours - manhour.nonworking - regWorkHours;

    return overtimeHours;
  }
};