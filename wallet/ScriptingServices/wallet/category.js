var systemLib = require('system');
var ioLib = require('io');

// get method type
var method = request.getMethod();
method = method.toUpperCase();

if ((method === 'GET')) {
        readIncomeStatementCategories();
} else {
    makeError(javax.servlet.http.HttpServletResponse.SC_BAD_REQUEST, 1, "Invalid HTTP Method");
}    

// flush and close the response
response.getWriter().flush();
response.getWriter().close();

// print error
function makeError(httpCode, errCode, errMessage) {
    var body = {'err': {'code': errCode, 'message': errMessage}};
    response.setStatus(httpCode);
    response.setHeader("Content-Type", "application/json");
    response.getWriter().print(JSON.stringify(body));
}

function readIncomeStatementCategories(){
    var connection = datasource.getConnection();
    try {
        var sql = "SELECT I.ID AS INCOME_ID, I.NAME AS INCOME, E.ID AS EXPENSE_ID, E.NAME AS EXPENSE FROM INCOME_CATEGORY AS I FULL JOIN EXPENSE_CATEGORY AS E ON I.ID = E.ID";
        var statement = connection.prepareStatement(sql);
        var resultSet = statement.executeQuery();
        var categories = {};
        categories.user = user;
        categories.income = [];
        categories.expense = [];
        while (resultSet.next()) {
            var income_id = resultSet.getInt("INCOME_ID");
            var expense_id = resultSet.getInt("EXPENSE_ID");
            
            
            if(income_id !== 0 && income_id !== "NULL"){
                var income = {};
                income.id = income_id;
                income.category = resultSet.getString("INCOME");
                categories.income.push(income);
            }
            if(expense_id !== null && expense_id !== "NULL"){
                var expense = {};
                expense.id = expense_id;
                expense.category = resultSet.getString("EXPENSE");
                categories.expense.push(expense);
            }
        }
        var text = JSON.stringify(categories, null, 2);
        response.getWriter().println(text);
    } catch(e){
        var errorCode = javax.servlet.http.HttpServletResponse.SC_BAD_REQUEST;
        makeError(errorCode, errorCode, e.message);
    } finally {
        connection.close();
    }
}
