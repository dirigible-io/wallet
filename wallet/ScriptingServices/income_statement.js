var systemLib = require('system');
var ioLib = require('io');

// get method type
var method = request.getMethod();
method = method.toUpperCase();

//get primary keys (one primary key is supported!)
var idParameter = getPrimaryKey();

// retrieve the id as parameter if exist 
var id = xss.escapeSql(request.getParameter(idParameter));
var count = xss.escapeSql(request.getParameter('count'));
var metadata = xss.escapeSql(request.getParameter('metadata'));
var sort = xss.escapeSql(request.getParameter('sort'));
var limit = xss.escapeSql(request.getParameter('limit'));
var offset = xss.escapeSql(request.getParameter('offset'));
var desc = xss.escapeSql(request.getParameter('desc'));

if (limit === null) {
	limit = 100;
}
if (offset === null) {
	offset = 0;
}

if(!hasConflictingParameters()){
    // switch based on method type
    if ((method === 'POST')) {
        createIncome_statement();
    } else if ((method === 'GET')) {
        readIncome_statementList();
    } else if ((method === 'DELETE')) {
        // delete
        if(isInputParameterValid(idParameter)){
            deleteIncome_statement(id);
        }
        
    } else {
        makeError(javax.servlet.http.HttpServletResponse.SC_BAD_REQUEST, 1, "Invalid HTTP Method");
    }    
}



// flush and close the response
response.getWriter().flush();
response.getWriter().close();

function hasConflictingParameters(){
    if(id !== null && count !== null){
        makeError(javax.servlet.http.HttpServletResponse.SC_EXPECTATION_FAILED, 1, "Precondition failed: conflicting parameters - id, count");
        return true;
    }
    if(id !== null && metadata !== null){
        makeError(javax.servlet.http.HttpServletResponse.SC_EXPECTATION_FAILED, 1, "Precondition failed: conflicting parameters - id, metadata");
        return true;
    }
    return false;
}

function isInputParameterValid(paramName){
    var param = request.getParameter(paramName);
    if(param === null || param === undefined){
        makeError(javax.servlet.http.HttpServletResponse.SC_PRECONDITION_FAILED, 1, "Expected parameter is missing: " + paramName);
        return false;
    }
    return true;
}

// print error
function makeError(httpCode, errCode, errMessage) {
    var body = {'err': {'code': errCode, 'message': errMessage}};
    response.setStatus(httpCode);
    response.setHeader("Content-Type", "application/json");
    response.getWriter().print(JSON.stringify(body));
}

// create entity by parsing JSON object from request body
function createIncome_statement() {
    var input = ioLib.read(request.getReader());
    var message = JSON.parse(input);
    var connection = datasource.getConnection();
    try {
        if(validInput(connection, message)){
            var sql = "INSERT INTO INCOME_STATEMENT (";
            sql += "ID";
            sql += ",";
            sql += "USER";
            sql += ",";
            sql += "TYPE";
            sql += ",";
            sql += "CATEGORY";
            sql += ",";
            sql += "VALUE";
            sql += ",";
            sql += "DATE";
            sql += ") VALUES ("; 
            sql += "?";
            sql += ",";
            sql += "?";
            sql += ",";
            sql += "?";
            sql += ",";
            sql += "?";
            sql += ",";
            sql += "?";
            sql += ",";
            sql += "?";
            sql += ")";
    
            var statement = connection.prepareStatement(sql);
            var i = 0;
            var id = db.getNext('INCOME_STATEMENT_ID');
            statement.setInt(++i, id);
            statement.setString(++i, user);
            statement.setShort(++i, message.type);
            statement.setInt(++i, message.category);
            if(message.type === 0 && message.value > 0){
                message.value *= -1;
            }
            statement.setDouble(++i, message.value);
            var js_date_date =  new Date(Date.parse(message.date));
            statement.setDate(++i, new java.sql.Date(js_date_date.getTime() + js_date_date.getTimezoneOffset()*60*1000));
            statement.executeUpdate();
            response.getWriter().println(id);
        }else{
            response.getWriter().println("Invalid input!");
        }
    } catch(e){
        var errorCode = javax.servlet.http.HttpServletResponse.SC_BAD_REQUEST;
        makeError(errorCode, errorCode, e.message);
    } finally {
        connection.close();
    }
}

function validInput(connection, message){
    var valid = true;
    var sql;
    if(message.type === 0){
        sql = "SELECT COUNT(ID) AS FOUND FROM EXPENSE_TYPE WHERE ID = ?";
    }else if(message.type === 1){
        sql = "SELECT COUNT(ID) AS FOUND FROM INCOME_TYPE WHERE ID = ?";
    }else{
        valid = false;
    }
    if(valid){
        var statement = connection.prepareStatement(sql);
        statement.setInt(1, message.category);
        statement.executeQuery();
        
        var resultSet = statement.executeQuery();
        while (resultSet.next()) {
            valid = resultSet.getInt("FOUND") === 1;
        }
    }
    return valid;
}

// read all entities and print them as JSON array to response
function readIncome_statementList() {
    var connection = datasource.getConnection();
    try {
        var result = {};
        result.income = [];
        result.expense = [];
        result.balance = 0;
        var sql = "SELECT * FROM "
        + "( "
        + "SELECT A.ID, A.TYPE, B.NAME as CATEGORY, A.VALUE, A.DATE  "
        + "FROM INCOME_STATEMENT A INNER JOIN INCOME_CATEGORY B ON A.CATEGORY = B.ID "
        + "where A.TYPE = 1 AND A.USER = ?"
        + "union "
        + "SELECT A.ID, A.TYPE, C.NAME as CATEGORY, A.VALUE, A.DATE "
        + "FROM INCOME_STATEMENT A INNER JOIN EXPENSE_CATEGORY C ON A.CATEGORY = C.ID "
        + "where A.TYPE = 0 AND A.USER = ?"
        + ") "
        + "ORDER BY TYPE DESC, DATE DESC, VALUE DESC";
        var statement = connection.prepareStatement(sql);
        statement.setString(1, user);
        statement.setString(2, user);
        var resultSet = statement.executeQuery();
        while (resultSet.next()) {
            var entity = createEntity(resultSet);
            result.balance += entity.value;
            if(resultSet.getShort("TYPE") === 1){
                result.income.push(entity);
            }else{
                result.expense.push(entity);
            }
        }
        var text = JSON.stringify(result, null, 2);
        response.getWriter().println(text);
    } catch(e){
        var errorCode = javax.servlet.http.HttpServletResponse.SC_BAD_REQUEST;
        makeError(errorCode, errorCode, e.message);
    } finally {
        connection.close();
    }
}

//create entity as JSON object from ResultSet current Row
function createEntity(resultSet, data) {
    var result = {};
	result.id = resultSet.getInt("ID");
	result.category = resultSet.getString("CATEGORY");
    result.value = resultSet.getDouble("VALUE");
    result.date = new Date(resultSet.getDate("DATE").getTime() - resultSet.getDate("DATE").getTimezoneOffset()*60*1000);
    result.date = result.date.toISOString().substring(0, 10);
    return result;
}

// delete entity
function deleteIncome_statement(id) {
    var connection = datasource.getConnection();
    try {
        var sql = "DELETE FROM INCOME_STATEMENT WHERE "+pkToSQL()+" AND USER = ?" ;
        var statement = connection.prepareStatement(sql);
        statement.setString(1, id);
        statement.setString(2, user);
        var resultSet = statement.executeUpdate();
        response.getWriter().println(id);
    } catch(e){
        var errorCode = javax.servlet.http.HttpServletResponse.SC_BAD_REQUEST;
        makeError(errorCode, errorCode, e.message);
    } finally {
        connection.close();
    }
}

function getPrimaryKeys(){
    var result = [];
    var i = 0;
    result[i++] = 'ID';
    if (result === 0) {
        throw new Exception("There is no primary key");
    } else if(result.length > 1) {
        throw new Exception("More than one Primary Key is not supported.");
    }
    return result;
}

function getPrimaryKey(){
	return getPrimaryKeys()[0].toLowerCase();
}

function pkToSQL(){
    var pks = getPrimaryKeys();
    return pks[0] + " = ?";
}
