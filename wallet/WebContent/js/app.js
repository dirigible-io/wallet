 $("#nav-main").on("click", "a", null, function () {
     $("#nav-main").collapse('hide');
 });

$('#statement a').click(function (e) {
      e.preventDefault();
      $(this).tab('show');
});


var url = '/dirigible/js-secured/wallet/category.js';
var incomeStatementUrl = '/dirigible/js-secured/wallet/income_statement.js';

function setTodayDateForDatepicker(id, entry){
    var nowTemp = new Date();
    var now = new Date(nowTemp.getFullYear(), nowTemp.getMonth(), nowTemp.getDate(), 0, 0, 0, 0);
    entry.date = now;
    $(id).datepicker('setValue', now);
}

function makeToast(id, message, scope){
    scope.toastMessage = message;
    $(id).fadeIn(400).delay(1500).fadeOut(400);    
}
    
function clear(id, scope){
    scope.entry = {};
    scope.selectedCategory = null;
    setTodayDateForDatepicker(id, entry);
}    

function BalanceController($scope, $http){
    $http.get(incomeStatementUrl + "?balance=true").success(function(data){
        $scope.balance = data;
    });
}

function IncomeController($scope, $http){
    $("#replaceBrand").replaceWith("Income");
    
    $scope.entry = {};
    var datepickerId = '#income_datepicker';
    
    $(datepickerId).datepicker()
    .on('changeDate', function(ev){
        var date = new Date(ev.date.valueOf());
        $scope.entry.date = date;
        $(this).datepicker('hide');
    });
    
    setTodayDateForDatepicker(datepickerId, $scope.entry);
    
    $http.get(url).success(function(data){
        $scope.categories = data.income;
    });
    
    $scope.save = function(){
        var isValid = $scope.selectedCategory && $scope.entry && $scope.entry.date && $scope.entry.value;
        var message = "Please fill all 'Income' fields!";
        
        if(isValid){
            $scope.entry.type = 1;
            $scope.entry.category = $scope.selectedCategory.id;
            
            $http.post(incomeStatementUrl, $scope.entry)
            .success(function(response){
                makeToast('#toast', "Income Saved!", $scope);
                clear(datepickerId, $scope);
            }).error(function(response){
                makeToast('#toast', response.err.message, $scope);
            });
        }else{
            makeToast('#toast', message, $scope);
        }
    };
}

function ExpenseController($scope, $http){
    $("#replaceBrand").replaceWith("Expense");
    
    $scope.entry = {};
    var datepickerId = '#expense_datepicker';
    
    $(datepickerId).datepicker()
    .on('changeDate', function(ev){
        var date = new Date(ev.date.valueOf());
        $scope.entry.date = date;
        $(this).datepicker('hide');
    });
    
    setTodayDateForDatepicker(datepickerId, $scope.entry);
    
    $http.get(url).success(function(data){
        $scope.categories = data.expense;
    });
    
    $scope.save = function(){
        var isValid = $scope.selectedCategory && $scope.entry && $scope.entry.date && $scope.entry.value;
        var message = "Please fill all 'Expense' fields!";
        
        if(isValid){
            $scope.entry.type = 0;
            $scope.entry.category = $scope.selectedCategory.id;
            
            $http.post(incomeStatementUrl, $scope.entry)
            .success(function(response){
                makeToast('#toast', "Expense Saved!", $scope);
                clear(datepickerId, $scope);
            }).error(function(response){
                makeToast('#toast', response.err.message, $scope);
            });
        }else{
            makeToast('#toast', message, $scope);
        }
    };
}

function RecordsController($scope, $http){
    $("#replaceBrand").replaceWith("Records");
    
    $http.get(incomeStatementUrl).success(function(data){
        $scope.history = data;
    });
    
    $scope.delete = function(entry){
        var message = entry.value+", "+entry.category+" on "+entry.date;
        var doDelete = confirm("Do you realy want to delete '" + message + "' from your history?");
        if(doDelete){
            var primaryKey = "id";
            var deleteUrl = incomeStatementUrl+"?"+primaryKey+"="+entry[primaryKey];
            $http.delete(deleteUrl)
            .success(function(){
                var oldHistory = $scope.history;
                $scope.history = [];
                angular.forEach(oldHistory, function(record) {
                    if (record[primaryKey] != entry[primaryKey]) {
                        $scope.history.push(record);
                    }
                });
            }).error(function(response){
                $scope.errorMessage = response.err.message;
            });
        }
    };
}

function ChartsController($scope, $http){
    $("#replaceBrand").replaceWith("Charts");
}