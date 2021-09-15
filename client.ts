// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as appInsights from "applicationinsights";
import * as http from "http";

// Load the .env file if it exists
import * as dotenv from "dotenv";
dotenv.config();

/*********************************************************************
 *  APPLICATION INSIGHTS SETUP
 **********************************************************************/
appInsights.setup();
appInsights.defaultClient.context.tags[appInsights.defaultClient.context.keys.cloudRole] = "TestNamespace.AI_CLIENT";
appInsights.defaultClient.context.tags[appInsights.defaultClient.context.keys.cloudRoleInstance] = "123456789";
appInsights.start();

/*********************************************************************
 *  HTTP CLIENT SETUP
 **********************************************************************/
/** A function which makes requests and handles response. */
function makeRequest() {
  // span corresponds to outgoing requests. Here, we have manually created
  // the span, which is created to track work that happens outside of the
  // request lifecycle entirely.
  http.get(
    {
      host: "localhost",
      port: 8080
    },
    (response) => {
      const body: any = [];
      response.on("data", (chunk) => body.push(chunk));
      response.on("end", () => {
        console.log(body.toString());
      });
    }
  );
}
setTimeout(() => {
  makeRequest();
}, 2000);
