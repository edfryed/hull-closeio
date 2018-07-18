/* @flow */
import type { $Application } from "express";

const cors = require("cors");
const { notifHandler, smartNotifierHandler } = require("hull/lib/utils");

const actions = require("./actions/index");

function server(app: $Application): $Application {
  app.post("/fetch", actions.fetch);

  app.post(
    "/smart-notifier",
    smartNotifierHandler({
      handlers: {
        "user:update": actions.userUpdateHandler({
          flowControl: {
            type: "next",
            size: parseInt(process.env.FLOW_CONTROL_SIZE, 10) || 200,
            in: parseInt(process.env.FLOW_CONTROL_IN, 10) || 5
          }
        })
      }
    })
  );

  app.post(
    "/batch",
    notifHandler({
      userHandlerOptions: {
        maxSize: 200
      },
      handlers: {
        "user:update": actions.userUpdateHandler()
      }
    })
  );

  app.get("/leadstatuses", cors(), actions.leadStatusList);

  app.get("/admin", actions.adminHandler);
  app.get("/fields-contact-out", cors(), actions.contactSendFields);
  app.get("/fields-contact-in", cors(), actions.contactFetchFields);
  app.get("/fields-lead", cors(), actions.leadFields);
  app.all("/status", actions.statusCheck);

  return app;
}

module.exports = server;
