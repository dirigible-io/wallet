 $("#nav-main").on("click", "a", null, function () {
     $("#nav-main").collapse('hide');
 });

$('#statement a').click(function (e) {
      e.preventDefault();
      $(this).tab('show');
});


function IncomeStatementController($scope, $http){
	var url = '/dirigible/js-secured/wallet/category.js';
	var incomeStatementUrl = '/dirigible/js-secured/wallet/income_statement.js';
    
    $http.get(url).success(function(data){
        setCategoryData(data);
    });
    
    refresh();

    setDatesForDatepickers();

    $('#income_datepicker').datepicker()
    .on('changeDate', function(ev){
        var date = new Date(ev.date.valueOf());
        $scope.incomeEntry.date = date;
        $(this).datepicker('hide');
    });
    
    $('#expense_datepicker').datepicker()
    .on('changeDate', function(ev){
        var date = new Date(ev.date.valueOf());
        $scope.expenseEntry.date = date;
        $(this).datepicker('hide');
    });

    function setCategoryData(data){
        $scope.user = data.user;
        $scope.incomeCategories = data.income;
        $scope.expenseCategories = data.expense;
    }
    
    function setIncomeStatementData(data){
        $scope.full_history = data;
        $scope.history = $scope.full_history.income;
        $scope.balance = data.balance;
        $scope.selectedIncomeCategory = null;
        $scope.selectedExpenseCategory = null;
    }
    
    function setDatesForDatepickers(){
        var nowTemp = new Date();
        var now = new Date(nowTemp.getFullYear(), nowTemp.getMonth(), nowTemp.getDate(), 0, 0, 0, 0);

        
        $scope.incomeEntry.date = now;
        $scope.expenseEntry.date = now;
        
        // Disables previouse period of time in the datepicker
        // $('#income_datepicker').datepicker({
        //     onRender: function(date) {
        //         return date.valueOf() < now.valueOf() ? 'disabled' : '';
        //     }
        // });
        
        $('#income_datepicker').datepicker('setValue', now);
        $('#expense_datepicker').datepicker('setValue', now);
    }
    
    function refresh(){
        $scope.expenseEntry = {};
        $scope.incomeEntry = {};
                
        $http.get(incomeStatementUrl).success(function(data){
            setDatesForDatepickers();
            setIncomeStatementData(data);
        });
    
        $http.get(incomeStatementUrl).success(function(data){
            $scope.full_history = data;
            $scope.history = $scope.full_history.income;
            $scope.netWorth = data.netWorth;
        }); 
    }
    
    function makeToast(id, message){
        $scope.toastMessage = message;
        $(id).fadeIn(400).delay(1500).fadeOut(400);    
    }
    
    $scope.saveIncome = function(){
        var valid = $scope.selectedIncomeCategory && $scope.incomeEntry && $scope.incomeEntry.date && $scope.incomeEntry.value;
        var message = "Please fill all 'Income' fields!";
        
        if(valid){
            $scope.incomeEntry.type = 1;
            $scope.incomeEntry.category = $scope.selectedIncomeCategory.id;
            
            $http.post(incomeStatementUrl, $scope.incomeEntry)
            .success(function(response){
                refresh();
                makeToast('#toastIncome', "Income Saved!");
            }).error(function(response){
                makeToast('#toastIncome', response.err.message);
            });
        }else{
            makeToast('#toastIncome', message);
        }
    };
    
    $scope.saveExpense = function(){
        var valid = $scope.selectedExpenseCategory && $scope.expenseEntry && $scope.expenseEntry.date && $scope.expenseEntry.value;
        var message = "Please fill all 'Expense' fields!";
        
        if(valid){
            $scope.expenseEntry.type = 0;
            $scope.expenseEntry.category = $scope.selectedExpenseCategory.id;
            
            $http.post(incomeStatementUrl, $scope.expenseEntry)
            .success(function(response){
                refresh();
                makeToast('#toastExpense', "Expense Saved!");
            }).error(function(response){
                makeToast('#toastExpense', response.err.message);
            });
        }else{
            makeToast('#toastExpense', message);
        }
    };
    
    $scope.setIncomeHistory = function(income){
        if(income){
            $scope.history = $scope.full_history.income;
        }else{
            $scope.history = $scope.full_history.expense;
        }
    };
    
    $scope.deleteHistory = function(entry){
        var message = entry.value+", "+entry.category+" on "+entry.date;
        var doDelete = confirm("Do you realy want to delete '" + message + "' from your history?");
        if(doDelete){
            var primaryKey = "id";
            var deleteUrl = incomeStatementUrl+"?"+primaryKey+"="+entry[primaryKey];
            $http.delete(deleteUrl)
            .success(function(){
                refresh();
            }).error(function(response){
                $scope.errorMessage = response.err.message;
            });
        }
    };
}
