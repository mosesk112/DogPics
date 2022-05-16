process.stdin.setEncoding("utf8");

let http = require("http");
let express = require("express");
let path = require('path');
let fs = require("fs");
let app = express();
let bodyParser = require("body-parser");
let xml = require("xmlhttprequest");

require("dotenv").config({ path: path.resolve(__dirname, '.env') })


let link;
let breed;


const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const databaseAndCollection = {db: process.env.MONGO_DB_NAME, collection:process.env.MONGO_COLLECTION};
let portNumber = process.argv[2];

const { MongoClient, ServerApiVersion } = require('mongodb');
const { table } = require("console");
async function main(){


    const uri = `mongodb+srv://${userName}:${password}@cluster0.yy7rs.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

    try {
        await client.connect();
        
        console.log(`Web server started and running at http://localhost:${portNumber}`);

        let cmd = function() {
            let dataInput = process.stdin.read();
            if (dataInput !== null) {
                let command = dataInput.trim();
                if (command === "stop") {
                    console.log("Shutting down the server");
                    process.exit(0);
                } else {
                    console.log(`Invalid command: ${command}`);
                    cmd()
                }
            }
        }
        process.stdin.on('readable',cmd);

        app.set("views",path.join(__dirname, 'templates'));
        app.use(bodyParser.urlencoded({extended:false}));

        app.get("/", (request, response) => {
            vars = loadIndex();
            response.render("index.ejs", vars);
        });

        app.post("/save", async (request, response) => {
            let pic = {name: request.body.name, breed: breed,
                link: link};
            await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(pic);
            
            vars =loadIndex();
            response.render("index.ejs", vars);
        });

        app.get("/search", (request, response) => {

            let vars = {actLink :"http://localhost:"+portNumber+"/view"};
            response.render("search.ejs", vars); 
        });
        app.get("/clear", async (request, response)=> {
            result = await client.db(databaseAndCollection.db)
                .collection(databaseAndCollection.collection)
                .deleteMany({});
            
            vars = loadIndex();
            response.render("index.ejs", vars);
        });

        app.get("/searchAll", async (request, response) => {
            const cursor = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).find();
            let result = await cursor.toArray();
            
            let vars = {viewName :"http://localhost:"+portNumber+"/searchName",
                viewBreed :"http://localhost:"+portNumber+"/searchBreed",
                table: makeTable(result)
        };
            response.render("view.ejs", vars); 
        });
        app.post("/searchName", async (request, response) => {
            let filter = {name: request.body.name};
            const cursor = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).find(filter);
            let result = await cursor.toArray(filter);
            
            let vars = {viewName :"http://localhost:"+portNumber+"/searchName",
                viewBreed :"http://localhost:"+portNumber+"/searchBreed",
                table: makeTable(result)
            };
            response.render("view.ejs", vars); 
        });

        app.post("/searchBreed", async (request, response) => {
            let filter = {breed: request.body.breed};
            const cursor = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).find(filter);
            let result = await cursor.toArray(filter);
            
            let vars = {viewName :"http://localhost:"+portNumber+"/searchName",
                viewBreed :"http://localhost:"+portNumber+"/searchBreed",
                table: makeTable(result)
            };
            response.render("view.ejs", vars); 
        });

        http.createServer(app).listen(portNumber);
    } catch (e) {
        console.error(e);
    }
}

function makeTable(result){
    let table ="<table border = 1><thead><tr><th>Name</th><th>Breed</th><th>Link</th></tr></thead>";
    result.forEach((element) =>{
        table+= "<tr><td>"+ element.name +"</td> <td>"+ element.breed +"</td><td><a href='"+element.link+"' target = _blank>link</a></td></tr>";
    });

    table += "</table>";

    return table;
}

function loadIndex(){
    var apiCall = new xml.XMLHttpRequest();

    apiCall.open("GET", "https://dog.ceo/api/breeds/image/random", false);
    apiCall.send(null);

    link =  JSON.parse(apiCall.responseText).message;
    breed = link.split("/")[4];
    let vars = {imgLink: link, breed: breed,
        actLink :"http://localhost:"+portNumber+"/save"};
    return vars;
}


main();