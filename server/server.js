/* @flow */
import cors from "cors";
import express from "express";
import { notifHandler, smartNotifierHandler } from "hull/lib/utils";

import fetch from "./actions/fetch";
import userUpdate from "./actions/user-update";
import leadStatusList from "./actions/schema-leadstatus";
import adminHandler from "./actions/admin-handler";
import leadFields from "./actions/lead-fields";
import { contactSendFieldsAction, contactFetchFieldsAction } from "./actions/contact-fields";

export default function server(app: express) {
  app.post("/fetch", fetch);

  app.post("/smart-notifier", smartNotifierHandler({
    handlers: {
      "user:update": userUpdate({
        flowControl: {
          type: "next",
          size: parseInt(process.env.FLOW_CONTROL_SIZE, 10) || 200,
          in: parseInt(process.env.FLOW_CONTROL_IN, 10) || 5
        }
      })
    }
  }));

  app.post("/batch", notifHandler({
    userHandlerOptions: {
      maxSize: 200
    },
    handlers: {
      "user:update": userUpdate()
    }
  }));

  app.get("/leadstatuses", cors(), leadStatusList);

  app.get("/admin", adminHandler);
  app.get("/fields-contact-out", cors(), contactSendFieldsAction);
  app.get("/fields-contact-in", cors(), contactFetchFieldsAction);
  app.get("/fields-lead", cors(), leadFields);
  // app.all("/status", actions.statusCheck);

  return app;
}
