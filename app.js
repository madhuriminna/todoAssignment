const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const date = require("date-fns");

let db = null;
const dbPath = path.join(__dirname, "todoApplication.db");
const app = express();
app.use(express.json());

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, (request, response) => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DataBase Error:${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};
const hasStatusAndPriority = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};
const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getQuery = "";
  const requestQuery = request.query;
  const { priority, status, search_q = "", category } = request.query;

  let output = "";
  switch (true) {
    case hasStatus(requestQuery):
      getQuery = `select * from todo
              where status='${status}' and todo like '%${search_q}%';`;
      console.log(getQuery);
      output = "Status";
      break;
    case hasPriority(requestQuery):
      getQuery = `select * from todo
              where priority='${priority}' and todo like '%${search_q}%';`;
      output = "Priority";
      break;
    case hasStatusAndPriority(requestQuery):
      getQuery = `select * from todo
              where status='${status}' and priority='${priority}' and todo like '%${search_q}%';`;
      break;
    case hasCategory(requestQuery):
      getQuery = `select * from todo
              where category='${category}' and todo like '%${search_q}%';`;
      output = "Category";
      break;
    case hasCategoryAndStatus(requestQuery):
      getQuery = `select * from todo
              where category='${category}' and status='${status}' and todo like '%${search_q}%';`;
      break;
    case hasCategoryAndPriority(requestQuery):
      getQuery = `select * from todo
              where category='${category}' and priority='${priority}' and todo like '%${search_q}%';`;
      break;
    default:
      getQuery = `select * from todo
              where todo like '%${search_q}%';`;
      output = "Status";
  }
  const result = await db.all(getQuery);
  if (result === null) {
    response.status(400);
    response.send(`Invalid Todo ${output}`);
  } else {
    response.send(result);
  }
});

app.get("/agenda/", async (request, response) => {
  const date1 = format(new Date(2021, 1, 21), "yyyy-mm-dd");
  const result = `select * from todo where 
    due_date='${date1}'`;
  const result1 = await db.get(result);
  response.send(result1);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const result = `select * from todo where
                  id=${todoId};`;
  const result1 = await db.get(result);
  response.send(result1);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        const result = `insert into todo (id,todo,priority,status,category,due_date)
          values (${id},'${todo}','${priority}',
          '${status}','${category}','${dueDate}');`;
        await db.run(result);
        response.send("Todo Successfully Added");
      } else {
        response.status(400);
        response.status("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.status("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.status("Invalid Todo Priority");
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const result = `delete from todo where id=${todoId};`;
  await db.run(result);
  response.send("Todo Deleted");
});
module.exports = app;
