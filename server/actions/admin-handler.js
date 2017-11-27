// @flow
import { Request, Response } from "express";

export default function adminHandler(req: Request, res: Response) {
  res.render("home.html", {
    name: "Close.io"
  });
}
