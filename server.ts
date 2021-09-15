// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as appInsights from "applicationinsights";
import { EventHubProducerClient } from "@azure/event-hubs";
import { DefaultAzureCredential } from "@azure/identity";
import * as http from "http";
import * as mysql from "mysql";

// Load the .env file if it exists
import * as dotenv from "dotenv";
dotenv.config();

/*********************************************************************
 *  APPLICATION INSIGHTS SETUP
 **********************************************************************/

appInsights.setup()
  .setAutoCollectRequests(true)
  .setAutoCollectDependencies(true);

appInsights.defaultClient.context.tags[appInsights.defaultClient.context.keys.cloudRole] = "TestNamespace.AI_SERVER";
appInsights.defaultClient.context.tags[appInsights.defaultClient.context.keys.cloudRoleInstance] = "123456789";
appInsights.start();

/*********************************************************************
 *  AZURE EVENTHUB SETUP
 **********************************************************************/
/** Connect to Azure Eventhub. */
const credential = new DefaultAzureCredential();
const eventHubHost = process.env["AZURE_EVENTHUB_HOST"] || "my-host-name";
const eventHubName = process.env["AZURE_EVENTHUB_NAME"] || "my-event-hub";
const client = new EventHubProducerClient(eventHubHost, eventHubName, credential);

async function handleEventHub(response: any) {
  const partitionIds = await client.getPartitionIds();
  response.end(JSON.stringify(partitionIds));
}

/*********************************************************************
 *  MYSQL SETUP
 **********************************************************************/
/** Connect to MySQL DB. */
const mysqlHost = process.env["MYSQL_HOST"] || "localhost";
const mysqlUser = process.env["MYSQL_USER"] || "root";
const mysqlPassword = process.env["MYSQL_PASSWORD"] || "secret";
const mysqlDatabase = process.env["MYSQL_DATABASE"] || "my_db";

const connection = mysql.createConnection({
  host: mysqlHost,
  user: mysqlUser,
  password: mysqlPassword,
  database: mysqlDatabase,
});

connection.connect((err: any) => {
  if (err) {
    console.log("Failed to connect to DB, err:" + err);
  }
});

function handleConnectionQuery(response: any) {
  const query = 'SELECT 1 + 1 as solution';
  connection.query(query, (err: any, results: any, _fields: any) => {
    if (err) {
      console.log('Error code:', err.code);
      response.end(err.message);
    } else {
      response.end(`${query}: ${results[0].solution}`);
    }
  });
}

/*********************************************************************
 *  HTTP SERVER SETUP
 **********************************************************************/
/** Starts a HTTP server that receives requests on sample server port. */
let server: http.Server;
function startServer(port: number) {
  // Creates a server
  server = http.createServer(handleRequest);
  // Starts the server
  server.listen(port, () => {
    console.log(`Node HTTP listening on ${port}`);
  });
}

/** A function which handles requests and send response. */
function handleRequest(request: any, response: any) {
  const body = [];
  request.on("error", (err: Error) => console.log(err));
  request.on("data", (chunk: string) => body.push(chunk));
  request.on("end", () => {

    if (request.url == '/') {
      response.end("Hello World!");
    }
    else if (request.url == '/eventhub') {
      handleEventHub(response);
    }
    else if (request.url == '/mysql') {
      handleConnectionQuery(response);
    }
  });
}

startServer(8080);

